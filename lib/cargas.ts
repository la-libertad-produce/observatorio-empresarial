import 'server-only';
import { db } from './db';
import { registrarAuditoria, type Usuario } from './auth';
import type { FilaValida, Observacion } from './excel';

export type Carga = {
  id: number;
  subgerencia: string | null;
  usuario: string;
  archivo_nombre: string;
  n_filas: number;
  advertencias: Observacion[];
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  observacion: string | null;
  revisor: string | null;
  revisado_en: string | null;
  creado_en: string;
  usuario_id: number;
};

export async function registrarCarga(u: Usuario, archivoNombre: string, archivo: Buffer, filas: FilaValida[], advertencias: Observacion[]): Promise<number> {
  const sql = db();
  const subIds = await sql<{ subgerencia_id: number }[]>`
    select distinct subgerencia_id from indicadores where id in ${sql([...new Set(filas.map((f) => f.indicador_id))])}`;
  const subgerenciaId = subIds.length === 1 ? subIds[0].subgerencia_id : null;
  return sql.begin(async (tx) => {
    const [c] = await tx<{ id: number }[]>`
      insert into cargas (subgerencia_id, usuario_id, archivo_nombre, archivo, n_filas, advertencias)
      values (${subgerenciaId}, ${u.id}, ${archivoNombre.slice(0, 200)}, ${archivo}, ${filas.length}, ${tx.json(advertencias as never)})
      returning id`;
    const registros = filas.map((f) => ({
      indicador_id: f.indicador_id, periodo: f.periodo, fecha: f.fecha, sector_id: f.sector_id, valor: f.valor,
      observacion: f.observacion, carga_id: c.id, estado: 'pendiente',
    }));
    for (let i = 0; i < registros.length; i += 500) {
      await tx`insert into valores ${tx(registros.slice(i, i + 500))}`;
    }
    await tx`insert into auditoria (usuario_id, accion, detalle) values (${u.id}, 'carga_registrada', ${tx.json({ carga_id: c.id, filas: filas.length, archivo: archivoNombre })})`;
    return c.id;
  });
}

export async function listarCargas(filtro: { estado?: string; usuarioId?: number; subgerenciaId?: number; limite?: number } = {}): Promise<Carga[]> {
  const sql = db();
  return sql<Carga[]>`
    select c.id, s.nombre_corto as subgerencia, u.nombre as usuario, c.usuario_id, c.archivo_nombre, c.n_filas, c.advertencias, c.estado,
           c.observacion, r.nombre as revisor, c.revisado_en::text, c.creado_en::text
    from cargas c
    join usuarios u on u.id = c.usuario_id
    left join subgerencias s on s.id = c.subgerencia_id
    left join usuarios r on r.id = c.revisado_por
    where true
      ${filtro.estado ? sql`and c.estado = ${filtro.estado}` : sql``}
      ${filtro.usuarioId ? sql`and c.usuario_id = ${filtro.usuarioId}` : sql``}
      ${filtro.subgerenciaId ? sql`and c.subgerencia_id = ${filtro.subgerenciaId}` : sql``}
    order by c.creado_en desc
    limit ${filtro.limite ?? 100}`;
}

export async function obtenerCarga(id: number): Promise<Carga | null> {
  const [c] = await listarCargasPorId(id);
  return c ?? null;
}

async function listarCargasPorId(id: number) {
  return db()<Carga[]>`
    select c.id, s.nombre_corto as subgerencia, u.nombre as usuario, c.usuario_id, c.archivo_nombre, c.n_filas, c.advertencias, c.estado,
           c.observacion, r.nombre as revisor, c.revisado_en::text, c.creado_en::text
    from cargas c
    join usuarios u on u.id = c.usuario_id
    left join subgerencias s on s.id = c.subgerencia_id
    left join usuarios r on r.id = c.revisado_por
    where c.id = ${id}`;
}

export type ValorCarga = {
  codigo: string; indicador: string; unidad: string; periodo: string; sector: string; valor: number; decimales: number;
  observacion: string | null; publicado_actual: number | null;
};

export async function valoresDeCarga(cargaId: number): Promise<ValorCarga[]> {
  return db()<ValorCarga[]>`
    select i.codigo, i.nombre as indicador, i.unidad, v.periodo, coalesce(s.nombre, 'Total') as sector, v.valor, i.decimales, v.observacion,
           (select p.valor from valores p where p.indicador_id = v.indicador_id and p.periodo = v.periodo
              and coalesce(p.sector_id, 0) = coalesce(v.sector_id, 0) and p.estado = 'publicado' limit 1) as publicado_actual
    from valores v
    join indicadores i on i.id = v.indicador_id
    left join sectores s on s.id = v.sector_id
    where v.carga_id = ${cargaId}
    order by i.codigo, v.fecha, s.orden nulls first`;
}

/** Publica los valores de una carga pendiente y reemplaza los publicados anteriormente. */
export async function aprobarCarga(cargaId: number, revisor: Usuario, observacion: string | null): Promise<string | null> {
  return db().begin(async (tx) => {
    const [c] = await tx<{ estado: string }[]>`select estado from cargas where id = ${cargaId} for update`;
    if (!c) return 'La carga no existe.';
    if (c.estado !== 'pendiente') return 'La carga ya fue revisada.';
    await tx`
      update valores p set estado = 'reemplazado'
      from valores v
      where v.carga_id = ${cargaId} and p.estado = 'publicado'
        and p.indicador_id = v.indicador_id and p.periodo = v.periodo
        and coalesce(p.sector_id, 0) = coalesce(v.sector_id, 0)`;
    await tx`update valores set estado = 'publicado', publicado_en = now() where carga_id = ${cargaId}`;
    await tx`update cargas set estado = 'aprobada', revisado_por = ${revisor.id}, revisado_en = now(), observacion = ${observacion} where id = ${cargaId}`;
    await tx`insert into auditoria (usuario_id, accion, detalle) values (${revisor.id}, 'carga_aprobada', ${tx.json({ carga_id: cargaId })})`;
    return null;
  });
}

export async function rechazarCarga(cargaId: number, revisor: Usuario, observacion: string): Promise<string | null> {
  if (!observacion.trim()) return 'Indique el motivo de la devolución.';
  return db().begin(async (tx) => {
    const [c] = await tx<{ estado: string }[]>`select estado from cargas where id = ${cargaId} for update`;
    if (!c) return 'La carga no existe.';
    if (c.estado !== 'pendiente') return 'La carga ya fue revisada.';
    await tx`update valores set estado = 'rechazado' where carga_id = ${cargaId}`;
    await tx`update cargas set estado = 'rechazada', revisado_por = ${revisor.id}, revisado_en = now(), observacion = ${observacion.slice(0, 1000)} where id = ${cargaId}`;
    await tx`insert into auditoria (usuario_id, accion, detalle) values (${revisor.id}, 'carga_devuelta', ${tx.json({ carga_id: cargaId })})`;
    return null;
  });
}

export async function archivoDeCarga(cargaId: number): Promise<{ nombre: string; archivo: Buffer; usuario_id: number; subgerencia_id: number | null } | null> {
  const [r] = await db()<{ nombre: string; archivo: Buffer; usuario_id: number; subgerencia_id: number | null }[]>`
    select archivo_nombre as nombre, archivo, usuario_id, subgerencia_id from cargas where id = ${cargaId}`;
  return r ?? null;
}

export { registrarAuditoria };

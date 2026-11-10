import 'server-only';
import { db } from './db';
import { periodoAnioAnterior, type Periodicidad } from './periodos';

export type Subgerencia = { id: number; slug: string; nombre: string; nombre_corto: string; descripcion: string };

export type Indicador = {
  id: number;
  codigo: string;
  nombre: string;
  subgerencia_id: number;
  subgerencia_slug: string;
  subgerencia_corto: string;
  unidad: string;
  periodicidad: Periodicidad;
  desagrega_sector: boolean;
  definicion: string;
  metodo_calculo: string;
  fuente: string;
  decimales: number;
  permite_negativos: boolean;
  destacado: boolean;
  referencial: boolean;
  activo: boolean;
};

export type Punto = { periodo: string; valor: number };

export type IndicadorResumen = Indicador & {
  serie: Punto[];
  ultimo: Punto | null;
  anioAnterior: Punto | null;
  variacion: number | null; // % respecto al mismo periodo del año anterior
  publicado_en: string | null;
};

export async function listarSubgerencias(): Promise<Subgerencia[]> {
  return db()<Subgerencia[]>`select id, slug, nombre, nombre_corto, descripcion from subgerencias where activo order by orden, id`;
}

export async function subgerenciaPorSlug(slug: string): Promise<Subgerencia | null> {
  const [s] = await db()<Subgerencia[]>`select id, slug, nombre, nombre_corto, descripcion from subgerencias where slug = ${slug} and activo`;
  return s ?? null;
}

const COLUMNAS_INDICADOR = (sql: ReturnType<typeof db>) => sql`
  i.id, i.codigo, i.nombre, i.subgerencia_id, s.slug as subgerencia_slug, s.nombre_corto as subgerencia_corto,
  i.unidad, i.periodicidad, i.desagrega_sector, i.definicion, i.metodo_calculo, i.fuente, i.decimales,
  i.permite_negativos, i.destacado, i.referencial, i.activo`;

export async function listarIndicadores(filtro: { subgerenciaId?: number; destacados?: boolean; incluirInactivos?: boolean } = {}): Promise<Indicador[]> {
  const sql = db();
  return sql<Indicador[]>`
    select ${COLUMNAS_INDICADOR(sql)}
    from indicadores i join subgerencias s on s.id = i.subgerencia_id
    where true
      ${filtro.incluirInactivos ? sql`` : sql`and i.activo`}
      ${filtro.subgerenciaId ? sql`and i.subgerencia_id = ${filtro.subgerenciaId}` : sql``}
      ${filtro.destacados ? sql`and i.destacado` : sql``}
    order by s.orden, i.orden, i.codigo`;
}

export async function indicadorPorCodigo(codigo: string): Promise<Indicador | null> {
  const sql = db();
  const [i] = await sql<Indicador[]>`
    select ${COLUMNAS_INDICADOR(sql)}
    from indicadores i join subgerencias s on s.id = i.subgerencia_id
    where i.codigo = ${codigo} and i.activo`;
  return i ?? null;
}

/** Agrega series de totales publicados, último valor y variación interanual. */
export async function resumir(indicadores: Indicador[]): Promise<IndicadorResumen[]> {
  if (!indicadores.length) return [];
  const ids = indicadores.map((i) => i.id);
  const filas = await db()<{ indicador_id: number; periodo: string; valor: number; publicado_en: string }[]>`
    select indicador_id, periodo, valor, to_char(publicado_en, 'YYYY-MM-DD') as publicado_en
    from valores
    where estado = 'publicado' and sector_id is null and indicador_id in ${db()(ids)}
    order by fecha`;
  return indicadores.map((ind) => {
    const propias = filas.filter((f) => f.indicador_id === ind.id);
    const serie = propias.map((f) => ({ periodo: f.periodo, valor: f.valor }));
    const ultimo = serie.at(-1) ?? null;
    const anioAnterior = ultimo ? serie.find((p) => p.periodo === periodoAnioAnterior(ultimo.periodo)) ?? null : null;
    const variacion = ultimo && anioAnterior && anioAnterior.valor !== 0 ? ((ultimo.valor - anioAnterior.valor) / Math.abs(anioAnterior.valor)) * 100 : null;
    const publicado_en = propias.reduce<string | null>((m, f) => (!m || f.publicado_en > m ? f.publicado_en : m), null);
    return { ...ind, serie, ultimo, anioAnterior, variacion, publicado_en };
  });
}

export type ValorSector = { periodo: string; sector: string; valor: number };

export async function valoresPorSector(indicadorId: number): Promise<ValorSector[]> {
  return db()<ValorSector[]>`
    select v.periodo, s.nombre as sector, v.valor
    from valores v join sectores s on s.id = v.sector_id
    where v.indicador_id = ${indicadorId} and v.estado = 'publicado'
    order by v.fecha, s.orden`;
}

export async function ultimaActualizacion(subgerenciaId?: number): Promise<string | null> {
  const sql = db();
  const [r] = await sql<{ f: string | null }[]>`
    select to_char(max(v.publicado_en), 'YYYY-MM-DD') as f
    from valores v join indicadores i on i.id = v.indicador_id
    where v.estado = 'publicado' ${subgerenciaId ? sql`and i.subgerencia_id = ${subgerenciaId}` : sql``}`;
  return r?.f ?? null;
}

export type Documento = {
  id: number; sigla: string; nombre: string; norma: string; fecha_aprobacion: string | null; horizonte: string;
  organo: string; estado_vigencia: 'vigente' | 'por_confirmar' | 'en_actualizacion' | 'no_vigente'; url_documento: string | null; resumen: string;
};
export type Meta = {
  id: number; documento_id: number; orden: number; descripcion: string; unidad: string; linea_base: number | null;
  meta: number | null; ultimo_valor: number | null; fecha_reporte: string | null; fuente: string; referencial: boolean;
};

export async function listarDocumentos(): Promise<Documento[]> {
  return db()<Documento[]>`
    select id, sigla, nombre, norma, to_char(fecha_aprobacion, 'YYYY-MM-DD') as fecha_aprobacion, horizonte, organo, estado_vigencia, url_documento, resumen
    from documentos order by orden, id`;
}

export async function listarMetas(): Promise<Meta[]> {
  return db()<Meta[]>`
    select id, documento_id, orden, descripcion, unidad, linea_base, meta, ultimo_valor, to_char(fecha_reporte, 'YYYY-MM-DD') as fecha_reporte, fuente, referencial
    from metas order by documento_id, orden, id`;
}

export type Actor = {
  id: number; nombre: string; categoria: 'academia' | 'soporte' | 'gremios' | 'gobierno'; provincia: string | null; sector: string;
  descripcion: string; servicios: string; web: string | null; lat: number | null; lng: number | null; referencial: boolean;
};

export async function listarActores(): Promise<Actor[]> {
  return db()<Actor[]>`
    select id, nombre, categoria, provincia, sector, descripcion, servicios, web, lat, lng, referencial
    from actores where validado order by categoria, nombre`;
}

export type Enlace = { id: number; nombre: string; responsable: string; descripcion: string; url: string | null };
export async function listarEnlaces(): Promise<Enlace[]> {
  return db()<Enlace[]>`select id, nombre, responsable, descripcion, url from enlaces order by orden, id`;
}

export async function listarSectores(): Promise<{ id: number; nombre: string }[]> {
  return db()<{ id: number; nombre: string }[]>`select id, nombre from sectores order by orden, id`;
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { cambiarClave, cerrarSesion, exigirUsuario, iniciarSesion, registrarAuditoria } from '@/lib/auth';
import { aprobarCarga, rechazarCarga, registrarCarga } from '@/lib/cargas';
import { claveTemporal, claveValida } from '@/lib/claves';
import { db } from '@/lib/db';
import { validarArchivo, type Observacion } from '@/lib/excel';

export type Estado = { ok?: boolean; mensaje?: string } | null;
const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const numOpc = (f: FormData, k: string) => {
  const s = txt(f, k).replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

// --- Sesión -----------------------------------------------------------------

export async function ingresar(_p: Estado, f: FormData): Promise<Estado> {
  const error = await iniciarSesion(txt(f, 'email'), String(f.get('clave') ?? ''));
  if (error) return { mensaje: error };
  redirect('/panel');
}

export async function salir() {
  await cerrarSesion();
  redirect('/panel/ingresar');
}

export async function actualizarClave(_p: Estado, f: FormData): Promise<Estado> {
  const u = await exigirUsuario(undefined, true);
  const nueva = String(f.get('nueva') ?? '');
  if (nueva !== String(f.get('confirmacion') ?? '')) return { mensaje: 'La confirmación no coincide con la nueva clave.' };
  const invalida = claveValida(nueva);
  if (invalida) return { mensaje: invalida };
  const error = await cambiarClave(u.id, String(f.get('actual') ?? ''), nueva);
  if (error) return { mensaje: error };
  redirect('/panel');
}

// --- Cargas -----------------------------------------------------------------

export type EstadoCarga = { errores: Observacion[]; advertencias: Observacion[]; archivo?: string } | null;

export async function subirArchivo(_p: EstadoCarga, f: FormData): Promise<EstadoCarga> {
  const u = await exigirUsuario();
  const archivo = f.get('archivo');
  if (!(archivo instanceof File) || archivo.size === 0) return { errores: [{ fila: null, mensaje: 'Seleccione un archivo.' }], advertencias: [] };
  if (!/\.xlsx$/i.test(archivo.name)) return { errores: [{ fila: null, mensaje: 'El archivo debe tener la extensión .xlsx.' }], advertencias: [], archivo: archivo.name };
  if (archivo.size > 4 * 1024 * 1024) return { errores: [{ fila: null, mensaje: 'El archivo supera 4 MB.' }], advertencias: [], archivo: archivo.name };
  const buffer = Buffer.from(await archivo.arrayBuffer());
  const r = await validarArchivo(buffer, u);
  if (r.errores.length) return { errores: r.errores, advertencias: r.advertencias, archivo: archivo.name };
  const id = await registrarCarga(u, archivo.name, buffer, r.filas, r.advertencias);
  revalidatePath('/panel');
  redirect(`/panel/cargas/${id}?nueva=1`);
}

export async function revisarCarga(_p: Estado, f: FormData): Promise<Estado> {
  const u = await exigirUsuario(['admin', 'aprobador']);
  const id = Number(f.get('carga_id'));
  const decision = txt(f, 'decision');
  const obs = txt(f, 'observacion');
  const error = decision === 'aprobar' ? await aprobarCarga(id, u, obs || null) : await rechazarCarga(id, u, obs);
  if (error) return { mensaje: error };
  revalidatePath('/', 'layout');
  return { ok: true, mensaje: decision === 'aprobar' ? 'Carga aprobada y publicada.' : 'Carga devuelta con observaciones.' };
}

// --- Indicadores ------------------------------------------------------------

export async function guardarIndicador(_p: Estado, f: FormData): Promise<Estado> {
  const u = await exigirUsuario(['admin', 'aprobador']);
  const id = Number(f.get('id') || 0);
  const codigo = txt(f, 'codigo').toUpperCase();
  const datos = {
    codigo,
    nombre: txt(f, 'nombre'),
    subgerencia_id: Number(f.get('subgerencia_id')),
    unidad: txt(f, 'unidad'),
    periodicidad: txt(f, 'periodicidad'),
    desagrega_sector: f.get('desagrega_sector') === 'on',
    definicion: txt(f, 'definicion'),
    metodo_calculo: txt(f, 'metodo_calculo'),
    fuente: txt(f, 'fuente'),
    decimales: Number(f.get('decimales') ?? 0),
    permite_negativos: f.get('permite_negativos') === 'on',
    destacado: f.get('destacado') === 'on',
    referencial: f.get('referencial') === 'on',
    activo: f.get('activo') === 'on',
    orden: Number(f.get('orden') ?? 0) || 0,
  };
  if (!/^[A-Z0-9]{2,10}-[0-9]{2,3}$/.test(codigo)) return { mensaje: 'El código debe tener la forma AREA-01 (por ejemplo, MYPE-03).' };
  if (datos.nombre.length < 5) return { mensaje: 'Indique el nombre del indicador.' };
  if (!datos.unidad) return { mensaje: 'Indique la unidad de medida.' };
  if (!['mensual', 'trimestral', 'anual'].includes(datos.periodicidad)) return { mensaje: 'Elija la periodicidad.' };
  if (!(datos.decimales >= 0 && datos.decimales <= 4)) return { mensaje: 'Los decimales deben estar entre 0 y 4.' };
  const sql = db();
  try {
    if (id) {
      const [actual] = await sql<{ periodicidad: string; n: number }[]>`
        select i.periodicidad, (select count(*)::int from valores v where v.indicador_id = i.id) as n from indicadores i where i.id = ${id}`;
      if (actual && actual.n > 0 && actual.periodicidad !== datos.periodicidad) return { mensaje: 'No se puede cambiar la periodicidad de un indicador que ya tiene datos.' };
      await sql`update indicadores set ${sql(datos)}, actualizado_en = now() where id = ${id}`;
      await registrarAuditoria(u.id, 'indicador_editado', { id, codigo });
    } else {
      const [r] = await sql<{ id: number }[]>`insert into indicadores ${sql(datos)} returning id`;
      await registrarAuditoria(u.id, 'indicador_creado', { id: r.id, codigo });
    }
  } catch (e) {
    if (String((e as Error).message).includes('indicadores_codigo_key')) return { mensaje: `Ya existe un indicador con el código ${codigo}.` };
    throw e;
  }
  revalidatePath('/', 'layout');
  redirect('/panel/indicadores');
}

// --- Usuarios ---------------------------------------------------------------

export type EstadoUsuario = { ok?: boolean; mensaje?: string; clave?: string; email?: string } | null;

export async function crearUsuario(_p: EstadoUsuario, f: FormData): Promise<EstadoUsuario> {
  const u = await exigirUsuario(['admin']);
  const email = txt(f, 'email').toLowerCase();
  const nombre = txt(f, 'nombre');
  const rol = txt(f, 'rol');
  const sub = Number(f.get('subgerencia_id') || 0) || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { mensaje: 'Correo no válido.' };
  if (nombre.length < 3) return { mensaje: 'Indique el nombre.' };
  if (!['admin', 'aprobador', 'cargador'].includes(rol)) return { mensaje: 'Elija un rol.' };
  if (rol === 'cargador' && !sub) return { mensaje: 'Un responsable de carga debe pertenecer a una subgerencia.' };
  const clave = claveTemporal();
  try {
    await db()`insert into usuarios (email, nombre, password_hash, rol, subgerencia_id) values (${email}, ${nombre}, ${await bcrypt.hash(clave, 11)}, ${rol}, ${sub})`;
  } catch (e) {
    if (String((e as Error).message).includes('usuarios_email_key')) return { mensaje: 'Ya existe un usuario con ese correo.' };
    throw e;
  }
  await registrarAuditoria(u.id, 'usuario_creado', { email, rol });
  revalidatePath('/panel/usuarios');
  return { ok: true, clave, email };
}

export async function restablecerClave(_p: EstadoUsuario, f: FormData): Promise<EstadoUsuario> {
  const u = await exigirUsuario(['admin']);
  const id = Number(f.get('id'));
  const clave = claveTemporal();
  const [r] = await db()<{ email: string }[]>`update usuarios set password_hash = ${await bcrypt.hash(clave, 11)}, debe_cambiar_clave = true where id = ${id} returning email`;
  await db()`delete from sesiones where usuario_id = ${id}`;
  await registrarAuditoria(u.id, 'clave_restablecida', { id });
  return { ok: true, clave, email: r?.email };
}

export async function alternarUsuario(f: FormData) {
  const u = await exigirUsuario(['admin']);
  const id = Number(f.get('id'));
  if (id === u.id) return;
  await db()`update usuarios set activo = not activo where id = ${id}`;
  await db()`delete from sesiones where usuario_id = ${id}`;
  await registrarAuditoria(u.id, 'usuario_activo_cambiado', { id });
  revalidatePath('/panel/usuarios');
}

// --- Documentos y metas -----------------------------------------------------

export async function guardarDocumento(_p: Estado, f: FormData): Promise<Estado> {
  const u = await exigirUsuario(['admin', 'aprobador']);
  const id = Number(f.get('id'));
  const url = txt(f, 'url_documento');
  if (url && !/^https?:\/\/\S+$/i.test(url)) return { mensaje: 'El enlace del documento debe empezar con http:// o https://' };
  const estado = txt(f, 'estado_vigencia');
  if (!['vigente', 'por_confirmar', 'en_actualizacion', 'no_vigente'].includes(estado)) return { mensaje: 'Estado no válido.' };
  await db()`
    update documentos set nombre = ${txt(f, 'nombre')}, norma = ${txt(f, 'norma')}, fecha_aprobacion = ${txt(f, 'fecha_aprobacion') || null},
      horizonte = ${txt(f, 'horizonte')}, organo = ${txt(f, 'organo')}, estado_vigencia = ${estado}, url_documento = ${url || null}, resumen = ${txt(f, 'resumen')}
    where id = ${id}`;
  await registrarAuditoria(u.id, 'documento_editado', { id });
  revalidatePath('/documentos');
  return { ok: true, mensaje: 'Ficha guardada.' };
}

export async function guardarMeta(_p: Estado, f: FormData): Promise<Estado> {
  const u = await exigirUsuario(['admin', 'aprobador']);
  const id = Number(f.get('id') || 0);
  const documento_id = Number(f.get('documento_id'));
  const descripcion = txt(f, 'descripcion');
  const linea_base = numOpc(f, 'linea_base');
  const meta = numOpc(f, 'meta');
  const ultimo_valor = numOpc(f, 'ultimo_valor');
  if ([linea_base, meta, ultimo_valor].some((n) => Number.isNaN(n))) return { mensaje: 'Los valores deben ser números.' };
  if (descripcion.length < 5) return { mensaje: 'Describa la meta.' };
  const datos = {
    documento_id, descripcion, unidad: txt(f, 'unidad'), linea_base, meta, ultimo_valor,
    fecha_reporte: txt(f, 'fecha_reporte') || null, fuente: txt(f, 'fuente'), referencial: f.get('referencial') === 'on',
  };
  const sql = db();
  if (id) {
    await sql`update metas set ${sql(datos)} where id = ${id}`;
  } else {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from metas where documento_id = ${documento_id}`;
    if (n >= 10) return { mensaje: 'Cada documento admite hasta 10 metas prioritarias.' };
    await sql`insert into metas ${sql({ ...datos, orden: n })}`;
  }
  await registrarAuditoria(u.id, id ? 'meta_editada' : 'meta_creada', { documento_id });
  revalidatePath('/documentos');
  revalidatePath('/panel/documentos');
  return { ok: true, mensaje: 'Meta guardada.' };
}

export async function eliminarMeta(f: FormData) {
  const u = await exigirUsuario(['admin', 'aprobador']);
  const id = Number(f.get('id'));
  await db()`delete from metas where id = ${id}`;
  await registrarAuditoria(u.id, 'meta_eliminada', { id });
  revalidatePath('/panel/documentos');
  revalidatePath('/documentos');
}

// --- Ecosistema -------------------------------------------------------------

export async function decidirActor(f: FormData) {
  const u = await exigirUsuario(['admin', 'aprobador']);
  const id = Number(f.get('id'));
  const accion = txt(f, 'accion');
  if (accion === 'validar') {
    const lat = numOpc(f, 'lat');
    const lng = numOpc(f, 'lng');
    await db()`update actores set validado = true, lat = ${Number.isNaN(lat) ? null : lat}, lng = ${Number.isNaN(lng) ? null : lng} where id = ${id}`;
  } else if (accion === 'ocultar') {
    await db()`update actores set validado = false where id = ${id}`;
  } else if (accion === 'eliminar') {
    await db()`delete from actores where id = ${id}`;
  }
  await registrarAuditoria(u.id, `actor_${accion}`, { id });
  revalidatePath('/panel/ecosistema');
  revalidatePath('/ecosistema');
}

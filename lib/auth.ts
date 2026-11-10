import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from './db';

export type Rol = 'admin' | 'aprobador' | 'cargador';
export type Usuario = {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  subgerencia_id: number | null;
  subgerencia_nombre: string | null;
  debe_cambiar_clave: boolean;
};

const COOKIE = 'obs_sesion';
const DURACION_HORAS = 8;
// Hash de una cadena aleatoria: iguala el tiempo de respuesta cuando el correo no existe
const HASH_FICTICIO = '$2b$11$/c4YKqRdGNBx/6vlY.7FZOkKqOq8.AxvtAWNuSKgwonv0khZcpICa';

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export async function registrarAuditoria(usuarioId: number | null, accion: string, detalle: Record<string, unknown> = {}) {
  await db()`insert into auditoria (usuario_id, accion, detalle) values (${usuarioId}, ${accion}, ${db().json(detalle as never)})`;
}

/** Valida credenciales y crea la sesión. Devuelve un mensaje de error o null. */
export async function iniciarSesion(emailEntrada: string, clave: string): Promise<string | null> {
  const email = emailEntrada.trim().toLowerCase();
  const sql = db();
  const [{ fallos }] = await sql<{ fallos: number }[]>`
    select count(*)::int as fallos from auditoria
    where accion = 'ingreso_fallido' and detalle->>'email' = ${email} and creado_en > now() - interval '15 minutes'`;
  if (fallos >= 5) return 'Demasiados intentos fallidos. Espere 15 minutos e inténtelo de nuevo.';

  const [u] = await sql<{ id: number; password_hash: string; activo: boolean }[]>`
    select id, password_hash, activo from usuarios where email = ${email}`;
  const ok = u ? await bcrypt.compare(clave, u.password_hash) : await bcrypt.compare(clave, HASH_FICTICIO);
  if (!u || !ok || !u.activo) {
    await registrarAuditoria(u?.id ?? null, 'ingreso_fallido', { email });
    return 'Correo o clave incorrectos.';
  }

  const token = randomBytes(32).toString('base64url');
  const expira = new Date(Date.now() + DURACION_HORAS * 3600 * 1000);
  await sql`insert into sesiones (token_hash, usuario_id, expira_en) values (${hashToken(token)}, ${u.id}, ${expira})`;
  await sql`update usuarios set ultimo_acceso = now() where id = ${u.id}`;
  await sql`delete from sesiones where expira_en < now()`;
  await registrarAuditoria(u.id, 'ingreso', {});

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expira,
  });
  return null;
}

export async function cerrarSesion() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db()`delete from sesiones where token_hash = ${hashToken(token)}`;
  store.delete(COOKIE);
}

export async function usuarioActual(): Promise<Usuario | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const [u] = await db()<Usuario[]>`
    select u.id, u.email, u.nombre, u.rol, u.subgerencia_id, s.nombre as subgerencia_nombre, u.debe_cambiar_clave
    from sesiones se
    join usuarios u on u.id = se.usuario_id
    left join subgerencias s on s.id = u.subgerencia_id
    where se.token_hash = ${hashToken(token)} and se.expira_en > now() and u.activo`;
  return u ?? null;
}

/** Exige sesión (y opcionalmente un rol). Redirige al ingreso si no la hay. */
export async function exigirUsuario(roles?: Rol[], permitirCambioPendiente = false): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) redirect('/panel/ingresar');
  if (u.debe_cambiar_clave && !permitirCambioPendiente) redirect('/panel/clave');
  if (roles && !roles.includes(u.rol)) redirect('/panel');
  return u;
}

export async function cambiarClave(usuarioId: number, actual: string, nueva: string): Promise<string | null> {
  const [u] = await db()<{ password_hash: string }[]>`select password_hash from usuarios where id = ${usuarioId}`;
  if (!u || !(await bcrypt.compare(actual, u.password_hash))) return 'La clave actual no es correcta.';
  if (actual === nueva) return 'La nueva clave debe ser distinta de la actual.';
  await db()`update usuarios set password_hash = ${await bcrypt.hash(nueva, 11)}, debe_cambiar_clave = false where id = ${usuarioId}`;
  await registrarAuditoria(usuarioId, 'cambio_clave', {});
  return null;
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: 'Administrador',
  aprobador: 'Revisor (UTF-CTI)',
  cargador: 'Responsable de carga',
};

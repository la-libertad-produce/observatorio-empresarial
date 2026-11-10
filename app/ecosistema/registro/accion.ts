'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';

export type EstadoRegistro = { ok: boolean; mensaje: string } | null;

const CATEGORIAS = ['academia', 'soporte', 'gremios', 'gobierno'];

export async function registrarActor(_prev: EstadoRegistro, f: FormData): Promise<EstadoRegistro> {
  // Campo trampa para robots: si viene lleno, se descarta sin avisar
  if (String(f.get('sitio_alterno') ?? '')) return { ok: true, mensaje: 'Solicitud recibida.' };

  const nombre = String(f.get('nombre') ?? '').trim();
  const categoria = String(f.get('categoria') ?? '');
  const provincia = String(f.get('provincia') ?? '').trim();
  const sector = String(f.get('sector') ?? '').trim();
  const descripcion = String(f.get('descripcion') ?? '').trim();
  const servicios = String(f.get('servicios') ?? '').trim();
  let web = String(f.get('web') ?? '').trim();
  const contacto = String(f.get('contacto') ?? '').trim();
  const consiente = f.get('consiente') === 'on';

  if (nombre.length < 3) return { ok: false, mensaje: 'Indique el nombre de la organización.' };
  if (!CATEGORIAS.includes(categoria)) return { ok: false, mensaje: 'Elija una categoría.' };
  if (descripcion.length < 20) return { ok: false, mensaje: 'Describa brevemente a qué se dedica la organización (al menos 20 caracteres).' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contacto)) return { ok: false, mensaje: 'Indique un correo institucional de contacto válido.' };
  if (!consiente) return { ok: false, mensaje: 'Debe aceptar el tratamiento de los datos para continuar.' };
  if (web && !/^https?:\/\//i.test(web)) web = `https://${web}`;
  if (web && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(web)) return { ok: false, mensaje: 'La dirección web no es válida.' };

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconocida';
  const [{ n }] = await db()<{ n: number }[]>`
    select count(*)::int as n from auditoria where accion = 'registro_actor' and detalle->>'ip' = ${ip} and creado_en > now() - interval '1 hour'`;
  if (n >= 5) return { ok: false, mensaje: 'Se recibieron demasiadas solicitudes desde su conexión. Inténtelo más tarde.' };

  const [r] = await db()<{ id: number }[]>`
    insert into actores (nombre, categoria, provincia, sector, descripcion, servicios, web, validado)
    values (${nombre.slice(0, 200)}, ${categoria}, ${provincia || null}, ${sector.slice(0, 120)}, ${descripcion.slice(0, 600)}, ${servicios.slice(0, 600)}, ${web || null}, false)
    returning id`;
  await db()`insert into auditoria (accion, detalle) values ('registro_actor', ${db().json({ actor_id: r.id, contacto, ip })})`;
  return { ok: true, mensaje: 'Solicitud recibida. La UTF-CTI revisará la información y la publicará una vez validada.' };
}

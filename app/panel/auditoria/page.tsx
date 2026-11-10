import { exigirUsuario } from '@/lib/auth';
import { db } from '@/lib/db';
import { fechaHora } from '@/lib/formato';

const ACCIONES: Record<string, string> = {
  ingreso: 'Ingresó al panel',
  ingreso_fallido: 'Intento de ingreso fallido',
  cambio_clave: 'Cambió su clave',
  carga_registrada: 'Registró una carga',
  carga_aprobada: 'Aprobó y publicó una carga',
  carga_devuelta: 'Devolvió una carga',
  indicador_creado: 'Creó un indicador',
  indicador_editado: 'Editó un indicador',
  usuario_creado: 'Creó un usuario',
  clave_restablecida: 'Restableció una clave',
  usuario_activo_cambiado: 'Activó o desactivó un usuario',
  documento_editado: 'Editó un documento',
  meta_creada: 'Agregó una meta',
  meta_editada: 'Editó una meta',
  meta_eliminada: 'Eliminó una meta',
  registro_actor: 'Solicitud pública de registro en el ecosistema',
  actor_validar: 'Validó un actor',
  actor_ocultar: 'Ocultó un actor',
  actor_eliminar: 'Descartó un actor',
};

export default async function Auditoria() {
  await exigirUsuario(['admin']);
  const filas = await db()<{ creado_en: string; accion: string; detalle: Record<string, unknown>; usuario: string | null }[]>`
    select a.creado_en::text, a.accion, a.detalle, u.nombre as usuario
    from auditoria a left join usuarios u on u.id = a.usuario_id
    order by a.creado_en desc limit 300`;
  return (
    <>
      <div className="col">
        <span className="eyebrow">Administración</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>Historial de acciones</h1>
        <p className="texto-2">Últimas 300 acciones registradas en el sistema.</p>
      </div>
      <section className="tarjeta tabla-caja">
        <table className="tabla">
          <thead><tr><th scope="col">Fecha</th><th scope="col">Usuario</th><th scope="col">Acción</th><th scope="col">Detalle</th></tr></thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}>{fechaHora(f.creado_en)}</td>
                <td>{f.usuario ?? '—'}</td>
                <td>{ACCIONES[f.accion] ?? f.accion}</td>
                <td className="nota" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                  {Object.entries(f.detalle).filter(([k]) => k !== 'ip').map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

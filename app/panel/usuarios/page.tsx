import { ETIQUETA_ROL, exigirUsuario, type Rol } from '@/lib/auth';
import { db } from '@/lib/db';
import { listarSubgerencias } from '@/lib/datos';
import { fechaHora } from '@/lib/formato';
import { alternarUsuario } from '../acciones';
import { FormNuevoUsuario, BotonRestablecer } from './Formularios';

type Fila = { id: number; email: string; nombre: string; rol: Rol; subgerencia: string | null; activo: boolean; ultimo_acceso: string | null; debe_cambiar_clave: boolean };

export default async function Usuarios() {
  const yo = await exigirUsuario(['admin']);
  const [usuarios, subs] = await Promise.all([
    db()<Fila[]>`
      select u.id, u.email, u.nombre, u.rol, s.nombre_corto as subgerencia, u.activo, u.ultimo_acceso::text, u.debe_cambiar_clave
      from usuarios u left join subgerencias s on s.id = u.subgerencia_id order by u.activo desc, u.rol, u.nombre`,
    listarSubgerencias(),
  ]);
  return (
    <>
      <div className="col">
        <span className="eyebrow">Administración</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>Usuarios</h1>
        <p className="texto-2">
          Los responsables de carga solo ven y cargan los indicadores de su área. Los revisores de la UTF-CTI aprueban y publican. Los administradores gestionan además usuarios e historial.
        </p>
      </div>
      <section className="tarjeta tabla-caja">
        <table className="tabla">
          <thead><tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col">Área</th><th scope="col">Último acceso</th><th scope="col">Estado</th><th scope="col"><span className="sr">Acciones</span></th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{ETIQUETA_ROL[u.rol]}</td>
                <td>{u.subgerencia ?? '—'}</td>
                <td>{u.ultimo_acceso ? fechaHora(u.ultimo_acceso) : 'Nunca'}</td>
                <td>
                  <span className={`etiqueta ${u.activo ? 'ok' : ''}`}>{u.activo ? 'Activo' : 'Desactivado'}</span>
                  {u.activo && u.debe_cambiar_clave && <span className="etiqueta aviso" style={{ marginLeft: 6 }}>Clave temporal</span>}
                </td>
                <td>
                  {u.id !== yo.id && (
                    <div className="fila" style={{ gap: 8, flexWrap: 'nowrap' }}>
                      <BotonRestablecer id={u.id} />
                      <form action={alternarUsuario}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn btn-s btn-chico" type="submit">{u.activo ? 'Desactivar' : 'Activar'}</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="tarjeta pad col" style={{ gap: 14 }}>
        <h2 className="h2" style={{ fontSize: 19 }}>Nuevo usuario</h2>
        <FormNuevoUsuario subgerencias={subs.map((s) => ({ id: s.id, nombre: s.nombre }))} />
      </section>
    </>
  );
}

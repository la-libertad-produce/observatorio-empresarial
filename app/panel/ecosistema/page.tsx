import { exigirUsuario } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Actor } from '@/lib/datos';
import { CATEGORIA_ACTOR } from '@/lib/formato';
import { decidirActor } from '../acciones';

type ActorPanel = Actor & { validado: boolean; contacto: string | null };

export default async function EcosistemaPanel() {
  await exigirUsuario(['admin', 'aprobador']);
  const actores = await db()<ActorPanel[]>`
    select a.id, a.nombre, a.categoria, a.provincia, a.sector, a.descripcion, a.servicios, a.web, a.lat, a.lng, a.referencial, a.validado,
      (select au.detalle->>'contacto' from auditoria au where au.accion = 'registro_actor' and (au.detalle->>'actor_id')::int = a.id limit 1) as contacto
    from actores a order by a.validado, a.categoria, a.nombre`;
  const pendientes = actores.filter((a) => !a.validado);
  const publicados = actores.filter((a) => a.validado);

  return (
    <>
      <div className="col">
        <span className="eyebrow">Contenidos</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>Ecosistema</h1>
        <p className="texto-2">Valide las solicitudes recibidas desde el formulario público. Indique las coordenadas para mostrar al actor en el mapa (opcional).</p>
      </div>

      <section className="col" style={{ gap: 12 }}>
        <h2 className="h2" style={{ fontSize: 19 }}>Solicitudes pendientes ({pendientes.length})</h2>
        {pendientes.length === 0 && <p className="texto-2">No hay solicitudes pendientes.</p>}
        {pendientes.map((a) => (
          <article key={a.id} className="tarjeta pad col" style={{ gap: 10 }}>
            <div className="fila entre"><strong style={{ fontSize: 17 }}>{a.nombre}</strong><span className="etiqueta aviso">{CATEGORIA_ACTOR[a.categoria]}</span></div>
            <p className="texto-2" style={{ fontSize: 14 }}>{a.descripcion}</p>
            {a.servicios && <p style={{ fontSize: 14 }}><strong>Servicios:</strong> {a.servicios}</p>}
            <p className="nota" style={{ fontSize: 13 }}>
              {a.provincia ?? 'Alcance nacional o regional'} · {a.sector || 'Sin sector'} · {a.web ?? 'Sin web'} · Contacto: {a.contacto ?? 's. d.'}
            </p>
            <form action={decidirActor} className="fila" style={{ alignItems: 'flex-end' }}>
              <input type="hidden" name="id" value={a.id} />
              <label className="campo" style={{ width: 150 }}>Latitud<input name="lat" inputMode="decimal" placeholder="-8.11" /></label>
              <label className="campo" style={{ width: 150 }}>Longitud<input name="lng" inputMode="decimal" placeholder="-79.03" /></label>
              <button className="btn btn-p" type="submit" name="accion" value="validar">Validar y publicar</button>
              <button className="btn btn-peligro" type="submit" name="accion" value="eliminar">Descartar</button>
            </form>
          </article>
        ))}
      </section>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <h2 className="h2" style={{ fontSize: 19 }}>Publicados ({publicados.length})</h2>
        <div className="tabla-caja">
          <table className="tabla">
            <thead><tr><th scope="col">Nombre</th><th scope="col">Categoría</th><th scope="col">Provincia</th><th scope="col">En el mapa</th><th scope="col"><span className="sr">Acciones</span></th></tr></thead>
            <tbody>
              {publicados.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}{a.referencial && <span className="nota"> (referencial)</span>}</td>
                  <td>{CATEGORIA_ACTOR[a.categoria]}</td>
                  <td>{a.provincia ?? 'Nacional'}</td>
                  <td>{a.lat !== null ? 'Sí' : 'No'}</td>
                  <td>
                    <form action={decidirActor}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn btn-s btn-chico" type="submit" name="accion" value="ocultar">Ocultar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

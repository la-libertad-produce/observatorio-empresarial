import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirUsuario } from '@/lib/auth';
import { archivoDeCarga, obtenerCarga, valoresDeCarga } from '@/lib/cargas';
import { fechaHora, numero } from '@/lib/formato';
import { etiquetaPeriodo } from '@/lib/periodos';
import { EstadoCarga } from '@/components/EstadoCarga';
import { FormRevision } from './FormRevision';

export default async function DetalleCarga({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nueva?: string }> }) {
  const u = await exigirUsuario();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const c = await obtenerCarga(id);
  if (!c) notFound();
  if (u.rol === 'cargador') {
    const a = await archivoDeCarga(id);
    if (a?.subgerencia_id !== u.subgerencia_id) notFound();
  }
  const valores = await valoresDeCarga(id);
  const nueva = (await searchParams).nueva === '1';
  const puedeRevisar = u.rol !== 'cargador' && c.estado === 'pendiente';

  return (
    <>
      <div className="col">
        <nav className="nota" style={{ fontSize: 13 }}><Link href="/panel/cargas">Cargas</Link> / N° {c.id}</nav>
        <div className="fila entre">
          <h1 className="titulo-pag" style={{ fontSize: 28 }}>Carga N° {c.id}</h1>
          <EstadoCarga estado={c.estado} />
        </div>
      </div>

      {nueva && (
        <div className="alerta ok" role="status">
          El archivo pasó la validación y quedó registrado. La UTF-CTI lo revisará antes de publicarlo.
        </div>
      )}

      <section className="tarjeta pad">
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 24px' }}>
          {[
            ['Archivo', c.archivo_nombre],
            ['Área', c.subgerencia ?? 'Varias'],
            ['Cargado por', `${c.usuario}, ${fechaHora(c.creado_en)}`],
            ['Filas con datos', String(c.n_filas)],
            ...(c.revisado_en ? [['Revisado por', `${c.revisor}, ${fechaHora(c.revisado_en)}`]] : []),
          ].map(([t, d]) => (
            <div key={t} className="col" style={{ gap: 2 }}>
              <dt className="nota" style={{ fontWeight: 600 }}>{t}</dt>
              <dd style={{ margin: 0 }}>{d}</dd>
            </div>
          ))}
        </dl>
        {c.observacion && <div className={`alerta ${c.estado === 'rechazada' ? 'error' : 'ok'}`} style={{ marginTop: 16 }}><strong>Observación de la revisión:</strong> {c.observacion}</div>}
        <a href={`/panel/cargas/${c.id}/archivo`} style={{ display: 'inline-block', marginTop: 16, fontWeight: 600 }}>Descargar el archivo original</a>
      </section>

      {c.advertencias.length > 0 && (
        <div className="alerta aviso">
          <strong>{c.advertencias.length} {c.advertencias.length === 1 ? 'alerta' : 'alertas'} para revisar (no impiden la publicación):</strong>
          <ul>{c.advertencias.map((a, i) => <li key={i}>{a.fila ? `Fila ${a.fila}: ` : ''}{a.mensaje}</li>)}</ul>
        </div>
      )}

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <h2 className="h2" style={{ fontSize: 19 }}>Valores de la carga</h2>
        <div className="tabla-caja">
          <table className="tabla num">
            <thead><tr><th scope="col">Código</th><th scope="col">Indicador</th><th scope="col">Periodo</th><th scope="col">Sector</th><th scope="col" className="der">Valor</th><th scope="col" className="der">Publicado actual</th><th scope="col">Observación</th></tr></thead>
            <tbody>
              {valores.map((v, i) => (
                <tr key={i} className={v.publicado_actual !== null && c.estado === 'pendiente' ? 'resalte' : undefined}>
                  <td className="nw">{v.codigo}</td>
                  <td>{v.indicador}</td>
                  <td className="nw">{etiquetaPeriodo(v.periodo)}</td>
                  <td>{v.sector}</td>
                  <td className="der">{numero(v.valor, v.decimales)}</td>
                  <td className="der">{c.estado === 'pendiente' && v.publicado_actual !== null ? numero(v.publicado_actual, v.decimales) : '—'}</td>
                  <td>{v.observacion ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.estado === 'pendiente' && valores.some((v) => v.publicado_actual !== null) && (
          <p className="nota" style={{ fontSize: 13 }}>Las filas resaltadas reemplazarán un valor ya publicado.</p>
        )}
      </section>

      {puedeRevisar && <FormRevision cargaId={c.id} />}
    </>
  );
}

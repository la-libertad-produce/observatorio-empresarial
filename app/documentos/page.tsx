import Link from 'next/link';
import type { Metadata } from 'next';
import { PaginaPublica } from '@/components/Marco';
import { listarDocumentos, listarMetas, type Meta } from '@/lib/datos';
import { VIGENCIA, fecha, numero } from '@/lib/formato';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Documentos de gestión' };

function avance(m: Meta): number | null {
  if (m.ultimo_valor === null || m.meta === null || m.linea_base === null || m.meta === m.linea_base) return null;
  return Math.max(0, Math.min(100, ((m.ultimo_valor - m.linea_base) / (m.meta - m.linea_base)) * 100));
}

export default async function Documentos({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  const [docs, metas, sp] = await Promise.all([listarDocumentos(), listarMetas(), searchParams]);
  const sel = docs.find((d) => d.sigla === sp.doc) ?? docs[0];
  const propias = sel ? metas.filter((m) => m.documento_id === sel.id) : [];

  return (
    <PaginaPublica>
      <div className="contenedor">
        <div className="cabecera-pag">
          <div>
            <span className="eyebrow">Planificación regional</span>
            <h1 className="titulo-pag">Documentos de gestión</h1>
            <p className="bajada">Instrumentos de planificación del Gobierno Regional La Libertad vinculados al desarrollo productivo, con su ficha técnica y el seguimiento de sus metas prioritarias.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <nav aria-label="Documentos" className="tarjeta" style={{ flex: '1 1 260px', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {docs.map((d) => (
              <Link
                key={d.id}
                href={`/documentos?doc=${d.sigla}`}
                aria-current={d.id === sel?.id ? 'page' : undefined}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', borderRadius: 4, textDecoration: 'none', color: 'var(--tinta)',
                  background: d.id === sel?.id ? 'var(--marca-claro)' : undefined, border: `1px solid ${d.id === sel?.id ? 'var(--marca)' : 'transparent'}`,
                }}
              >
                <strong style={{ fontSize: 15 }}>{d.sigla}</strong>
                <span style={{ fontSize: 13, color: 'var(--tinta-2)' }}>{d.nombre}</span>
                <span><span className={`etiqueta ${d.estado_vigencia === 'vigente' ? 'ok' : ''}`}>{VIGENCIA[d.estado_vigencia]}</span></span>
              </Link>
            ))}
          </nav>

          {sel && (
            <div style={{ flex: '999 1 620px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <section className="tarjeta pad col" style={{ gap: 18 }}>
                <div className="fila entre" style={{ alignItems: 'flex-start' }}>
                  <div className="col" style={{ gap: 6, maxWidth: 600 }}>
                    <span className="eyebrow">Ficha técnica</span>
                    <h2 style={{ fontSize: 24 }}>{sel.nombre}</h2>
                    {sel.resumen && <p className="texto-2">{sel.resumen}</p>}
                  </div>
                  {sel.url_documento ? (
                    <a className="btn btn-p" href={sel.url_documento} target="_blank" rel="noopener noreferrer">Ver documento</a>
                  ) : (
                    <span className="etiqueta">Documento por incorporar</span>
                  )}
                </div>
                <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px 24px' }}>
                  {[
                    ['Instrumento de aprobación', sel.norma],
                    ['Fecha de aprobación', sel.fecha_aprobacion ? fecha(sel.fecha_aprobacion) : ''],
                    ['Horizonte temporal', sel.horizonte],
                    ['Órgano responsable', sel.organo],
                  ].map(([t, d]) => (
                    <div key={t} className="col" style={{ gap: 2 }}>
                      <dt className="nota" style={{ fontWeight: 600 }}>{t}</dt>
                      <dd style={{ margin: 0, fontSize: 15 }}>{d || 'Por confirmar'}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="tarjeta pad col" style={{ gap: 14 }}>
                <h2 className="h2" style={{ fontSize: 19 }}>Metas prioritarias</h2>
                {propias.length ? (
                  <>
                    <div className="tabla-caja">
                      <table className="tabla num">
                        <thead>
                          <tr><th scope="col">N°</th><th scope="col" style={{ minWidth: 240 }}>Meta</th><th scope="col" className="der">Línea de base</th><th scope="col" className="der">Meta</th><th scope="col" className="der">Último valor</th><th scope="col">Avance</th></tr>
                        </thead>
                        <tbody>
                          {propias.map((m, i) => {
                            const a = avance(m);
                            return (
                              <tr key={m.id}>
                                <td>{i + 1}</td>
                                <td>{m.descripcion}{m.referencial && <span className="nota"> (referencial)</span>}</td>
                                <td className="der">{numero(m.linea_base)}</td>
                                <td className="der">{numero(m.meta)}</td>
                                <td className="der">{m.ultimo_valor === null ? 'Sin reporte' : numero(m.ultimo_valor)}</td>
                                <td>
                                  {a === null ? (
                                    <span className="etiqueta aviso">Sin reporte oficial</span>
                                  ) : (
                                    <span className="fila" style={{ gap: 8, flexWrap: 'nowrap' }}>
                                      <span className="barra"><span style={{ width: `${a}%` }} /></span>
                                      <span>{numero(a)}%</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="nota" style={{ fontSize: 13 }}>Avance = (último valor − línea de base) / (meta − línea de base). Solo se publican valores con reporte oficial del órgano responsable.</p>
                  </>
                ) : (
                  <p className="texto-2">Las metas prioritarias de este documento están en proceso de selección con el órgano responsable.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </PaginaPublica>
  );
}

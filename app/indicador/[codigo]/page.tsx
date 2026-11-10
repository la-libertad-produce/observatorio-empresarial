import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PaginaPublica } from '@/components/Marco';
import { GraficoSectores, GraficoSerie } from '@/components/Graficos';
import { ClaseVariacion } from '@/components/TarjetaIndicador';
import { indicadorPorCodigo, resumir, valoresPorSector } from '@/lib/datos';
import { PERIODICIDAD, fecha, numero, variacion } from '@/lib/formato';
import { etiquetaPeriodo, periodoAnioAnterior } from '@/lib/periodos';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ codigo: string }>; searchParams: Promise<{ periodo?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = await indicadorPorCodigo(decodeURIComponent((await params).codigo).toUpperCase());
  return { title: i ? i.nombre : 'No encontrado' };
}

export default async function PaginaIndicador({ params, searchParams }: Props) {
  const ind0 = await indicadorPorCodigo(decodeURIComponent((await params).codigo).toUpperCase());
  if (!ind0) notFound();
  const [ind] = await resumir([ind0]);
  const sectores = ind.desagrega_sector ? await valoresPorSector(ind.id) : [];
  const periodosSector = [...new Set(sectores.map((s) => s.periodo))];
  const sp = await searchParams;
  const periodoSel = sp.periodo && periodosSector.includes(sp.periodo) ? sp.periodo : periodosSector.at(-1);
  const delPeriodo = sectores.filter((s) => s.periodo === periodoSel).sort((a, b) => b.valor - a.valor);
  const ventana = ind.serie.slice(ind.periodicidad === 'mensual' ? -24 : -12);
  const tabla = [...ind.serie].reverse();

  return (
    <PaginaPublica>
      <div className="contenedor">
        <nav aria-label="Ruta" className="nota" style={{ paddingTop: 24, fontSize: 13 }}>
          <Link href="/">Inicio</Link> / <Link href={`/${ind.subgerencia_slug}`}>{ind.subgerencia_corto}</Link> / {ind.codigo}
        </nav>
        <div className="cabecera-pag" style={{ paddingTop: 16 }}>
          <div>
            <span className="eyebrow">{ind.codigo} · {PERIODICIDAD[ind.periodicidad]}</span>
            <h1 className="titulo-pag">{ind.nombre}</h1>
            <p className="bajada">{ind.definicion}</p>
            {ind.referencial && <span><span className="etiqueta aviso">Datos referenciales de ejemplo</span></span>}
          </div>
          <a className="btn btn-s" href={`/descargas/indicador-${ind.codigo}.csv`}>Descargar CSV</a>
        </div>

        <div className="grilla" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="tarjeta pad col" style={{ gap: 4 }}>
            <span className="nota" style={{ fontSize: 13 }}>Último dato · {ind.ultimo ? etiquetaPeriodo(ind.ultimo.periodo, true) : 's. d.'}</span>
            <span className="num" style={{ fontSize: 34, fontWeight: 600 }}>{numero(ind.ultimo?.valor, ind.decimales)}</span>
            <span className="ind-unidad">{ind.unidad}</span>
          </div>
          <div className="tarjeta pad col" style={{ gap: 4 }}>
            <span className="nota" style={{ fontSize: 13 }}>Variación interanual</span>
            <span className={ClaseVariacion(ind.variacion)} style={{ fontSize: 34 }}>{variacion(ind.variacion)}</span>
            <span className="ind-unidad">frente a {ind.ultimo ? etiquetaPeriodo(periodoAnioAnterior(ind.ultimo.periodo)) : 's. d.'}: {numero(ind.anioAnterior?.valor, ind.decimales)}</span>
          </div>
          <div className="tarjeta pad col" style={{ gap: 4 }}>
            <span className="nota" style={{ fontSize: 13 }}>Publicado</span>
            <span style={{ fontSize: 22, fontWeight: 600 }}>{fecha(ind.publicado_en)}</span>
            <span className="ind-unidad">Fuente: {ind.fuente || 's. d.'}</span>
          </div>
        </div>

        <section className="tarjeta pad col" style={{ marginTop: 20, gap: 12 }}>
          <div className="fila entre"><h2 className="h2" style={{ fontSize: 19 }}>Evolución</h2><span className="nota" style={{ fontSize: 13 }}>{ind.unidad}, {ventana.length} periodos</span></div>
          {ventana.length ? (
            <GraficoSerie
              etiquetas={ventana.map((p) => etiquetaPeriodo(p.periodo))}
              valores={ventana.map((p) => p.valor)}
              unidad={ind.unidad}
              decimales={ind.decimales}
              descripcion={`Gráfico de barras de ${ind.nombre} entre ${etiquetaPeriodo(ventana[0].periodo)} y ${etiquetaPeriodo(ventana.at(-1)!.periodo)}. Los valores figuran en la tabla de datos.`}
            />
          ) : <p className="texto-2">Sin datos publicados.</p>}
          <p className="nota">Fuente: {ind.fuente}. Elaboración: Observatorio La Libertad Produce.</p>
        </section>

        {ind.desagrega_sector && periodoSel && (
          <section className="tarjeta pad col" style={{ marginTop: 20, gap: 12 }}>
            <div className="fila entre">
              <h2 className="h2" style={{ fontSize: 19 }}>Por sector o cadena · {etiquetaPeriodo(periodoSel, true)}</h2>
              <form className="fila" method="get">
                <label className="campo" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  Periodo
                  <select name="periodo" defaultValue={periodoSel} style={{ width: 'auto' }}>
                    {[...periodosSector].reverse().map((p) => <option key={p} value={p}>{etiquetaPeriodo(p)}</option>)}
                  </select>
                </label>
                <button className="btn btn-s btn-chico" type="submit">Ver</button>
              </form>
            </div>
            <GraficoSectores
              sectores={delPeriodo.map((s) => s.sector)}
              valores={delPeriodo.map((s) => s.valor)}
              unidad={ind.unidad}
              decimales={ind.decimales}
              descripcion={`Barras horizontales de ${ind.nombre} por sector en ${etiquetaPeriodo(periodoSel, true)}.`}
            />
          </section>
        )}

        <div className="grilla" style={{ marginTop: 20, alignItems: 'start' }}>
          <section className="tarjeta pad col" style={{ gap: 12 }}>
            <h2 className="h2" style={{ fontSize: 19 }}>Ficha técnica</h2>
            <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
              {[
                ['Definición', ind.definicion],
                ['Método de cálculo', ind.metodo_calculo],
                ['Unidad de medida', ind.unidad],
                ['Periodicidad', PERIODICIDAD[ind.periodicidad]],
                ['Desagregación', ind.desagrega_sector ? 'Total y por sector o cadena' : 'Total regional'],
                ['Fuente', ind.fuente],
                ['Área responsable', ind.subgerencia_corto],
              ].map(([t, d]) => (
                <div key={t} className="col" style={{ gap: 2 }}>
                  <dt className="nota" style={{ fontWeight: 600, fontSize: 12 }}>{t}</dt>
                  <dd style={{ margin: 0, fontSize: 15 }}>{d || 's. d.'}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="tarjeta pad col" style={{ gap: 12 }}>
            <h2 className="h2" style={{ fontSize: 19 }}>Tabla de datos</h2>
            <div className="tabla-caja" style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table className="tabla num">
                <thead><tr><th scope="col">Periodo</th><th scope="col" className="der">Valor</th><th scope="col" className="der">Var. interanual</th></tr></thead>
                <tbody>
                  {tabla.map((p) => {
                    const ant = ind.serie.find((x) => x.periodo === periodoAnioAnterior(p.periodo));
                    const v = ant && ant.valor !== 0 ? ((p.valor - ant.valor) / Math.abs(ant.valor)) * 100 : null;
                    return (
                      <tr key={p.periodo}>
                        <td>{etiquetaPeriodo(p.periodo)}</td>
                        <td className="der">{numero(p.valor, ind.decimales)}</td>
                        <td className={`der ${ClaseVariacion(v)}`}>{variacion(v)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </PaginaPublica>
  );
}

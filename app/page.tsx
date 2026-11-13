import Link from 'next/link';
import { PaginaPublica } from '@/components/Marco';
import { TarjetaIndicador, ClaseVariacion } from '@/components/TarjetaIndicador';
import { listarIndicadores, listarSubgerencias, resumir, ultimaActualizacion } from '@/lib/datos';
import { fecha, numero, variacion } from '@/lib/formato';
import { etiquetaPeriodo } from '@/lib/periodos';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const [subs, destacados, todos] = await Promise.all([
    listarSubgerencias(),
    listarIndicadores({ destacados: true }).then(resumir),
    listarIndicadores(),
  ]);
  const actualizaciones = await Promise.all(subs.map((s) => ultimaActualizacion(s.id)));

  return (
    <PaginaPublica>
      <section className="contenedor hero">
        <div className="hero-txt">
          <span className="eyebrow">Información productiva para la toma de decisiones</span>
          <h1>La actividad productiva de La Libertad, en un solo lugar</h1>
          <p className="bajada">
            Indicadores reportados por las subgerencias de la Gerencia Regional de la Producción, documentos de gestión con sus metas
            prioritarias y el mapa de actores del ecosistema de innovación y emprendimiento.
          </p>
          <div className="fila" style={{ marginTop: 6 }}>
            <Link className="btn btn-p" href={subs[0] ? `/${subs[0].slug}` : '/datos'}>Ver indicadores</Link>
            <Link className="btn btn-s" href="/datos">Descargar datos</Link>
          </div>
        </div>
        <aside className="tarjeta hero-lado" aria-label="Indicadores destacados">
          <span className="eyebrow">Últimos datos publicados</span>
          <div className="grilla" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {destacados.slice(0, 4).map((d) => (
              <Link key={d.id} href={`/indicador/${d.codigo}`} className="mini" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ fontSize: 13, color: 'var(--tinta-2)', lineHeight: 1.3 }}>{d.nombre}</span>
                <span className="num" style={{ fontSize: 24, fontWeight: 600 }}>{numero(d.ultimo?.valor, d.decimales)}</span>
                <span style={{ fontSize: 12, color: 'var(--tinta-3)' }}>
                  {d.ultimo ? etiquetaPeriodo(d.ultimo.periodo) : 's. d.'} · <span className={ClaseVariacion(d.variacion)}>{variacion(d.variacion)}</span>
                </span>
              </Link>
            ))}
          </div>
          <p className="nota">Variación respecto al mismo periodo del año anterior. Fuente: subgerencias de la Gerencia Regional de la Producción.</p>
        </aside>
      </section>

      <section className="contenedor seccion" aria-labelledby="t-subs">
        <h2 id="t-subs" className="h2">Indicadores por área</h2>
        <div className="grilla-3">
          {subs.map((s, i) => {
            const n = todos.filter((t) => t.subgerencia_id === s.id).length;
            return (
              <article key={s.id} className="tarjeta pad col" style={{ gap: 12 }}>
                <span className="eyebrow">{n} {n === 1 ? 'indicador' : 'indicadores'}</span>
                <h3 style={{ fontSize: 20 }}>{s.nombre}</h3>
                <p className="texto-2" style={{ fontSize: 15 }}>{s.descripcion}</p>
                <div className="fila entre" style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--linea-suave)' }}>
                  <span className="nota" style={{ fontSize: 13 }}>Actualizado: {fecha(actualizaciones[i])}</span>
                  <Link href={`/${s.slug}`} style={{ fontWeight: 600 }}>Ver indicadores</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="contenedor seccion" aria-labelledby="t-dest">
          <h2 id="t-dest" className="h2">Indicadores destacados</h2>
          <div className="grilla">
            {destacados.map((d) => <TarjetaIndicador key={d.id} ind={d} mostrarSubgerencia />)}
          </div>
        </section>
      )}

      <section style={{ background: 'var(--papel)', borderTop: '1px solid var(--linea)', borderBottom: '1px solid var(--linea)', marginTop: 24 }}>
        <div className="contenedor" style={{ paddingTop: 48, paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h2 className="h2">Cómo se actualiza la información</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              ['Carga', 'Cada subgerencia registra sus indicadores en la plantilla estándar y la sube al panel del observatorio.'],
              ['Validación', 'El sistema verifica códigos, periodos y valores, y alerta sobre variaciones atípicas antes de aceptar el archivo.'],
              ['Revisión y publicación', 'La UTF-CTI revisa cada carga y la aprueba o la devuelve con observaciones. Solo los datos aprobados se publican.'],
            ].map(([t, d], i) => (
              <li key={t} className="col">
                <span className="eyebrow" style={{ color: 'var(--marca)' }}>Paso {i + 1}</span>
                <strong style={{ fontSize: 17 }}>{t}</strong>
                <span className="texto-2" style={{ fontSize: 15 }}>{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </PaginaPublica>
  );
}

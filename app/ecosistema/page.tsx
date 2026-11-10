import Link from 'next/link';
import type { Metadata } from 'next';
import { PaginaPublica } from '@/components/Marco';
import { Ecosistema } from '@/components/Ecosistema';
import { listarActores, listarEnlaces } from '@/lib/datos';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ecosistema de innovación y emprendimiento' };

export default async function PaginaEcosistema() {
  const [actores, enlaces] = await Promise.all([listarActores(), listarEnlaces()]);
  return (
    <PaginaPublica>
      <div className="contenedor">
        <div className="cabecera-pag">
          <div>
            <span className="eyebrow">Ecosistema</span>
            <h1 className="titulo-pag">Ecosistema de innovación y emprendimiento</h1>
            <p className="bajada">Organizaciones que generan conocimiento, financian, acompañan y articulan la innovación productiva en La Libertad.</p>
          </div>
          <Link className="btn btn-p" href="/ecosistema/registro">Registrar mi organización</Link>
        </div>
        <Ecosistema actores={actores} />

        {enlaces.length > 0 && (
          <section className="seccion" style={{ paddingTop: 32 }} aria-labelledby="t-enl">
            <h2 id="t-enl" className="h2" style={{ fontSize: 19 }}>Observatorios complementarios</h2>
            <p className="texto-2" style={{ maxWidth: 760 }}>
              Para no duplicar esfuerzos, el seguimiento detallado de algunos temas está a cargo de otros observatorios de la región.
            </p>
            <div className="grilla">
              {enlaces.map((e) => (
                <article key={e.id} className="tarjeta pad col">
                  <strong>{e.nombre}</strong>
                  <span className="nota" style={{ fontSize: 13 }}>{e.responsable}</span>
                  <span className="texto-2" style={{ fontSize: 14 }}>{e.descripcion}</span>
                  {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>Visitar</a> : <span className="etiqueta" style={{ alignSelf: 'flex-start' }}>Enlace por confirmar</span>}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </PaginaPublica>
  );
}

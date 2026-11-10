import Link from 'next/link';
import { exigirUsuario } from '@/lib/auth';
import { listarDocumentos, listarMetas } from '@/lib/datos';
import { eliminarMeta } from '../acciones';
import { FormDocumento, FormMeta } from './Formularios';

export default async function DocumentosPanel({ searchParams }: { searchParams: Promise<{ doc?: string }> }) {
  await exigirUsuario(['admin', 'aprobador']);
  const [docs, metas, sp] = await Promise.all([listarDocumentos(), listarMetas(), searchParams]);
  const sel = docs.find((d) => String(d.id) === sp.doc) ?? docs[0];
  const propias = metas.filter((m) => m.documento_id === sel?.id);
  return (
    <>
      <div className="col">
        <span className="eyebrow">Contenidos</span>
        <h1 className="titulo-pag" style={{ fontSize: 30 }}>Documentos y metas</h1>
      </div>
      <nav className="chips" aria-label="Documentos">
        {docs.map((d) => (
          <Link key={d.id} href={`/panel/documentos?doc=${d.id}`} className="chip" aria-pressed={d.id === sel?.id} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{d.sigla}</Link>
        ))}
      </nav>
      {sel && (
        <>
          <section className="tarjeta pad col" style={{ gap: 14 }}>
            <h2 className="h2" style={{ fontSize: 19 }}>Ficha técnica: {sel.sigla}</h2>
            <FormDocumento key={sel.id} doc={sel} />
          </section>
          <section className="tarjeta pad col" style={{ gap: 6 }}>
            <h2 className="h2" style={{ fontSize: 19 }}>Metas prioritarias ({propias.length} de 10)</h2>
            <p className="texto-2" style={{ fontSize: 14, marginBottom: 8 }}>Registre el último valor solo cuando exista un reporte oficial del órgano responsable.</p>
            {propias.map((m, i) => (
              <details key={m.id} className="meta-ed">
                <summary>{i + 1}. {m.descripcion}</summary>
                <div className="col" style={{ gap: 10, paddingTop: 12 }}>
                  <FormMeta documentoId={sel.id} meta={m} />
                  <form action={eliminarMeta}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-peligro btn-chico" type="submit">Eliminar meta</button>
                  </form>
                </div>
              </details>
            ))}
            {propias.length < 10 && (
              <details className="meta-ed" open={propias.length === 0}>
                <summary>Agregar una meta</summary>
                <div style={{ paddingTop: 12 }}><FormMeta documentoId={sel.id} meta={null} /></div>
              </details>
            )}
          </section>
        </>
      )}
    </>
  );
}

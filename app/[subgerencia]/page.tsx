import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PaginaPublica } from '@/components/Marco';
import { TarjetaIndicador } from '@/components/TarjetaIndicador';
import { listarIndicadores, resumir, subgerenciaPorSlug, ultimaActualizacion } from '@/lib/datos';
import { fecha } from '@/lib/formato';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ subgerencia: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await subgerenciaPorSlug((await params).subgerencia);
  return { title: s ? s.nombre : 'No encontrado' };
}

export default async function PaginaSubgerencia({ params }: Props) {
  const s = await subgerenciaPorSlug((await params).subgerencia);
  if (!s) notFound();
  const [indicadores, act] = await Promise.all([listarIndicadores({ subgerenciaId: s.id }).then(resumir), ultimaActualizacion(s.id)]);

  return (
    <PaginaPublica>
      <div className="contenedor">
        <div className="cabecera-pag">
          <div>
            <span className="eyebrow">Indicadores</span>
            <h1 className="titulo-pag">{s.nombre}</h1>
            <p className="bajada">{s.descripcion}</p>
          </div>
          <span className="nota" style={{ fontSize: 13 }}>Última actualización: {fecha(act)}</span>
        </div>
        {indicadores.length ? (
          <div className="grilla">
            {indicadores.map((i) => <TarjetaIndicador key={i.id} ind={i} />)}
          </div>
        ) : (
          <div className="tarjeta pad texto-2">Esta área todavía no tiene indicadores registrados.</div>
        )}
      </div>
    </PaginaPublica>
  );
}

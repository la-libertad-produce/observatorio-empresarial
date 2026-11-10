import Link from 'next/link';
import type { IndicadorResumen } from '@/lib/datos';
import { etiquetaPeriodo } from '@/lib/periodos';
import { numero, variacion } from '@/lib/formato';

/** Línea mínima (sin ejes) con la serie de los últimos periodos. */
export function Sparkline({ valores, ancho = 120, alto = 36 }: { valores: number[]; ancho?: number; alto?: number }) {
  if (valores.length < 2) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;
  const x = (i: number) => 2 + (i * (ancho - 4)) / (valores.length - 1);
  const y = (v: number) => alto - 3 - ((v - min) / rango) * (alto - 6);
  const d = valores.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const ult = valores.length - 1;
  return (
    <svg width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`} aria-hidden="true">
      <path d={d} fill="none" stroke="#0e5a57" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(ult)} cy={y(valores[ult])} r="4" fill="#a4621a" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function ClaseVariacion(v: number | null) {
  if (v === null || Math.abs(v) < 0.05) return 'var neutra';
  return v > 0 ? 'var sube' : 'var baja';
}

export function TarjetaIndicador({ ind, mostrarSubgerencia = false }: { ind: IndicadorResumen; mostrarSubgerencia?: boolean }) {
  const ultimos = ind.serie.slice(-12).map((p) => p.valor);
  return (
    <Link href={`/indicador/${ind.codigo}`} className="tarjeta ind">
      <div className="fila entre" style={{ gap: 8 }}>
        <span className="eyebrow">{mostrarSubgerencia ? `${ind.subgerencia_corto} · ${ind.codigo}` : ind.codigo}</span>
        {ind.referencial && <span className="etiqueta aviso">Referencial</span>}
      </div>
      <span className="ind-nombre">{ind.nombre}</span>
      {ind.ultimo ? (
        <>
          <div className="col" style={{ gap: 0 }}>
            <span className="ind-valor num">{numero(ind.ultimo.valor, ind.decimales)}</span>
            <span className="ind-unidad">{ind.unidad} · {etiquetaPeriodo(ind.ultimo.periodo, true)}</span>
          </div>
          <div className="ind-pie">
            <div className="col" style={{ gap: 0 }}>
              <span className={ClaseVariacion(ind.variacion)}>{variacion(ind.variacion)}</span>
              <span className="ind-unidad">respecto al mismo periodo del año anterior</span>
            </div>
            <Sparkline valores={ultimos} />
          </div>
        </>
      ) : (
        <span className="texto-2">Aún no hay datos publicados.</span>
      )}
    </Link>
  );
}

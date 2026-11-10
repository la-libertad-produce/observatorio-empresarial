// Utilidades para periodos de los indicadores.
// Formatos canónicos: mensual "2026-09", trimestral "2026-T3", anual "2026".

export type Periodicidad = 'mensual' | 'trimestral' | 'anual';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

export const FORMATO_PERIODO: Record<Periodicidad, string> = {
  mensual: 'AAAA-MM (por ejemplo, 2026-09)',
  trimestral: 'AAAA-T# (por ejemplo, 2026-T3)',
  anual: 'AAAA (por ejemplo, 2026)',
};

export type PeriodoParseado = { periodo: string; fecha: string; anio: number; indice: number };

/** Normaliza y valida un periodo. Devuelve null si no corresponde a la periodicidad. */
export function parsePeriodo(entrada: unknown, periodicidad: Periodicidad): PeriodoParseado | null {
  if (entrada === null || entrada === undefined) return null;
  let texto: string;
  if (entrada instanceof Date) {
    // Excel puede convertir "2026-09" en fecha
    if (periodicidad !== 'mensual') return null;
    texto = `${entrada.getUTCFullYear()}-${String(entrada.getUTCMonth() + 1).padStart(2, '0')}`;
  } else {
    texto = String(entrada).trim().toUpperCase();
  }
  if (periodicidad === 'mensual') {
    const m = /^(\d{4})[-/](\d{1,2})$/.exec(texto);
    if (!m) return null;
    const anio = Number(m[1]);
    const mes = Number(m[2]);
    if (mes < 1 || mes > 12) return null;
    const mm = String(mes).padStart(2, '0');
    return { periodo: `${anio}-${mm}`, fecha: `${anio}-${mm}-01`, anio, indice: mes };
  }
  if (periodicidad === 'trimestral') {
    const m = /^(\d{4})[-\s]?T([1-4])$/.exec(texto);
    if (!m) return null;
    const anio = Number(m[1]);
    const t = Number(m[2]);
    const mes = String((t - 1) * 3 + 1).padStart(2, '0');
    return { periodo: `${anio}-T${t}`, fecha: `${anio}-${mes}-01`, anio, indice: t };
  }
  const m = /^(\d{4})$/.exec(texto);
  if (!m) return null;
  const anio = Number(m[1]);
  return { periodo: `${anio}`, fecha: `${anio}-01-01`, anio, indice: 1 };
}

export function etiquetaPeriodo(periodo: string, largo = false): string {
  const mm = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (mm) {
    const i = Number(mm[2]) - 1;
    return largo ? `${MESES_LARGOS[i]} de ${mm[1]}` : `${MESES[i]} ${mm[1]}`;
  }
  const tt = /^(\d{4})-T(\d)$/.exec(periodo);
  if (tt) return largo ? `${['primer', 'segundo', 'tercer', 'cuarto'][Number(tt[2]) - 1]} trimestre de ${tt[1]}` : `T${tt[2]} ${tt[1]}`;
  return periodo;
}

/** Periodo equivalente del año anterior. */
export function periodoAnioAnterior(periodo: string): string {
  const mm = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (mm) return `${Number(mm[1]) - 1}-${mm[2]}`;
  const tt = /^(\d{4})-T(\d)$/.exec(periodo);
  if (tt) return `${Number(tt[1]) - 1}-T${tt[2]}`;
  return String(Number(periodo) - 1);
}

/** Periodo siguiente al indicado. */
export function periodoSiguiente(periodo: string): string {
  const mm = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (mm) {
    let a = Number(mm[1]);
    let m = Number(mm[2]) + 1;
    if (m > 12) { m = 1; a += 1; }
    return `${a}-${String(m).padStart(2, '0')}`;
  }
  const tt = /^(\d{4})-T(\d)$/.exec(periodo);
  if (tt) {
    let a = Number(tt[1]);
    let t = Number(tt[2]) + 1;
    if (t > 4) { t = 1; a += 1; }
    return `${a}-T${t}`;
  }
  return String(Number(periodo) + 1);
}

/** Último periodo completo a la fecha (el mes o trimestre anterior, o el año anterior). */
export function periodoReciente(periodicidad: Periodicidad, hoy = new Date()): string {
  const a = hoy.getFullYear();
  const m = hoy.getMonth() + 1;
  if (periodicidad === 'mensual') return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
  if (periodicidad === 'trimestral') {
    const t = Math.ceil(m / 3) - 1;
    return t === 0 ? `${a - 1}-T4` : `${a}-T${t}`;
  }
  return String(a - 1);
}

export function esFuturo(fecha: string, hoy = new Date()): boolean {
  const limite = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return new Date(`${fecha}T00:00:00`) > limite;
}

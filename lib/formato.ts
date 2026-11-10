// Formatos numéricos y de fecha en español del Perú.

// Convención de las publicaciones del BCRP: coma decimal y espacio como separador de miles.
export function formatoNumero(v: number, decimales = 0): string {
  const [entero, fraccion] = Math.abs(v).toFixed(decimales).split('.');
  const agrupado = entero.length > 3 ? entero.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : entero;
  const signo = v < 0 && Number(Math.abs(v).toFixed(decimales)) !== 0 ? '−' : '';
  return `${signo}${agrupado}${fraccion ? `,${fraccion}` : ''}`;
}

export function numero(v: number | null | undefined, decimales = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return 's. d.';
  return formatoNumero(v, decimales);
}

export function variacion(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return 's. d.';
  if (Math.abs(v) < 0.05) return '0,0%';
  return `${v > 0 ? '+' : '−'}${formatoNumero(Math.abs(v), 1)}%`;
}

export function fecha(iso: string | null | undefined): string {
  if (!iso) return 's. d.';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(d).replace('.', '');
}

export function fechaHora(d: Date | string): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(d));
}

export const PERIODICIDAD: Record<string, string> = { mensual: 'Mensual', trimestral: 'Trimestral', anual: 'Anual' };

export const CATEGORIA_ACTOR: Record<string, string> = {
  academia: 'Academia y CITE',
  soporte: 'Soporte al emprendimiento',
  gremios: 'Gremios y empresas',
  gobierno: 'Gobierno',
};

export const VIGENCIA: Record<string, string> = {
  vigente: 'Vigente',
  por_confirmar: 'Vigencia por confirmar',
  en_actualizacion: 'En actualización',
  no_vigente: 'No vigente',
};

export function csvEscapar(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

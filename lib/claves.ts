import { randomBytes } from 'node:crypto';

/** Genera una clave temporal legible (sin caracteres ambiguos). */
export function claveTemporal(largo = 12): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(largo);
  let s = '';
  for (let i = 0; i < largo; i++) s += alfabeto[bytes[i] % alfabeto.length];
  return s;
}

export function claveValida(clave: string): string | null {
  if (clave.length < 10) return 'La clave debe tener al menos 10 caracteres.';
  if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return 'La clave debe combinar letras y números.';
  return null;
}

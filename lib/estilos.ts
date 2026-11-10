// Paleta categórica de actores, validada para daltonismo (ΔE CVD ≥ 8 entre pares adyacentes).
// La forma del marcador es la codificación secundaria: la categoría nunca depende solo del color.
export type Categoria = 'academia' | 'soporte' | 'gremios' | 'gobierno';

export const ESTILO_CATEGORIA: Record<Categoria, { color: string; forma: 'circulo' | 'cuadrado' | 'rombo' | 'triangulo' }> = {
  academia: { color: '#2A78D6', forma: 'circulo' },
  soporte: { color: '#E0702C', forma: 'cuadrado' },
  gremios: { color: '#1A9A72', forma: 'rombo' },
  gobierno: { color: '#6250D6', forma: 'triangulo' },
};

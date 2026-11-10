const ESTADOS: Record<string, [string, string]> = {
  pendiente: ['Pendiente de revisión', 'aviso'],
  aprobada: ['Aprobada y publicada', 'ok'],
  rechazada: ['Devuelta', 'error'],
};

export function EstadoCarga({ estado }: { estado: string }) {
  const [t, c] = ESTADOS[estado] ?? [estado, ''];
  return <span className={`etiqueta ${c}`}>{t}</span>;
}

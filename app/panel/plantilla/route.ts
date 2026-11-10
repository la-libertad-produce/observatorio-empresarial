import { usuarioActual } from '@/lib/auth';
import { generarPlantilla } from '@/lib/excel';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await usuarioActual();
  if (!u || u.debe_cambiar_clave) return new Response('No autorizado', { status: 401 });
  const buffer = await generarPlantilla(u);
  const fecha = new Date().toISOString().slice(0, 10);
  const area = (u.subgerencia_nombre ?? 'general').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="plantilla-observatorio-${area}-${fecha}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}

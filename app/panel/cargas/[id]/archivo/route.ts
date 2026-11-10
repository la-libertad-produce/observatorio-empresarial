import { usuarioActual } from '@/lib/auth';
import { archivoDeCarga } from '@/lib/cargas';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioActual();
  if (!u || u.debe_cambiar_clave) return new Response('No autorizado', { status: 401 });
  const a = await archivoDeCarga(Number((await params).id));
  if (!a || !a.archivo) return new Response('No encontrado', { status: 404 });
  if (u.rol === 'cargador' && a.subgerencia_id !== u.subgerencia_id) return new Response('No encontrado', { status: 404 });
  const nombre = a.nombre.replace(/[^\w.\-]+/g, '_');
  return new Response(new Uint8Array(a.archivo), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store',
    },
  });
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirUsuario } from '@/lib/auth';
import { db } from '@/lib/db';
import { listarSubgerencias, type Indicador } from '@/lib/datos';
import { FormIndicador } from './FormIndicador';

export default async function EditarIndicador({ params }: { params: Promise<{ id: string }> }) {
  await exigirUsuario(['admin', 'aprobador']);
  const { id } = await params;
  const subgerencias = await listarSubgerencias();
  let ind: (Indicador & { orden: number }) | null = null;
  if (id !== 'nuevo') {
    const [r] = await db()<(Indicador & { orden: number })[]>`select * from indicadores where id = ${Number(id) || 0}`;
    if (!r) notFound();
    ind = r;
  }
  return (
    <>
      <div className="col">
        <nav className="nota" style={{ fontSize: 13 }}><Link href="/panel/indicadores">Indicadores</Link> / {ind ? ind.codigo : 'Nuevo'}</nav>
        <h1 className="titulo-pag" style={{ fontSize: 28 }}>{ind ? `Editar ${ind.codigo}` : 'Nuevo indicador'}</h1>
      </div>
      <FormIndicador ind={ind} subgerencias={subgerencias.map((s) => ({ id: s.id, nombre: s.nombre }))} />
    </>
  );
}

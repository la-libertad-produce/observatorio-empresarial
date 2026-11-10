import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { FormIngreso } from './FormIngreso';

export default async function Ingresar() {
  if (await usuarioActual()) redirect('/panel');
  return (
    <div style={{ maxWidth: 440, margin: '56px auto 0' }} className="col">
      <span className="eyebrow">Panel de administración</span>
      <h1 className="titulo-pag" style={{ fontSize: 30 }}>Ingresar</h1>
      <p className="texto-2">Acceso para los responsables de información de la Gerencia Regional de la Producción.</p>
      <FormIngreso />
    </div>
  );
}

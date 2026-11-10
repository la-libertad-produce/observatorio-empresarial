import { exigirUsuario } from '@/lib/auth';
import { FormClave } from './FormClave';

export default async function Clave() {
  const u = await exigirUsuario(undefined, true);
  return (
    <div style={{ maxWidth: 480, margin: u.debe_cambiar_clave ? '48px auto 0' : undefined }} className="col">
      <h1 className="titulo-pag" style={{ fontSize: 28 }}>Cambiar clave</h1>
      {u.debe_cambiar_clave && <div className="alerta aviso">Por seguridad, debe reemplazar la clave temporal antes de continuar.</div>}
      <FormClave />
    </div>
  );
}

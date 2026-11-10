'use client';

import { useActionState } from 'react';
import { registrarActor, type EstadoRegistro } from './accion';
import { CATEGORIA_ACTOR } from '@/lib/formato';

const PROVINCIAS = ['Ascope', 'Bolívar', 'Chepén', 'Gran Chimú', 'Julcán', 'Otuzco', 'Pacasmayo', 'Pataz', 'Sánchez Carrión', 'Santiago de Chuco', 'Trujillo', 'Virú'];

export function FormRegistroActor() {
  const [estado, accion, enviando] = useActionState<EstadoRegistro, FormData>(registrarActor, null);
  if (estado?.ok) return <div className="alerta ok" role="status">{estado.mensaje}</div>;
  return (
    <form action={accion} className="tarjeta pad col" style={{ gap: 18 }}>
      {estado && !estado.ok && <div className="alerta error" role="alert">{estado.mensaje}</div>}
      <div className="form-grilla">
        <label className="campo">Nombre de la organización<input name="nombre" required maxLength={200} /></label>
        <label className="campo">
          Categoría
          <select name="categoria" required defaultValue="">
            <option value="" disabled>Elija una opción</option>
            {Object.entries(CATEGORIA_ACTOR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="campo">
          Provincia
          <select name="provincia" defaultValue="">
            <option value="">Alcance nacional o regional</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="campo">Sector o cadena principal<input name="sector" maxLength={120} placeholder="Por ejemplo: agroindustria" /></label>
      </div>
      <label className="campo">A qué se dedica<textarea name="descripcion" required maxLength={600} /></label>
      <label className="campo">Servicios que ofrece al ecosistema<span className="ayuda">Opcional</span><textarea name="servicios" maxLength={600} /></label>
      <div className="form-grilla">
        <label className="campo">Sitio web<span className="ayuda">Opcional</span><input name="web" maxLength={200} inputMode="url" /></label>
        <label className="campo">Correo institucional de contacto<span className="ayuda">No se publica; solo se usa para validar la solicitud.</span><input name="contacto" type="email" required maxLength={200} /></label>
      </div>
      <div style={{ position: 'absolute', left: -9999 }} aria-hidden="true">
        <label>No completar<input name="sitio_alterno" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="check">
        <input type="checkbox" name="consiente" required />
        Autorizo el tratamiento de estos datos para su publicación en el observatorio, conforme a la Ley N° 29733.
      </label>
      <div><button className="btn btn-p" type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button></div>
    </form>
  );
}

'use client';

import { useActionState } from 'react';
import { actualizarClave, type Estado } from '../acciones';

export function FormClave() {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(actualizarClave, null);
  return (
    <form action={accion} className="tarjeta pad col" style={{ gap: 16 }}>
      {estado?.mensaje && <div className="alerta error" role="alert">{estado.mensaje}</div>}
      <label className="campo">Clave actual<input name="actual" type="password" autoComplete="current-password" required /></label>
      <label className="campo">Nueva clave<span className="ayuda">Al menos 10 caracteres, con letras y números.</span><input name="nueva" type="password" autoComplete="new-password" minLength={10} required /></label>
      <label className="campo">Repita la nueva clave<input name="confirmacion" type="password" autoComplete="new-password" minLength={10} required /></label>
      <button className="btn btn-p" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar clave'}</button>
    </form>
  );
}

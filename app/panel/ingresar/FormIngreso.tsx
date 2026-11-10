'use client';

import { useActionState } from 'react';
import { ingresar, type Estado } from '../acciones';

export function FormIngreso() {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(ingresar, null);
  return (
    <form action={accion} className="tarjeta pad col" style={{ gap: 16, marginTop: 12 }}>
      {estado?.mensaje && <div className="alerta error" role="alert">{estado.mensaje}</div>}
      <label className="campo">Correo<input name="email" type="email" autoComplete="username" required /></label>
      <label className="campo">Clave<input name="clave" type="password" autoComplete="current-password" required /></label>
      <button className="btn btn-p" type="submit" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      <p className="nota" style={{ fontSize: 13 }}>Si olvidó su clave, solicite su restablecimiento al administrador de la UTF-CTI.</p>
    </form>
  );
}

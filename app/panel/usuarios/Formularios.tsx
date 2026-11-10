'use client';

import { useActionState } from 'react';
import { crearUsuario, restablecerClave, type EstadoUsuario } from '../acciones';

function ClaveGenerada({ estado }: { estado: EstadoUsuario }) {
  if (!estado?.clave) return null;
  return (
    <div className="alerta ok" role="status">
      Clave temporal para <strong>{estado.email}</strong>: <code style={{ fontSize: 16, fontWeight: 600 }}>{estado.clave}</code>
      <br />Entréguela por un medio seguro. Solo se muestra esta vez; el usuario deberá cambiarla en su primer ingreso.
    </div>
  );
}

export function FormNuevoUsuario({ subgerencias }: { subgerencias: { id: number; nombre: string }[] }) {
  const [estado, accion, enviando] = useActionState<EstadoUsuario, FormData>(crearUsuario, null);
  return (
    <form action={accion} className="col" style={{ gap: 14 }}>
      {estado?.mensaje && <div className="alerta error" role="alert">{estado.mensaje}</div>}
      <ClaveGenerada estado={estado} />
      <div className="form-grilla">
        <label className="campo">Nombre completo<input name="nombre" required maxLength={120} /></label>
        <label className="campo">Correo<input name="email" type="email" required maxLength={160} /></label>
        <label className="campo">
          Rol
          <select name="rol" defaultValue="cargador">
            <option value="cargador">Responsable de carga</option>
            <option value="aprobador">Revisor (UTF-CTI)</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        <label className="campo">
          Área
          <select name="subgerencia_id" defaultValue="">
            <option value="">Ninguna (revisores y administradores)</option>
            {subgerencias.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
      </div>
      <div><button className="btn btn-p" type="submit" disabled={enviando}>Crear usuario</button></div>
    </form>
  );
}

export function BotonRestablecer({ id }: { id: number }) {
  const [estado, accion, enviando] = useActionState<EstadoUsuario, FormData>(restablecerClave, null);
  if (estado?.clave) return <code title="Clave temporal" style={{ fontWeight: 600 }}>{estado.clave}</code>;
  return (
    <form action={accion}>
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-s btn-chico" type="submit" disabled={enviando}>Restablecer clave</button>
    </form>
  );
}

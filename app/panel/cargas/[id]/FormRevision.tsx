'use client';

import { useActionState } from 'react';
import { revisarCarga, type Estado } from '../../acciones';

export function FormRevision({ cargaId }: { cargaId: number }) {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(revisarCarga, null);
  if (estado?.ok) return <div className="alerta ok" role="status">{estado.mensaje} <a href={`/panel/cargas/${cargaId}`}>Actualizar</a></div>;
  return (
    <form action={accion} className="tarjeta pad col" style={{ gap: 14 }}>
      <h2 className="h2" style={{ fontSize: 19 }}>Revisión</h2>
      {estado?.mensaje && <div className="alerta error" role="alert">{estado.mensaje}</div>}
      <input type="hidden" name="carga_id" value={cargaId} />
      <label className="campo">
        Observación
        <span className="ayuda">Obligatoria si devuelve la carga. Se mostrará al responsable del área.</span>
        <textarea name="observacion" maxLength={1000} />
      </label>
      <div className="fila">
        <button className="btn btn-p" type="submit" name="decision" value="aprobar" disabled={enviando}>Aprobar y publicar</button>
        <button className="btn btn-peligro" type="submit" name="decision" value="devolver" disabled={enviando}>Devolver con observaciones</button>
      </div>
    </form>
  );
}

'use client';

import { useActionState } from 'react';
import { subirArchivo, type EstadoCarga } from '../acciones';

export function FormCarga() {
  const [estado, accion, enviando] = useActionState<EstadoCarga, FormData>(subirArchivo, null);
  return (
    <form action={accion} className="col" style={{ gap: 14 }}>
      <label className="campo">
        Archivo Excel (.xlsx, máximo 4 MB)
        <input type="file" name="archivo" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
      </label>
      <button className="btn btn-p" style={{ alignSelf: 'flex-start' }} type="submit" disabled={enviando}>
        {enviando ? 'Validando…' : 'Validar y enviar a revisión'}
      </button>
      {estado && estado.errores.length > 0 && (
        <div className="alerta error" role="alert">
          <strong>El archivo {estado.archivo ? `"${estado.archivo}" ` : ''}tiene {estado.errores.length} {estado.errores.length === 1 ? 'error' : 'errores'}. Corríjalos y vuelva a subirlo.</strong>
          <ul>
            {estado.errores.slice(0, 50).map((e, i) => (
              <li key={i}>{e.fila ? `Fila ${e.fila}${e.columna ? `, columna ${e.columna}` : ''}: ` : ''}{e.mensaje}</li>
            ))}
          </ul>
          {estado.errores.length > 50 && <p>… y {estado.errores.length - 50} más.</p>}
        </div>
      )}
    </form>
  );
}

'use client';

import { useActionState } from 'react';
import { guardarDocumento, guardarMeta, type Estado } from '../acciones';
import type { Documento, Meta } from '@/lib/datos';
import { VIGENCIA } from '@/lib/formato';

function Aviso({ estado }: { estado: Estado }) {
  if (!estado?.mensaje) return null;
  return <div className={`alerta ${estado.ok ? 'ok' : 'error'}`} role={estado.ok ? 'status' : 'alert'}>{estado.mensaje}</div>;
}

export function FormDocumento({ doc }: { doc: Documento }) {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(guardarDocumento, null);
  return (
    <form action={accion} className="col" style={{ gap: 14 }}>
      <Aviso estado={estado} />
      <input type="hidden" name="id" value={doc.id} />
      <label className="campo">Nombre<input name="nombre" defaultValue={doc.nombre} required maxLength={200} /></label>
      <div className="form-grilla">
        <label className="campo">Instrumento de aprobación<input name="norma" defaultValue={doc.norma} maxLength={200} /></label>
        <label className="campo">Fecha de aprobación<input name="fecha_aprobacion" type="date" defaultValue={doc.fecha_aprobacion ?? ''} /></label>
        <label className="campo">Horizonte temporal<input name="horizonte" defaultValue={doc.horizonte} maxLength={40} placeholder="2026-2029" /></label>
        <label className="campo">Órgano responsable<input name="organo" defaultValue={doc.organo} maxLength={200} /></label>
        <label className="campo">
          Vigencia
          <select name="estado_vigencia" defaultValue={doc.estado_vigencia}>
            {Object.entries(VIGENCIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="campo">Enlace al documento oficial<input name="url_documento" type="url" defaultValue={doc.url_documento ?? ''} placeholder="https://" /></label>
      </div>
      <label className="campo">Resumen<textarea name="resumen" defaultValue={doc.resumen} maxLength={800} /></label>
      <div><button className="btn btn-p" type="submit" disabled={enviando}>Guardar ficha</button></div>
    </form>
  );
}

export function FormMeta({ documentoId, meta }: { documentoId: number; meta: Meta | null }) {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(guardarMeta, null);
  return (
    <form action={accion} className="col" style={{ gap: 12 }}>
      <Aviso estado={estado} />
      <input type="hidden" name="id" value={meta?.id ?? ''} />
      <input type="hidden" name="documento_id" value={documentoId} />
      <label className="campo">Meta<input name="descripcion" defaultValue={meta?.descripcion} required maxLength={300} /></label>
      <div className="form-grilla">
        <label className="campo">Unidad<input name="unidad" defaultValue={meta?.unidad} maxLength={60} /></label>
        <label className="campo">Línea de base<input name="linea_base" inputMode="decimal" defaultValue={meta?.linea_base ?? ''} /></label>
        <label className="campo">Meta al final del horizonte<input name="meta" inputMode="decimal" defaultValue={meta?.meta ?? ''} /></label>
        <label className="campo">Último valor reportado<span className="ayuda">Vacío si no hay reporte oficial.</span><input name="ultimo_valor" inputMode="decimal" defaultValue={meta?.ultimo_valor ?? ''} /></label>
        <label className="campo">Fecha del reporte<input name="fecha_reporte" type="date" defaultValue={meta?.fecha_reporte ?? ''} /></label>
        <label className="campo">Fuente<input name="fuente" defaultValue={meta?.fuente} maxLength={200} /></label>
      </div>
      <label className="check"><input type="checkbox" name="referencial" defaultChecked={meta?.referencial ?? false} />Dato referencial (de ejemplo)</label>
      <div><button className="btn btn-s" type="submit" disabled={enviando}>{meta ? 'Guardar cambios' : 'Agregar meta'}</button></div>
    </form>
  );
}

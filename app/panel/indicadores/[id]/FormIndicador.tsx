'use client';

import { useActionState } from 'react';
import { guardarIndicador, type Estado } from '../../acciones';
import type { Indicador } from '@/lib/datos';

export function FormIndicador({ ind, subgerencias }: { ind: (Indicador & { orden: number }) | null; subgerencias: { id: number; nombre: string }[] }) {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(guardarIndicador, null);
  return (
    <form action={accion} className="tarjeta pad col" style={{ gap: 18 }}>
      {estado?.mensaje && <div className="alerta error" role="alert">{estado.mensaje}</div>}
      <input type="hidden" name="id" value={ind?.id ?? ''} />
      <div className="form-grilla">
        <label className="campo">Código<span className="ayuda">Forma AREA-01, por ejemplo MYPE-03.</span><input name="codigo" defaultValue={ind?.codigo} required maxLength={14} /></label>
        <label className="campo">
          Área responsable
          <select name="subgerencia_id" defaultValue={ind?.subgerencia_id} required>
            {subgerencias.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          Periodicidad
          <select name="periodicidad" defaultValue={ind?.periodicidad ?? 'mensual'}>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </label>
      </div>
      <label className="campo">Nombre del indicador<input name="nombre" defaultValue={ind?.nombre} required maxLength={200} /></label>
      <div className="form-grilla">
        <label className="campo">Unidad de medida<input name="unidad" defaultValue={ind?.unidad} required maxLength={60} placeholder="Número de empresas" /></label>
        <label className="campo">Decimales<input name="decimales" type="number" min={0} max={4} defaultValue={ind?.decimales ?? 0} /></label>
        <label className="campo">Orden de presentación<input name="orden" type="number" defaultValue={ind?.orden ?? 0} /></label>
      </div>
      <label className="campo">Definición<textarea name="definicion" defaultValue={ind?.definicion} maxLength={800} /></label>
      <label className="campo">Método de cálculo<textarea name="metodo_calculo" defaultValue={ind?.metodo_calculo} maxLength={800} /></label>
      <label className="campo">Fuente<input name="fuente" defaultValue={ind?.fuente} maxLength={200} /></label>
      <fieldset className="col" style={{ border: 0, padding: 0, margin: 0, gap: 4 }}>
        <legend className="nota" style={{ fontWeight: 600, marginBottom: 6 }}>Opciones</legend>
        <label className="check"><input type="checkbox" name="desagrega_sector" defaultChecked={ind?.desagrega_sector} />Se desagrega por sector o cadena</label>
        <label className="check"><input type="checkbox" name="permite_negativos" defaultChecked={ind?.permite_negativos} />Admite valores negativos</label>
        <label className="check"><input type="checkbox" name="destacado" defaultChecked={ind?.destacado} />Destacar en la portada</label>
        <label className="check"><input type="checkbox" name="referencial" defaultChecked={ind?.referencial} />Datos referenciales (de ejemplo)</label>
        <label className="check"><input type="checkbox" name="activo" defaultChecked={ind?.activo ?? true} />Activo</label>
      </fieldset>
      <div><button className="btn btn-p" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar indicador'}</button></div>
    </form>
  );
}

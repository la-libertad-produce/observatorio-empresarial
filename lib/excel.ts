import 'server-only';
import ExcelJS from 'exceljs';
import { db } from './db';
import type { Usuario } from './auth';
import { listarIndicadores, listarSectores, type Indicador } from './datos';
import { FORMATO_PERIODO, esFuturo, parsePeriodo, periodoReciente, periodoSiguiente } from './periodos';
import { PERIODICIDAD } from './formato';

export const COLUMNAS = ['codigo_indicador', 'periodo', 'sector_cadena', 'valor', 'observacion'] as const;
export const MAX_FILAS = 5000;

const COLOR_ENCABEZADO = 'FF0E5A57';

/** Indicadores que un usuario puede cargar. */
export async function indicadoresDelUsuario(u: Usuario): Promise<Indicador[]> {
  if (u.rol === 'cargador') return u.subgerencia_id ? listarIndicadores({ subgerenciaId: u.subgerencia_id }) : [];
  return listarIndicadores();
}

/** Construye la plantilla estándar de carga, prellenada con el siguiente periodo de cada indicador. */
export async function generarPlantilla(u: Usuario): Promise<Buffer> {
  const indicadores = await indicadoresDelUsuario(u);
  const sectores = await listarSectores();
  const ids = indicadores.map((i) => i.id);
  const ultimos = ids.length
    ? await db()<{ indicador_id: number; periodo: string; sector: string | null }[]>`
        select distinct on (v.indicador_id, coalesce(v.sector_id, 0)) v.indicador_id, v.periodo, s.nombre as sector
        from valores v left join sectores s on s.id = v.sector_id
        where v.estado = 'publicado' and v.indicador_id in ${db()(ids)}
        order by v.indicador_id, coalesce(v.sector_id, 0), v.fecha desc`
    : [];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Observatorio La Libertad Produce';
  wb.created = new Date();

  // Instrucciones
  const ins = wb.addWorksheet('Instrucciones', { properties: { tabColor: { argb: COLOR_ENCABEZADO } } });
  ins.getColumn(1).width = 110;
  const lineas: [string, boolean?][] = [
    ['Observatorio La Libertad Produce: plantilla estándar de carga de indicadores', true],
    [`Generada para: ${u.nombre} (${u.subgerencia_nombre ?? 'todas las subgerencias'}), ${new Date().toLocaleDateString('es-PE')}`],
    [''],
    ['Cómo completar la plantilla', true],
    ['1. Registre los valores en la hoja "Datos". Cada fila corresponde a un indicador, un periodo y, si aplica, un sector o cadena.'],
    ['2. La hoja viene prellenada con el siguiente periodo de cada indicador. Complete la columna "valor"; las filas sin valor se ignoran.'],
    ['3. codigo_indicador: elija el código de la lista desplegable. La hoja "Indicadores" muestra el nombre, la unidad y la periodicidad de cada uno.'],
    [`4. periodo: mensual ${FORMATO_PERIODO.mensual}; trimestral ${FORMATO_PERIODO.trimestral}; anual ${FORMATO_PERIODO.anual}.`],
    ['5. sector_cadena: escriba "Total" para el valor agregado. Use un sector de la lista solo si el indicador se desagrega por sector.'],
    ['6. valor: solo números, sin separador de miles ni símbolos. Use punto o coma para los decimales.'],
    ['7. observacion: opcional; anote aquí cualquier precisión sobre el dato.'],
    ['8. No cambie los nombres de las hojas ni de las columnas. Guarde el archivo en formato .xlsx y súbalo en el panel del observatorio.'],
    [''],
    ['Qué ocurre después', true],
    ['El sistema valida el archivo y muestra los errores por fila. Si no hay errores, la carga queda pendiente de revisión por la UTF-CTI, que la aprueba o la devuelve con observaciones. Los datos solo se publican tras la aprobación.'],
  ];
  for (const [texto, negrita] of lineas) {
    const r = ins.addRow([texto]);
    r.getCell(1).alignment = { wrapText: true, vertical: 'top' };
    if (negrita) r.font = { bold: true, size: 12 };
  }

  // Datos
  const hoja = wb.addWorksheet('Datos', { views: [{ state: 'frozen', ySplit: 1 }] });
  hoja.columns = [
    { header: 'codigo_indicador', key: 'codigo', width: 20 },
    { header: 'periodo', key: 'periodo', width: 14, style: { numFmt: '@' } },
    { header: 'sector_cadena', key: 'sector', width: 26 },
    { header: 'valor', key: 'valor', width: 16 },
    { header: 'observacion', key: 'obs', width: 50 },
  ];
  hoja.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  hoja.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };

  for (const ind of indicadores) {
    const propios = ultimos.filter((x) => x.indicador_id === ind.id);
    const base = propios.find((x) => x.sector === null)?.periodo;
    const siguiente = base ? periodoSiguiente(base) : periodoReciente(ind.periodicidad);
    hoja.addRow({ codigo: ind.codigo, periodo: siguiente, sector: 'Total' });
    if (ind.desagrega_sector) {
      for (const p of propios.filter((x) => x.sector)) hoja.addRow({ codigo: ind.codigo, periodo: siguiente, sector: p.sector });
    }
  }

  // Listas para validación
  const listas = wb.addWorksheet('Listas', { state: 'veryHidden' });
  indicadores.forEach((ind, i) => (listas.getCell(i + 1, 1).value = ind.codigo));
  ['Total', ...sectores.map((s) => s.nombre)].forEach((s, i) => (listas.getCell(i + 1, 2).value = s));
  const nInd = Math.max(indicadores.length, 1);
  const nSec = sectores.length + 1;
  for (let r = 2; r <= 1000; r++) {
    hoja.getCell(r, 1).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$A$1:$A$${nInd}`], showErrorMessage: true, errorTitle: 'Código no válido', error: 'Elija un código de la lista.' };
    hoja.getCell(r, 3).dataValidation = { type: 'list', allowBlank: true, formulae: [`Listas!$B$1:$B$${nSec}`], showErrorMessage: true, errorTitle: 'Sector no válido', error: 'Elija "Total" o un sector de la lista.' };
    hoja.getCell(r, 2).numFmt = '@';
  }

  // Indicadores (referencia)
  const ref = wb.addWorksheet('Indicadores');
  ref.columns = [
    { header: 'Código', key: 'c', width: 12 },
    { header: 'Indicador', key: 'n', width: 60 },
    { header: 'Unidad', key: 'u', width: 22 },
    { header: 'Periodicidad', key: 'p', width: 14 },
    { header: 'Formato del periodo', key: 'f', width: 32 },
    { header: 'Se desagrega por sector', key: 's', width: 22 },
    { header: 'Último periodo publicado', key: 'up', width: 24 },
  ];
  ref.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ref.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
  for (const ind of indicadores) {
    ref.addRow({
      c: ind.codigo, n: ind.nombre, u: ind.unidad, p: PERIODICIDAD[ind.periodicidad], f: FORMATO_PERIODO[ind.periodicidad],
      s: ind.desagrega_sector ? 'Sí' : 'No', up: ultimos.find((x) => x.indicador_id === ind.id && x.sector === null)?.periodo ?? 'Sin datos',
    });
  }
  ref.eachRow((r) => r.eachCell((c) => (c.alignment = { wrapText: true, vertical: 'top' })));

  wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 1, visibility: 'visible' }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------
// Lectura y validación

export type Observacion = { fila: number | null; columna?: string; mensaje: string };
export type FilaValida = {
  fila: number;
  indicador_id: number;
  codigo: string;
  periodo: string;
  fecha: string;
  sector_id: number | null;
  sector: string;
  valor: number;
  observacion: string | null;
};
export type ResultadoValidacion = { filas: FilaValida[]; errores: Observacion[]; advertencias: Observacion[] };

function valorCelda(c: ExcelJS.CellValue): unknown {
  if (c === null || c === undefined) return null;
  if (typeof c === 'object' && !(c instanceof Date)) {
    if ('result' in c) return (c as ExcelJS.CellFormulaValue).result ?? null;
    if ('richText' in c) return (c as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('');
    if ('text' in c) return (c as ExcelJS.CellHyperlinkValue).text;
    if ('error' in c) return null;
  }
  return c;
}

function texto(v: unknown): string {
  return v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v).trim();
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function aNumero(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = texto(v).replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) {
    // 1.234,5 o 1,234.5: el último separador es el decimal
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
}

export async function validarArchivo(buffer: Buffer, u: Usuario): Promise<ResultadoValidacion> {
  const errores: Observacion[] = [];
  const advertencias: Observacion[] = [];
  const filas: FilaValida[] = [];

  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { filas, errores: [{ fila: null, mensaje: 'El archivo no se pudo leer. Verifique que sea un Excel .xlsx.' }], advertencias };
  }
  const hoja = wb.getWorksheet('Datos');
  if (!hoja) return { filas, errores: [{ fila: null, mensaje: 'No se encontró la hoja "Datos". Use la plantilla estándar descargada del panel.' }], advertencias };

  const encabezado = (hoja.getRow(1).values as ExcelJS.CellValue[]).slice(1).map((v) => normalizar(texto(valorCelda(v))));
  const pos: Record<string, number> = {};
  for (const col of COLUMNAS) {
    const i = encabezado.indexOf(col);
    if (i === -1 && col !== 'observacion') {
      errores.push({ fila: 1, columna: col, mensaje: `Falta la columna "${col}".` });
    }
    pos[col] = i + 1;
  }
  if (errores.length) return { filas, errores, advertencias };

  const permitidos = await indicadoresDelUsuario(u);
  const todos = new Map((await listarIndicadores({ incluirInactivos: true })).map((i) => [i.codigo.toUpperCase(), i]));
  const propios = new Set(permitidos.map((i) => i.id));
  const sectores = await listarSectores();
  const sectorPorNombre = new Map(sectores.map((s) => [normalizar(s.nombre), s]));

  const vistos = new Set<string>();
  let n = 0;
  hoja.eachRow({ includeEmpty: false }, (row, numero) => {
    if (numero === 1) return;
    const get = (col: string) => (pos[col] > 0 ? valorCelda(row.getCell(pos[col]).value) : null);
    const codigoTxt = texto(get('codigo_indicador')).toUpperCase();
    const valorRaw = get('valor');
    if (!codigoTxt && texto(valorRaw) === '') return; // fila vacía
    if (texto(valorRaw) === '') return; // fila prellenada sin completar
    n++;
    if (n > MAX_FILAS) return;

    const err = (columna: string, mensaje: string) => errores.push({ fila: numero, columna, mensaje });

    const ind = todos.get(codigoTxt);
    if (!codigoTxt) return err('codigo_indicador', 'Falta el código del indicador.');
    if (!ind) return err('codigo_indicador', `El código "${codigoTxt}" no existe.`);
    if (!ind.activo) return err('codigo_indicador', `El indicador ${ind.codigo} está inactivo.`);
    if (!propios.has(ind.id)) return err('codigo_indicador', `El indicador ${ind.codigo} no corresponde a su subgerencia.`);

    const per = parsePeriodo(get('periodo'), ind.periodicidad);
    if (!per) return err('periodo', `Periodo "${texto(get('periodo'))}" no válido. Formato esperado: ${FORMATO_PERIODO[ind.periodicidad]}.`);
    if (esFuturo(per.fecha)) return err('periodo', `El periodo ${per.periodo} es posterior al mes actual.`);

    const sectorTxt = texto(get('sector_cadena'));
    let sector_id: number | null = null;
    let sectorNombre = 'Total';
    if (sectorTxt && normalizar(sectorTxt) !== 'total') {
      if (!ind.desagrega_sector) return err('sector_cadena', `El indicador ${ind.codigo} no se desagrega por sector; use "Total".`);
      const s = sectorPorNombre.get(normalizar(sectorTxt));
      if (!s) return err('sector_cadena', `El sector "${sectorTxt}" no está en la lista.`);
      sector_id = s.id;
      sectorNombre = s.nombre;
    }

    const valor = aNumero(valorRaw);
    if (valor === null) return err('valor', `El valor "${texto(valorRaw)}" no es un número.`);
    if (valor < 0 && !ind.permite_negativos) return err('valor', 'El indicador no admite valores negativos.');
    const decimalesTxt = String(valor).split('.')[1]?.length ?? 0;
    if (decimalesTxt > ind.decimales) {
      advertencias.push({ fila: numero, columna: 'valor', mensaje: `El valor tiene más de ${ind.decimales} decimales; se mostrará redondeado.` });
    }

    const clave = `${ind.id}|${per.periodo}|${sector_id ?? 0}`;
    if (vistos.has(clave)) return err('periodo', `Fila duplicada: ${ind.codigo}, ${per.periodo}, ${sectorNombre}.`);
    vistos.add(clave);

    const obs = texto(get('observacion'));
    filas.push({ fila: numero, indicador_id: ind.id, codigo: ind.codigo, periodo: per.periodo, fecha: per.fecha, sector_id, sector: sectorNombre, valor, observacion: obs ? obs.slice(0, 500) : null });
  });

  if (n > MAX_FILAS) errores.push({ fila: null, mensaje: `El archivo supera el máximo de ${MAX_FILAS} filas con datos.` });
  if (!filas.length && !errores.length) errores.push({ fila: null, mensaje: 'El archivo no contiene filas con valores.' });
  if (errores.length) return { filas: [], errores, advertencias };

  // Advertencias de consistencia (no bloquean la carga)
  const ids = [...new Set(filas.map((f) => f.indicador_id))];
  const publicados = await db()<{ indicador_id: number; periodo: string; sector_id: number | null; valor: number; fecha: string }[]>`
    select indicador_id, periodo, sector_id, valor, to_char(fecha, 'YYYY-MM-DD') as fecha
    from valores where estado = 'publicado' and indicador_id in ${db()(ids)} order by fecha`;
  for (const f of filas) {
    const ind = todos.get(f.codigo)!;
    const mismos = publicados.filter((p) => p.indicador_id === f.indicador_id && (p.sector_id ?? 0) === (f.sector_id ?? 0));
    const existente = mismos.find((p) => p.periodo === f.periodo);
    if (existente) {
      advertencias.push({ fila: f.fila, mensaje: `${f.codigo} ${f.periodo} (${f.sector}) ya tiene un valor publicado (${existente.valor}); al aprobarse, será reemplazado.` });
    }
    const previo = mismos.filter((p) => p.fecha < f.fecha).at(-1);
    if (previo && previo.valor !== 0) {
      const cambio = ((f.valor - previo.valor) / Math.abs(previo.valor)) * 100;
      if (Math.abs(cambio) >= 50) {
        advertencias.push({ fila: f.fila, mensaje: `Variación atípica en ${f.codigo} (${f.sector}): ${cambio > 0 ? '+' : ''}${cambio.toFixed(1)}% respecto a ${previo.periodo}. Verifique el dato.` });
      }
    }
    if (ind.desagrega_sector && f.sector_id === null) {
      const partes = filas.filter((x) => x.indicador_id === f.indicador_id && x.periodo === f.periodo && x.sector_id !== null);
      if (partes.length) {
        const suma = partes.reduce((a, b) => a + b.valor, 0);
        if (Math.abs(suma - f.valor) > Math.max(0.005 * Math.abs(f.valor), 10 ** -ind.decimales)) {
          advertencias.push({ fila: f.fila, mensaje: `En ${f.codigo} ${f.periodo}, la suma de los sectores (${suma}) no coincide con el total (${f.valor}).` });
        }
      }
    }
  }
  return { filas, errores, advertencias };
}

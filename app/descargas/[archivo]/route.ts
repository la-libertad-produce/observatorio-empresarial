import { db } from '@/lib/db';
import { csvEscapar } from '@/lib/formato';

export const dynamic = 'force-dynamic';

function csv(filas: Record<string, unknown>[], columnas: string[]): string {
  const lineas = [columnas.join(','), ...filas.map((f) => columnas.map((c) => csvEscapar(f[c])).join(','))];
  return `﻿${lineas.join('\r\n')}\r\n`; // BOM para que Excel reconozca UTF-8
}

function respuesta(contenido: string, nombre: string) {
  return new Response(contenido, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  const sql = db();

  if (archivo === 'valores.csv' || /^indicador-[A-Za-z0-9-]+\.csv$/.test(archivo)) {
    const codigo = archivo.startsWith('indicador-') ? archivo.slice(10, -4).toUpperCase() : null;
    const filas = await sql`
      select i.codigo, i.nombre as indicador, s2.nombre_corto as area, i.unidad, v.periodo, coalesce(se.nombre, 'Total') as sector, v.valor,
             to_char(v.publicado_en, 'YYYY-MM-DD') as publicado, case when i.referencial then 'si' else 'no' end as referencial
      from valores v
      join indicadores i on i.id = v.indicador_id
      join subgerencias s2 on s2.id = i.subgerencia_id
      left join sectores se on se.id = v.sector_id
      where v.estado = 'publicado' and i.activo ${codigo ? sql`and i.codigo = ${codigo}` : sql``}
      order by i.codigo, v.fecha, se.orden nulls first`;
    if (codigo && !filas.length) return new Response('No encontrado', { status: 404 });
    return respuesta(csv(filas, ['codigo', 'indicador', 'area', 'unidad', 'periodo', 'sector', 'valor', 'publicado', 'referencial']), archivo);
  }

  if (archivo === 'indicadores.csv') {
    const filas = await sql`
      select i.codigo, i.nombre, s.nombre as area, i.unidad, i.periodicidad, case when i.desagrega_sector then 'si' else 'no' end as desagrega_sector,
             i.definicion, i.metodo_calculo, i.fuente, case when i.referencial then 'si' else 'no' end as referencial
      from indicadores i join subgerencias s on s.id = i.subgerencia_id where i.activo order by s.orden, i.orden, i.codigo`;
    return respuesta(csv(filas, ['codigo', 'nombre', 'area', 'unidad', 'periodicidad', 'desagrega_sector', 'definicion', 'metodo_calculo', 'fuente', 'referencial']), archivo);
  }

  if (archivo === 'metas.csv') {
    const filas = await sql`
      select d.sigla as documento, m.orden + 1 as numero, m.descripcion as meta, m.unidad, m.linea_base, m.meta as valor_meta, m.ultimo_valor,
             to_char(m.fecha_reporte, 'YYYY-MM-DD') as fecha_reporte, m.fuente, case when m.referencial then 'si' else 'no' end as referencial
      from metas m join documentos d on d.id = m.documento_id order by d.orden, m.orden`;
    return respuesta(csv(filas, ['documento', 'numero', 'meta', 'unidad', 'linea_base', 'valor_meta', 'ultimo_valor', 'fecha_reporte', 'fuente', 'referencial']), archivo);
  }

  if (archivo === 'actores.csv') {
    const filas = await sql`
      select nombre, categoria, coalesce(provincia, 'Nacional') as provincia, sector, descripcion, servicios, web
      from actores where validado order by categoria, nombre`;
    return respuesta(csv(filas, ['nombre', 'categoria', 'provincia', 'sector', 'descripcion', 'servicios', 'web']), archivo);
  }

  return new Response('No encontrado', { status: 404 });
}

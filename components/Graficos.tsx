'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { formatoNumero } from '@/lib/formato';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, SVGRenderer]);

const TINTA = '#0f2338';
const TINTA_3 = '#566577';
const GRILLA = '#e8edf3';
const MARCA = '#005799'; // azul institucional
const PREVIO = '#5e98d0'; // periodos anteriores (contraste 3:1 sobre blanco)
const ACENTO = '#003f70'; // último periodo, resaltado
const FUENTE = "'IBM Plex Sans', system-ui, sans-serif";

const formatear = (v: number, dec: number) => formatoNumero(v, dec);

function useGrafico(opciones: echarts.EChartsCoreOption, alto: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const g = echarts.init(ref.current, undefined, { renderer: 'svg', height: alto });
    g.setOption(opciones);
    const ro = new ResizeObserver(() => g.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      g.dispose();
    };
  }, [opciones, alto]);
  return ref;
}

/** Serie temporal de un indicador: barras, con el último periodo resaltado. */
export function GraficoSerie({ etiquetas, valores, unidad, decimales, alto = 300, descripcion }: {
  etiquetas: string[]; valores: number[]; unidad: string; decimales: number; alto?: number; descripcion: string;
}) {
  const ultimo = valores.length - 1;
  const opciones: echarts.EChartsCoreOption = {
    animation: false,
    textStyle: { fontFamily: FUENTE, color: TINTA_3 },
    grid: { left: 8, right: 8, top: 28, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,87,153,0.07)' } },
      backgroundColor: '#ffffff',
      borderColor: '#d6dee7',
      textStyle: { color: TINTA, fontFamily: FUENTE, fontSize: 13 },
      valueFormatter: (v: unknown) => `${formatear(Number(v), decimales)} ${unidad.toLowerCase()}`,
    },
    xAxis: {
      type: 'category',
      data: etiquetas,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#aebbc9' } },
      axisLabel: { color: TINTA_3, fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      splitNumber: 4,
      splitLine: { lineStyle: { color: GRILLA } },
      axisLabel: { color: TINTA_3, fontSize: 11, formatter: (v: number) => formatear(v, 0) },
    },
    series: [
      {
        type: 'bar',
        name: unidad,
        barMaxWidth: 28,
        barCategoryGap: '24%',
        data: valores.map((v, i) => ({ value: v, itemStyle: { color: i === ultimo ? ACENTO : PREVIO, borderRadius: [4, 4, 0, 0] } })),
        label: {
          show: true,
          position: 'top',
          color: TINTA,
          fontWeight: 600,
          fontSize: 12,
          formatter: (p: { dataIndex: number; value: number }) => (p.dataIndex === ultimo ? formatear(p.value, decimales) : ''),
        },
      },
    ],
  };
  const ref = useGrafico(opciones, alto);
  return <div ref={ref} role="img" aria-label={descripcion} style={{ width: '100%', height: alto }} />;
}

/** Distribución por sector o cadena en un periodo: barras horizontales de un solo tono. */
export function GraficoSectores({ sectores, valores, unidad, decimales, descripcion }: {
  sectores: string[]; valores: number[]; unidad: string; decimales: number; descripcion: string;
}) {
  const alto = Math.max(160, sectores.length * 40 + 30);
  const opciones: echarts.EChartsCoreOption = {
    animation: false,
    textStyle: { fontFamily: FUENTE, color: TINTA_3 },
    grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#ffffff',
      borderColor: '#d6dee7',
      textStyle: { color: TINTA, fontFamily: FUENTE, fontSize: 13 },
      formatter: (p: { name: string; value: number }) => `${p.name}<br/><b>${formatear(p.value, decimales)}</b> ${unidad.toLowerCase()}`,
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: sectores,
      inverse: true,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: TINTA, fontSize: 13 },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 22,
        itemStyle: { color: MARCA, borderRadius: [0, 4, 4, 0] },
        data: valores,
        label: { show: true, position: 'right', color: TINTA, fontSize: 12, formatter: (p: { value: number }) => formatear(p.value, decimales) },
      },
    ],
  };
  const ref = useGrafico(opciones, alto);
  return <div ref={ref} role="img" aria-label={descripcion} style={{ width: '100%', height: alto }} />;
}

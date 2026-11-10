'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type { Actor } from '@/lib/datos';
import { CATEGORIA_ACTOR } from '@/lib/formato';
import { ESTILO_CATEGORIA } from '@/lib/estilos';

const Mapa = dynamic(() => import('./MapaActores'), { ssr: false, loading: () => <div className="mapa" /> });


export function Simbolo({ categoria, tam = 14 }: { categoria: Actor['categoria']; tam?: number }) {
  const { color, forma } = ESTILO_CATEGORIA[categoria];
  const h = tam;
  return (
    <svg width={h} height={h} viewBox="0 0 14 14" aria-hidden="true">
      {forma === 'circulo' && <circle cx="7" cy="7" r="6" fill={color} />}
      {forma === 'cuadrado' && <rect x="1" y="1" width="12" height="12" fill={color} />}
      {forma === 'rombo' && <path d="M7 0 14 7 7 14 0 7Z" fill={color} />}
      {forma === 'triangulo' && <path d="M7 1 13 13H1Z" fill={color} />}
    </svg>
  );
}

export function Ecosistema({ actores }: { actores: Actor[] }) {
  const [cat, setCat] = useState<string>('todas');
  const [prov, setProv] = useState('todas');
  const [q, setQ] = useState('');
  const provincias = useMemo(() => [...new Set(actores.map((a) => a.provincia).filter(Boolean))].sort() as string[], [actores]);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const visibles = actores.filter(
    (a) =>
      (cat === 'todas' || a.categoria === cat) &&
      (prov === 'todas' || (prov === 'nacional' ? !a.provincia : a.provincia === prov)) &&
      (!q || norm(`${a.nombre} ${a.descripcion} ${a.sector} ${a.servicios}`).includes(norm(q))),
  );
  const conUbicacion = visibles.filter((a) => a.lat !== null && a.lng !== null);

  return (
    <div className="col" style={{ gap: 20 }}>
      <section className="tarjeta" aria-label="Filtros" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="fila" style={{ alignItems: 'flex-end', gap: 16 }}>
          <label className="campo" style={{ flex: '1 1 320px' }}>
            Buscar actor o servicio
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Por ejemplo: laboratorio, incubación, cuero" />
          </label>
          <label className="campo" style={{ flex: '0 1 240px' }}>
            Provincia
            <select value={prov} onChange={(e) => setProv(e.target.value)}>
              <option value="todas">Todas</option>
              {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
              <option value="nacional">Alcance nacional</option>
            </select>
          </label>
        </div>
        <div className="chips" role="group" aria-label="Categoría">
          <button type="button" className="chip" aria-pressed={cat === 'todas'} onClick={() => setCat('todas')}>Todas</button>
          {Object.entries(CATEGORIA_ACTOR).map(([k, v]) => (
            <button key={k} type="button" className="chip" aria-pressed={cat === k} onClick={() => setCat(k)}>{v}</button>
          ))}
        </div>
      </section>

      <section className="tarjeta pad col" style={{ gap: 12 }}>
        <div className="fila entre">
          <h2 className="h2" style={{ fontSize: 19 }}>Mapa de actores</h2>
          <ul aria-label="Leyenda" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px 20px', fontSize: 13, color: 'var(--tinta-2)' }}>
            {(Object.keys(CATEGORIA_ACTOR) as Actor['categoria'][]).map((k) => (
              <li key={k} className="fila" style={{ gap: 6 }}><Simbolo categoria={k} />{CATEGORIA_ACTOR[k]}</li>
            ))}
          </ul>
        </div>
        <Mapa actores={conUbicacion} />
        <p className="nota">Cartografía © colaboradores de OpenStreetMap. Las organizaciones de alcance nacional figuran en el directorio sin punto en el mapa.</p>
      </section>

      <section className="col" style={{ gap: 14 }} aria-labelledby="t-dir">
        <div className="fila entre">
          <h2 id="t-dir" className="h2" style={{ fontSize: 19 }}>Directorio</h2>
          <span className="nota" style={{ fontSize: 13 }} aria-live="polite">{visibles.length} {visibles.length === 1 ? 'actor' : 'actores'}</span>
        </div>
        <div className="grilla-3">
          {visibles.map((a) => (
            <article key={a.id} className="tarjeta pad col" style={{ gap: 10 }}>
              <span className="fila" style={{ gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--tinta-2)' }}>
                <Simbolo categoria={a.categoria} tam={12} />{CATEGORIA_ACTOR[a.categoria]}
              </span>
              <h3 style={{ fontSize: 17 }}>{a.nombre}</h3>
              <p className="texto-2" style={{ fontSize: 14 }}>{a.descripcion}</p>
              <span className="nota" style={{ fontSize: 13 }}>{a.provincia ? `Provincia: ${a.provincia}` : 'Alcance nacional'}{a.sector ? ` · ${a.sector}` : ''}</span>
              {a.web && <a href={a.web} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>Sitio web</a>}
            </article>
          ))}
        </div>
        {!visibles.length && <p className="texto-2">No hay actores que coincidan con los filtros.</p>}
      </section>
    </div>
  );
}

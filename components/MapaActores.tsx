'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AttributionControl, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Actor } from '@/lib/datos';
import { CATEGORIA_ACTOR } from '@/lib/formato';
import { ESTILO_CATEGORIA } from '@/lib/estilos';

const FORMAS: Record<string, string> = {
  circulo: '<circle cx="9" cy="9" r="7"/>',
  cuadrado: '<rect x="2" y="2" width="14" height="14"/>',
  rombo: '<path d="M9 0.5 17.5 9 9 17.5 0.5 9Z"/>',
  triangulo: '<path d="M9 1.5 17 16.5H1Z"/>',
};

function icono(categoria: Actor['categoria']) {
  const { color, forma } = ESTILO_CATEGORIA[categoria];
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<svg width="18" height="18" viewBox="0 0 18 18" fill="${color}" stroke="#ffffff" stroke-width="2">${FORMAS[forma]}</svg>`,
  });
}

export default function MapaActores({ actores }: { actores: Actor[] }) {
  return (
    <div className="mapa">
      <MapContainer center={[-8.0, -78.5]} zoom={8} scrollWheelZoom={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <AttributionControl prefix={false} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {actores.map((a) => (
          <Marker key={a.id} position={[a.lat!, a.lng!]} icon={icono(a.categoria)} title={a.nombre}>
            <Popup>
              <strong>{a.nombre}</strong>
              <br />
              {CATEGORIA_ACTOR[a.categoria]}
              {a.provincia ? ` · ${a.provincia}` : ''}
              {a.referencial ? <><br /><em>Ubicación aproximada</em></> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

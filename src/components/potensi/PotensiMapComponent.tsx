'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface PotentialItem {
  id: string;
  name: string;
  category: string;
  volume: number;
  value: number;
  province: string;
  city: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  sdm_terlibat: number;
}

interface PotensiMapComponentProps {
  potentials: PotentialItem[];
  selectedPotentialId?: string;
  zoom?: number;
}

export default function PotensiMapComponent({
  potentials,
  selectedPotentialId,
  zoom = 5
}: PotensiMapComponentProps) {
  let mapCenter: [number, number] = [-2.548926, 118.014863]; // Center of Indonesia
  let currentZoom = zoom;

  if (selectedPotentialId) {
    const selected = potentials.find(p => p.id === selectedPotentialId);
    if (selected) {
      mapCenter = [selected.latitude, selected.longitude];
      currentZoom = 9;
    }
  }

  // Custom golden marker icon for village potential hotspots
  const getPotentialMarkerIcon = (category: string, isSelected = false) => {
    let color = '#F77F00'; // Orange
    if (category === 'Pertanian') color = '#E9C46A'; // Yellow-Gold
    else if (category === 'Perkebunan') color = '#2A9D8F'; // Teal
    else if (category === 'Peternakan') color = '#A855F7'; // Purple
    else if (category === 'Perikanan') color = '#0284C7'; // Sky Blue
    else if (category === 'Pariwisata') color = '#EC4899'; // Pink

    const size = isSelected ? 22 : 16;
    const border = isSelected ? '3px solid #FFF' : '2px solid #FFF';

    return L.divIcon({
      className: 'custom-potential-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${border};
          box-shadow: 0 0 12px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        "></div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  // Safe Leaflet icon assets
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '450px' }}>
      <MapContainer
        center={mapCenter}
        zoom={currentZoom}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={mapCenter} zoom={currentZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {potentials.map((item) => {
          if (isNaN(item.latitude) || isNaN(item.longitude)) return null;
          const isSelected = item.id === selectedPotentialId;

          return (
            <Marker
              key={item.id}
              position={[item.latitude, item.longitude]}
              icon={getPotentialMarkerIcon(item.category, isSelected)}
            >
              <Popup>
                <div className="p-1 max-w-[240px]">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      ID: {item.id.substring(0, 8)}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 mb-1 leading-tight">
                    Desa {item.village}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2.5 flex items-center gap-1">
                    📍 {item.district}, {item.city}
                  </p>
                  
                  <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Potensi:</span>
                      <span className="text-slate-800 font-semibold">{item.name}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Estimasi Volume:</span>
                      <span className="text-slate-800 font-semibold">{item.volume.toLocaleString('id-ID')} {item.category === 'Pariwisata' ? 'Kunjungan' : 'Ton'}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Nilai Ekonomi:</span>
                      <span className="text-emerald-600 font-semibold">Rp {item.value.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">SDM Terlibat:</span>
                      <span className="text-slate-800 font-semibold">{item.sdm_terlibat} Orang</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

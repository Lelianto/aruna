'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CooperativeWithCommodities } from '@/types';
import Link from 'next/link';

// Component to dynamically pan/zoom map when center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapComponentProps {
  cooperatives: CooperativeWithCommodities[];
  buyerLocation?: {
    latitude: number;
    longitude: number;
    name: string;
    company_name: string;
  };
  connections?: Array<{
    coopId: string;
    allocated_quantity: number;
  }>;
  selectedCoopId?: string;
  zoom?: number;
}

export default function MapComponent({
  cooperatives,
  buyerLocation,
  connections = [],
  selectedCoopId,
  zoom = 5
}: MapComponentProps) {
  // Center of Indonesia by default
  let mapCenter: [number, number] = [-2.548926, 118.014863];
  let currentZoom = zoom;

  if (selectedCoopId) {
    const selected = cooperatives.find(c => c.id === selectedCoopId);
    if (selected) {
      mapCenter = [selected.latitude, selected.longitude];
      currentZoom = 8;
    }
  } else if (buyerLocation) {
    mapCenter = [buyerLocation.latitude, buyerLocation.longitude];
    currentZoom = 6;
  }

  // Create custom markers to avoid default Leaflet icon loading errors in Next.js
  const getCoopMarkerIcon = (grade: string = 'D', isSelected = false) => {
    let color = '#D62828'; // Red (D)
    if (grade === 'A') color = '#10B981'; // Green
    else if (grade === 'B') color = '#3B82F6'; // Blue
    else if (grade === 'C') color = '#F59E0B'; // Orange

    const size = isSelected ? 20 : 14;
    const padding = isSelected ? 3 : 2;

    return L.divIcon({
      className: 'custom-coop-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: ${padding}px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        "></div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  const getBuyerMarkerIcon = () => {
    return L.divIcon({
      className: 'custom-buyer-marker',
      html: `
        <div class="pulsing-dot-orange" style="
          background-color: #003049;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 4px solid #F77F00;
          box-shadow: 0 0 12px rgba(247,127,0,0.6);
        "></div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  };

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={currentZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <ChangeView center={mapCenter} zoom={currentZoom} />

        {/* Modern dark-themed tile layer matching Government Tech aesthetics */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Render Cooperatives */}
        {cooperatives.map(coop => {
          const isSelected = coop.id === selectedCoopId;
          const score = coop.score;
          const grade = score?.grade || 'D';

          return (
            <Marker
              key={coop.id}
              position={[coop.latitude, coop.longitude]}
              icon={getCoopMarkerIcon(grade, isSelected)}
            >
              <Popup>
                <div className="p-3 min-w-[220px] text-slate-800">
                  <h4 className="font-semibold text-sm text-brand-navy">{coop.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">{coop.city}, {coop.province}</p>

                  <div className="flex items-center gap-2 my-2 border-y py-2 border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">SKOR ARUNA</span>
                      <span className="font-semibold text-sm text-brand-navy">{score?.final_score || 0}/100</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-[11px] text-slate-400 block text-right font-medium">GRADE</span>
                      <span className={`inline-block font-semibold px-2 py-0.5 rounded text-white text-xs ${grade === 'A' ? 'bg-emerald-500' :
                          grade === 'B' ? 'bg-blue-500' :
                            grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                        {grade}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-[11px] text-slate-400 block font-medium mb-1">KOMODITAS UTAMA</span>
                    <div className="flex flex-wrap gap-1">
                      {coop.commodities.slice(0, 3).map(com => (
                        <span key={com.id} className="text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          {com.name} ({com.available_stock} {com.unit})
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/scoring?coopId=${coop.id}`}
                    className="block text-center text-xs bg-brand-red !text-white py-1.5 rounded-lg font-semibold hover:bg-brand-red/90 transition-colors"
                  >
                    Lihat Analitik Koperasi &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Render Buyer Location if provided */}
        {buyerLocation && (
          <Marker
            position={[buyerLocation.latitude, buyerLocation.longitude]}
            icon={getBuyerMarkerIcon()}
          >
            <Popup>
              <div className="p-3 min-w-[200px] text-slate-800">
                <span className="text-[11px] bg-brand-orange/15 text-brand-orange px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  National Buyer / Offtaker
                </span>
                <h4 className="font-semibold text-sm text-brand-navy mt-1.5">{buyerLocation.company_name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Pabrik: {buyerLocation.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Draw Connection Lines from Matchmaker */}
        {buyerLocation && connections.map(conn => {
          const coop = cooperatives.find(c => c.id === conn.coopId);
          if (!coop) return null;

          return (
            <React.Fragment key={`conn-${coop.id}`}>
              {/* Dynamic curved or dotted lines */}
              <Polyline
                positions={[
                  [coop.latitude, coop.longitude],
                  [buyerLocation.latitude, buyerLocation.longitude]
                ]}
                color="#F77F00"
                weight={3}
                opacity={0.8}
                dashArray="5, 8"
                className="animate-draw-line"
              >
                <Popup>
                  <div className="p-2 text-xs text-slate-800">
                    <span className="font-semibold">{coop.name}</span>
                    <br />
                    Mengirimkan <span className="font-semibold text-brand-navy">{conn.allocated_quantity.toLocaleString('id-ID')} ton</span> komoditas gotong royong.
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

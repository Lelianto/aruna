'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

interface PinpointMapComponentProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
}

function LocationMarker({ 
  onLocationSelect, 
  initialLocation 
}: { 
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLocation ? L.latLng(initialLocation[0], initialLocation[1]) : null
  );
  const map = useMap();

  useEffect(() => {
    if (initialLocation) {
      const latlng = L.latLng(initialLocation[0], initialLocation[1]);
      map.setView(latlng, 12);
    }
  }, [initialLocation, map]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const getMarkerIcon = () => {
    return L.divIcon({
      className: 'pinpoint-marker',
      html: `
        <div style="
          background-color: #F77F00;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 8px rgba(0,0,0,0.5);
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  };

  return position === null ? null : (
    <Marker position={position} icon={getMarkerIcon()} />
  );
}

export default function PinpointMapComponent({ 
  onLocationSelect, 
  initialLocation 
}: PinpointMapComponentProps) {
  const defaultCenter: [number, number] = initialLocation || [-2.548926, 118.014863];
  
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={initialLocation ? 8 : 5}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} initialLocation={initialLocation} />
      </MapContainer>
    </div>
  );
}

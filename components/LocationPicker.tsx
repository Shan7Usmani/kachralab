'use client';

import { useEffect, useRef } from 'react';

interface LocationPickerProps {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onPick }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { center: [lat, lng], zoom: 13 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#0e6f5c',
        weight: 2,
        fillColor: '#0e6f5c',
        fillOpacity: 0.9
      }).addTo(map);

      map.on('click', (event: any) => {
        const next = event.latlng;
        marker.setLatLng(next);
        onPickRef.current(Number(next.lat.toFixed(5)), Number(next.lng.toFixed(5)));
      });

      mapRef.current = map;
      markerRef.current = marker;
      requestAnimationFrame(() => map.invalidateSize());
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // The map is created once; later coordinates are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    if (mapRef.current) mapRef.current.setView([lat, lng], 15, { animate: true });
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="map-shell"
      style={{ height: 280 }}
      aria-label="Pick the complaint location on the map"
    />
  );
}

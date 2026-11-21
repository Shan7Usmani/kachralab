'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppState } from '@/lib/engine';

type LeafletNS = typeof import('leaflet');

interface RealMapProps {
  hotspots: AppState['hotspots'];
  selectedId: string;
  onSelect: (id: string) => void;
}

function toneColor(status: string): string {
  if (status === 'VERIFIED_CLEAN') return '#37c9a6';
  if (status === 'CRITICAL_P1' || status === 'RECURRING' || status === 'UNDER_MONITORING') return '#ef5b4c';
  if (status === 'NEW') return '#5a9df0';
  return '#f2b33d';
}

export default function RealMap({ hotspots, selectedId, onSelect }: RealMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletNS | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default as LeafletNS;
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center: [28.5703, 77.2432],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !leafletRef.current || !mapRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (layerRef.current) map.removeLayer(layerRef.current);

    const group = L.layerGroup();
    const selected = hotspots.find((h) => h.id === selectedId) || hotspots[0];

    hotspots.forEach((h) => {
      const isSelected = h.id === selectedId;
      const color = toneColor(h.status);

      if (isSelected) {
        L.circle([h.lat, h.lng], {
          radius: 150,
          color: h.monitor.spillover ? '#ef5b4c' : '#5a9df0',
          weight: 1.5,
          fillColor: h.monitor.spillover ? '#ef5b4c' : '#5a9df0',
          fillOpacity: 0.08,
          dashArray: '5 6'
        }).addTo(group);

        L.circle([h.lat, h.lng], {
          radius: 30,
          color: '#f2b33d',
          weight: 2,
          fillColor: '#f2b33d',
          fillOpacity: 0.14,
          dashArray: '3 4'
        }).addTo(group);
      }

      const marker = L.circleMarker([h.lat, h.lng], {
        radius: isSelected ? 9 : 7,
        color,
        weight: 2,
        fillColor: isSelected ? '#f2b33d' : '#0b1218',
        fillOpacity: 1
      }).addTo(group);

      marker.bindTooltip(h.id, {
        permanent: isSelected,
        direction: 'top',
        className: 'kl-map-tooltip'
      });
      marker.on('click', () => onSelectRef.current(h.id));
    });

    if (selected && selected.monitor.spillover) {
      const depot = { lat: selected.lat - 0.0014, lng: selected.lng - 0.0022 };
      const spill = { lat: selected.lat + 0.00045, lng: selected.lng + 0.00095 };
      L.polyline(
        [[depot.lat, depot.lng], [selected.lat, selected.lng], [spill.lat, spill.lng]],
        { color: '#ef5b4c', weight: 3, dashArray: '7 6' }
      ).addTo(group);
      L.circleMarker([depot.lat, depot.lng], {
        radius: 6, color: '#f2b33d', fillColor: '#f2b33d', fillOpacity: 1
      }).bindTooltip('DEPOT', { permanent: true, direction: 'bottom' }).addTo(group);
      L.circleMarker([spill.lat, spill.lng], {
        radius: 5, color: '#ef5b4c', fillColor: '#ef5b4c', fillOpacity: 1
      }).bindTooltip('SPILLOVER', { permanent: true, direction: 'top' }).addTo(group);
    }

    group.addTo(map);
    layerRef.current = group;
    if (selected) map.panTo([selected.lat, selected.lng], { animate: true });
    map.invalidateSize();
  }, [ready, hotspots, selectedId]);

  return <div ref={containerRef} className="real-map" aria-label="Real OpenStreetMap hotspot map" />;
}

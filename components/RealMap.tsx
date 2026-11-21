'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppState } from '@/lib/engine';

type LeafletNS = typeof import('leaflet');

interface RealMapProps {
  hotspots: AppState['hotspots'];
  selectedId: string;
  onSelect: (id: string) => void;
}

const COLORS = {
  danger: '#b42318',
  warn: '#b54708',
  ok: '#067647',
  info: '#175cd3',
  accent: '#0e6f5c'
};

function toneColor(status: string): string {
  if (status === 'VERIFIED_CLEAN') return COLORS.ok;
  if (status === 'CRITICAL_P1' || status === 'RECURRING' || status === 'UNDER_MONITORING') return COLORS.danger;
  if (status === 'NEW') return COLORS.info;
  return COLORS.warn;
}

export default function RealMap({ hotspots, selectedId, onSelect }: RealMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletNS | null>(null);
  const mapRef = useRef<ReturnType<LeafletNS['map']> | null>(null);
  const layerRef = useRef<ReturnType<LeafletNS['layerGroup']> | null>(null);
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
        zoom: 12,
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

    hotspots.forEach((hotspot) => {
      const isSelected = hotspot.id === selectedId;
      const color = toneColor(hotspot.status);

      if (isSelected) {
        L.circle([hotspot.lat, hotspot.lng], {
          radius: 150,
          color: hotspot.monitor.spillover ? COLORS.danger : COLORS.info,
          weight: 1.5,
          fillColor: hotspot.monitor.spillover ? COLORS.danger : COLORS.info,
          fillOpacity: 0.06,
          dashArray: '5 6'
        }).addTo(group);

        L.circle([hotspot.lat, hotspot.lng], {
          radius: 30,
          color: COLORS.accent,
          weight: 2,
          fillColor: COLORS.accent,
          fillOpacity: 0.1,
          dashArray: '3 4'
        }).addTo(group);
      }

      const marker = L.circleMarker([hotspot.lat, hotspot.lng], {
        radius: isSelected ? 9 : 7,
        color,
        weight: 2,
        fillColor: isSelected ? COLORS.accent : '#ffffff',
        fillOpacity: 1
      }).addTo(group);

      marker.bindTooltip(hotspot.id, {
        permanent: isSelected,
        direction: 'top',
        className: 'kl-map-tooltip'
      });
      marker.on('click', () => onSelectRef.current(hotspot.id));
    });

    if (selected?.monitor.spillover) {
      const depot = { lat: selected.lat - 0.0014, lng: selected.lng - 0.0022 };
      const spill = { lat: selected.lat + 0.00045, lng: selected.lng + 0.00095 };

      L.polyline(
        [
          [depot.lat, depot.lng],
          [selected.lat, selected.lng],
          [spill.lat, spill.lng]
        ],
        { color: COLORS.danger, weight: 3, dashArray: '7 6' }
      ).addTo(group);

      L.circleMarker([depot.lat, depot.lng], {
        radius: 6,
        color: COLORS.warn,
        fillColor: COLORS.warn,
        fillOpacity: 1
      })
        .bindTooltip('DEPOT', { permanent: true, direction: 'bottom', className: 'kl-map-tooltip' })
        .addTo(group);

      L.circleMarker([spill.lat, spill.lng], {
        radius: 5,
        color: COLORS.danger,
        fillColor: COLORS.danger,
        fillOpacity: 1
      })
        .bindTooltip('SPILLOVER', { permanent: true, direction: 'top', className: 'kl-map-tooltip' })
        .addTo(group);
    }

    group.addTo(map);
    layerRef.current = group;

    if (selected) map.panTo([selected.lat, selected.lng], { animate: true });
    map.invalidateSize();
  }, [ready, hotspots, selectedId]);

  return <div ref={containerRef} className="real-map" style={{ height: '100%', width: '100%' }} aria-label="Hotspot map" />;
}

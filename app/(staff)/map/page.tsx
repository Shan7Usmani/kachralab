'use client';

import Link from 'next/link';
import RealMap from '@/components/RealMap';
import { Card, Icon, PageHeader, StatusBadge } from '@/components/ui';
import { RAIN, computeRisk } from '@/lib/engine';
import { useStore } from '@/lib/store';

export default function MapPage() {
  const { state, dispatch } = useStore();
  const multiplier = state.rain ? RAIN.monsoon : RAIN.dry;
  const ranked = state.hotspots
    .map((hotspot) => ({ hotspot, risk: computeRisk(hotspot.factors, multiplier) }))
    .sort((a, b) => b.risk.capped - a.risk.capped);

  return (
    <>
      <PageHeader
        eyebrow="Spatial view"
        title="Hotspot map"
        description="Illustrative Delhi NCR coordinates. Select a case to inspect its cluster radius and spillover halo."
        actions={
          <Link className="btn" href="/hotspots">
            Open case queue
          </Link>
        }
      />

      <div className="split" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)' }}>
        <Card flush>
          <div className="map-shell" style={{ height: 'calc(100vh - 230px)', minHeight: 520 }}>
            <RealMap
              hotspots={state.hotspots}
              selectedId={state.selectedId}
              onSelect={(id) => dispatch({ type: 'select', id })}
            />
          </div>
        </Card>

        <Card title="Cases" subtitle="Ordered by current risk" flush>
          <ul className="case-list">
            {ranked.map(({ hotspot, risk }) => (
              <li key={hotspot.id}>
                <button
                  type="button"
                  className={hotspot.id === state.selectedId ? 'active' : ''}
                  onClick={() => dispatch({ type: 'select', id: hotspot.id })}
                >
                  <span>
                    <span className="case-id">{hotspot.id}</span>
                    <span className="cell-main" style={{ display: 'block' }}>
                      {hotspot.name}
                    </span>
                    <span className="cell-sub">{hotspot.ward}</span>
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <span className="risk-cell">{risk.capped}</span>
                    <span style={{ display: 'block', marginTop: 4 }}>
                      <StatusBadge status={hotspot.status} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="card-foot">
            <span className="legend">
              <span>
                <i style={{ background: '#b42318' }} />
                Critical / recurring
              </span>
              <span>
                <i style={{ background: '#b54708' }} />
                Monitoring
              </span>
              <span>
                <i style={{ background: '#067647' }} />
                Verified
              </span>
            </span>
          </div>
        </Card>
      </div>

      <p className="small muted mt-16">
        <Icon name="map" size={13} /> Base map © OpenStreetMap contributors. Tiles require a network
        connection; all case geometry is drawn locally.
      </p>
    </>
  );
}

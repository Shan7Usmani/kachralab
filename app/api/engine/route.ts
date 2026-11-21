import { NextResponse } from 'next/server';
import {
  computeRisk,
  createSeedState,
  haversineMeters,
  normalizeVerdict,
  simulateVision
} from '@/lib/engine';

export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  switch (body.op) {
    case 'ping':
      return NextResponse.json({ ok: true, service: 'kachralab-engine', at: Date.now() });

    case 'risk':
      return NextResponse.json(computeRisk(body.factors, body.rain ?? 1));

    case 'cluster': {
      const point = { lat: Number(body.lat), lng: Number(body.lng) };
      const hotspots = Array.isArray(body.hotspots) ? body.hotspots : createSeedState().hotspots;
      let matchedId: string | null = null;
      let distance = Infinity;
      hotspots.forEach((h: any) => {
        const d = haversineMeters(point, { lat: Number(h.lat), lng: Number(h.lng) });
        if (d < distance) {
          distance = d;
          matchedId = h.id;
        }
      });
      const matched = distance <= 30 ? matchedId : null;
      return NextResponse.json({
        distanceMeters: Number(distance.toFixed(1)),
        matchedId: matched,
        action: matched ? 'MERGE' : 'NEW_NODE',
        thresholdMeters: 30
      });
    }

    case 'verdict':
      return NextResponse.json(normalizeVerdict(body.mode, body.hotspot));

    case 'vision':
      return NextResponse.json(simulateVision());

    default:
      return NextResponse.json({ error: 'Unknown operation' }, { status: 400 });
  }
}

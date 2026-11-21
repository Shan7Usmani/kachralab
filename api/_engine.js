'use strict';

const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(a, b) {
  const p1 = toRad(a.lat);
  const p2 = toRad(b.lat);
  const dp = toRad(b.lat - a.lat);
  const dl = toRad(b.lng - a.lng);
  const h =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function computeRisk(factors, rainMultiplier) {
  const m = Number.isFinite(rainMultiplier) ? rainMultiplier : 1;
  const f = factors || {};
  const parts = {
    recurrence: (Number(f.recurrence) || 0) * 0.35,
    hazard: (Number(f.hazard) || 0) * 0.25,
    proximity: (Number(f.proximity) || 0) * 0.25,
    duration: (Number(f.duration) || 0) * 0.15
  };
  const raw = (parts.recurrence + parts.hazard + parts.proximity + parts.duration) * m;
  return {
    parts,
    rainMultiplier: m,
    raw: Number(raw.toFixed(2)),
    capped: Math.min(100, Math.round(raw)),
    capApplied: raw > 100
  };
}

function simulateVision() {
  return {
    source: 'RULE-BASED SIMULATION',
    fractions: [
      { label: 'LDPE polybags', value: 64 },
      { label: 'PET bottles', value: 24 },
      { label: 'Organic sludge', value: 12 }
    ],
    massKg: 310,
    severity: 'HIGH',
    dispatch: 'PRIORITY 1 - DISPATCH SQUAD'
  };
}

function normalizeVerdict(mode, hotspot) {
  const currentDay = (hotspot && hotspot.monitor && hotspot.monitor.currentDay) || 4;
  const checkpoints = Array.from({ length: 14 }, (_, i) =>
    i < currentDay ? 'clean' : 'pending'
  );

  if (mode === 'recurrence') {
    checkpoints[4] = 'failed';
    return {
      mode: 'RECURRENCE',
      checkpoints,
      spillover: true,
      status: 'RECURRING',
      escrow: 'WITHHELD',
      heldAmount: 7200,
      message: 'Day 5 dumping detected. Secondary pile flagged inside the 150 m halo.'
    };
  }

  if (mode === 'success') {
    for (let i = 0; i < 14; i += 1) checkpoints[i] = 'clean';
    return {
      mode: 'SUCCESS',
      checkpoints,
      spillover: false,
      status: 'VERIFIED_CLEAN',
      escrow: 'RELEASED',
      heldAmount: 0,
      message: '14 consecutive clean days verified. Escrow released to contractor.'
    };
  }

  return {
    mode: 'RESET',
    checkpoints,
    spillover: false,
    status: (hotspot && hotspot.status) || 'UNDER_MONITORING',
    escrow: 'HELD',
    heldAmount: 7200,
    message: 'Monitoring window restored to seed state.'
  };
}

function diagnose(hotspot) {
  const type = ((hotspot && hotspot.wasteType) || '').toLowerCase();
  if (type.indexOf('organic') >= 0) {
    return [
      { title: 'Morning wholesale timing mismatch', evidence: '12 reports cluster between 06:00 and 09:00; collection beat arrives after stalls close.' },
      { title: 'Containerization deficit', evidence: 'No covered bulk bin within the market ring; loose vegetable slurry enters storm drains.' },
      { title: 'Night-time plastic dumping', evidence: 'LDPE fraction dominates the simulated vision pass at 64%.' }
    ];
  }
  if (type.indexOf('construction') >= 0) {
    return [
      { title: 'Midnight renovation dumping', evidence: 'C&D debris appears on a hospital corridor with no permits on record.' },
      { title: 'Missing material recovery point', evidence: 'No designated aggregate holding bay within 150 m of the junction.' },
      { title: 'Contractor route leakage', evidence: 'Debris type matches nearby demolition waste streams.' }
    ];
  }
  if (type.indexOf('industrial') >= 0) {
    return [
      { title: 'Industrial night dumping', evidence: 'Packaging and silt fractions peak between 23:00 and 04:00.' },
      { title: 'Drain silt overflow', evidence: 'Monsoon multiplier raises leachate transmission risk into the stormwater line.' },
      { title: 'Unsegregated contractor haul', evidence: 'Industrial packaging appears without a manifest trail.' }
    ];
  }
  if (type.indexOf('food') >= 0) {
    return [
      { title: 'Bin capacity deficit', evidence: 'Food stalls outnumber available collection points on the outer circle.' },
      { title: 'Peak-hour sweep gap', evidence: 'Cups and packaging accumulate before the evening cleaning round.' },
      { title: 'Informal disposal', evidence: 'Single-use packaging is visible in the adjacent drainage channel.' }
    ];
  }
  return [
    { title: 'Seasonal leaf-litter accumulation', evidence: 'Dry leaves dominate the mixed municipal fraction in this ward.' },
    { title: 'Missed sweep window', evidence: 'Reports rise after the second weekly collection slot.' },
    { title: 'Low-severity but persistent site', evidence: 'Risk remains low at 18, yet recurrence history keeps the case open.' }
  ];
}

module.exports = {
  EARTH_RADIUS_M,
  haversineMeters,
  computeRisk,
  simulateVision,
  normalizeVerdict,
  diagnose
};

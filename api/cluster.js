'use strict';

const { haversineMeters } = require('./_engine');

function readJson(req, cb) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    try {
      cb(null, JSON.parse(body || '{}'));
    } catch (err) {
      cb(err);
    }
  });
}

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'POST required' }));
    return;
  }
  readJson(req, (err, payload) => {
    if (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    const point = { lat: Number(payload.lat), lng: Number(payload.lng) };
    const hotspots = Array.isArray(payload.hotspots) ? payload.hotspots : [];
    let best = null;
    let distance = Infinity;

    hotspots.forEach((h) => {
      const d = haversineMeters(point, { lat: Number(h.lat), lng: Number(h.lng) });
      if (d < distance) {
        distance = d;
        best = h;
      }
    });

    const matched = distance <= 30 ? best : null;
    res.end(JSON.stringify({
      distanceMeters: Number(distance.toFixed(1)),
      matchedId: matched ? matched.id : null,
      action: matched ? 'MERGE' : 'NEW_NODE',
      thresholdMeters: 30
    }));
  });
};

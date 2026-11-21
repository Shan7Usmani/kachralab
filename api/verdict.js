'use strict';

const { normalizeVerdict } = require('./_engine');

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
    res.end(JSON.stringify(normalizeVerdict(payload.mode, payload.hotspot)));
  });
};

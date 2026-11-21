(function () {
  'use strict';

  var STORE_KEY = 'kachralab.state.v1';
  var API_MODE = window.location.protocol !== 'file:';
  var apiOnline = API_MODE;
  var RAIN = { dry: 1, monsoon: 1.35 };

  function makeCheckpoints(done) {
    return Array.from({ length: 14 }, function (_, i) {
      return i < done ? 'clean' : 'pending';
    });
  }

  var SEED = [
    {
      id: 'GZ-042',
      name: 'Lajpat Nagar Central Market Ring Road',
      ward: 'Ward 58 · South Delhi',
      lat: 28.5703276,
      lng: 77.2432,
      wasteType: 'Organic + Single-Use Plastic',
      reports30d: 12,
      factors: { recurrence: 96, hazard: 85, proximity: 70, duration: 62 },
      status: 'UNDER_MONITORING',
      monitor: { currentDay: 4, checkpoints: makeCheckpoints(4), spillover: false },
      contract: { total: 12000, escrow: 'HELD', heldAmount: 7200 }
    },
    {
      id: 'GZ-018',
      name: 'Karol Bagh Pusa Road Junction',
      ward: 'Ward 42 · Central Delhi',
      lat: 28.6348,
      lng: 77.188,
      wasteType: 'Construction & Demolition (C&D)',
      reports30d: 7,
      factors: { recurrence: 80, hazard: 94, proximity: 100, duration: 76 },
      status: 'CRITICAL_P1',
      monitor: { currentDay: 0, checkpoints: makeCheckpoints(0), spillover: false },
      contract: { total: 12000, escrow: 'HELD', heldAmount: 7200 }
    },
    {
      id: 'GZ-031',
      name: 'Saket Press Enclave Community Center',
      ward: 'Ward 71 · South Delhi',
      lat: 28.5245,
      lng: 77.207,
      wasteType: 'Mixed Municipal & Dry Leaves',
      reports30d: 4,
      factors: { recurrence: 20, hazard: 15, proximity: 24, duration: 10 },
      status: 'VERIFIED_CLEAN',
      monitor: { currentDay: 14, checkpoints: makeCheckpoints(14), spillover: false },
      contract: { total: 12000, escrow: 'RELEASED', heldAmount: 0 }
    },
    {
      id: 'GZ-009',
      name: 'Connaught Place Outer Circle Block B',
      ward: 'Ward 19 · New Delhi',
      lat: 28.6315,
      lng: 77.2167,
      wasteType: 'Food Packaging & Cups',
      reports30d: 5,
      factors: { recurrence: 65, hazard: 70, proximity: 55, duration: 66 },
      status: 'IN_INTERVENTION',
      monitor: { currentDay: 2, checkpoints: makeCheckpoints(2), spillover: false },
      contract: { total: 12000, escrow: 'HELD', heldAmount: 7200 }
    },
    {
      id: 'GZ-055',
      name: 'Okhla Phase III / Govindpuri Crossing',
      ward: 'Ward 83 · South-East Delhi',
      lat: 28.539,
      lng: 77.279,
      wasteType: 'Industrial Packaging & Silt',
      reports30d: 8,
      factors: { recurrence: 88, hazard: 72, proximity: 62, duration: 65 },
      status: 'RECURRING',
      monitor: { currentDay: 1, checkpoints: makeCheckpoints(1), spillover: false },
      contract: { total: 12000, escrow: 'HELD', heldAmount: 7200 }
    }
  ];

  var STATUS = {
    UNDER_MONITORING: { label: 'RECURRING / 14-DAY WATCH', cls: '' },
    CRITICAL_P1: { label: 'CRITICAL P1', cls: 'is-red' },
    VERIFIED_CLEAN: { label: 'VERIFIED CLEAN', cls: 'is-teal' },
    IN_INTERVENTION: { label: 'IN INTERVENTION', cls: '' },
    RECURRING: { label: 'RECURRING', cls: 'is-red' }
  };

  function seedState() {
    return {
      ui: { rain: false, selected: 'GZ-042', chapter: 1 },
      hotspots: JSON.parse(JSON.stringify(SEED)),
      reports: [],
      vision: null,
      lastVerdict: null
    };
  }

  function normalizeState(raw) {
    var base = seedState();
    if (!raw || !Array.isArray(raw.hotspots)) return base;

    base.ui = Object.assign(base.ui, raw.ui || {});
    base.hotspots = base.hotspots.map(function (h) {
      var saved = raw.hotspots.find(function (s) { return s.id === h.id; });
      if (!saved) return h;
      return {
        id: h.id,
        name: h.name,
        ward: h.ward,
        lat: Number.isFinite(saved.lat) ? saved.lat : h.lat,
        lng: Number.isFinite(saved.lng) ? saved.lng : h.lng,
        wasteType: h.wasteType,
        reports30d: Number.isFinite(saved.reports30d) ? saved.reports30d : h.reports30d,
        factors: Object.assign({}, h.factors, saved.factors || {}),
        status: saved.status || h.status,
        monitor: Object.assign({}, h.monitor, saved.monitor || {}),
        contract: Object.assign({}, h.contract, saved.contract || {})
      };
    });
    base.reports = Array.isArray(raw.reports) ? raw.reports : [];
    base.vision = raw.vision || null;
    base.lastVerdict = raw.lastVerdict || null;
    return base;
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : seedState();
    } catch (e) {
      return seedState();
    }
  }

  function saveState() {
    try {
      var clean = {
        ui: state.ui,
        hotspots: state.hotspots.map(function (h) {
          var copy = JSON.parse(JSON.stringify(h));
          delete copy._risk;
          return copy;
        }),
        reports: state.reports,
        vision: state.vision,
        lastVerdict: state.lastVerdict
      };
      window.localStorage.setItem(STORE_KEY, JSON.stringify(clean));
    } catch (e) {
      setApiStatus('SESSION MEMORY UNAVAILABLE');
    }
  }

  var state = loadState();

  function inr(n) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n || 0);
  }

  function announce(text) {
    var region = document.getElementById('live-region');
    if (region) region.textContent = text;
  }

  function setApiStatus(text) {
    var el = document.getElementById('api-status');
    if (el) el.textContent = text;
  }

  function toRad(d) { return (d * Math.PI) / 180; }

  function haversineMeters(a, b) {
    var p1 = toRad(a.lat);
    var p2 = toRad(b.lat);
    var dp = toRad(b.lat - a.lat);
    var dl = toRad(b.lng - a.lng);
    var h = Math.sin(dp / 2) ** 2 +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  }

  function computeRisk(factors, rainMultiplier) {
    var m = Number.isFinite(rainMultiplier) ? rainMultiplier : 1;
    var f = factors || {};
    var parts = {
      recurrence: (Number(f.recurrence) || 0) * 0.35,
      hazard: (Number(f.hazard) || 0) * 0.25,
      proximity: (Number(f.proximity) || 0) * 0.25,
      duration: (Number(f.duration) || 0) * 0.15
    };
    var raw = (parts.recurrence + parts.hazard + parts.proximity + parts.duration) * m;
    return {
      parts: parts,
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
    var day = (hotspot && hotspot.monitor && hotspot.monitor.currentDay) || 4;
    var checkpoints = makeCheckpoints(day);
    if (mode === 'recurrence') {
      checkpoints[4] = 'failed';
      return {
        mode: 'RECURRENCE',
        checkpoints: checkpoints,
        spillover: true,
        status: 'RECURRING',
        escrow: 'WITHHELD',
        heldAmount: 7200,
        message: 'Day 5 dumping detected. Secondary pile flagged inside the 150 m halo.'
      };
    }
    if (mode === 'success') {
      for (var i = 0; i < 14; i += 1) checkpoints[i] = 'clean';
      return {
        mode: 'SUCCESS',
        checkpoints: checkpoints,
        spillover: false,
        status: 'VERIFIED_CLEAN',
        escrow: 'RELEASED',
        heldAmount: 0,
        message: '14 consecutive clean days verified. Escrow released to contractor.'
      };
    }
    return {
      mode: 'RESET',
      checkpoints: checkpoints,
      spillover: false,
      status: (hotspot && hotspot.status) || 'UNDER_MONITORING',
      escrow: 'HELD',
      heldAmount: 7200,
      message: 'Monitoring window restored to seed state.'
    };
  }

  function diagnose(hotspot) {
    var t = (hotspot.wasteType || '').toLowerCase();
    if (t.indexOf('organic') >= 0) {
      return [
        { title: 'Morning wholesale timing mismatch', evidence: '12 reports cluster between 06:00 and 09:00; collection beat arrives after stalls close.' },
        { title: 'Containerization deficit', evidence: 'No covered bulk bin inside the market ring; vegetable slurry enters storm drains.' },
        { title: 'Night-time plastic dumping', evidence: 'LDPE fraction dominates the simulated vision pass at 64%.' }
      ];
    }
    if (t.indexOf('construction') >= 0) {
      return [
        { title: 'Midnight renovation dumping', evidence: 'C&D debris appears on a hospital corridor with no permit trail.' },
        { title: 'Missing material recovery point', evidence: 'No aggregate holding bay within 150 m of the junction.' },
        { title: 'Contractor route leakage', evidence: 'Debris type matches nearby demolition waste streams.' }
      ];
    }
    if (t.indexOf('industrial') >= 0) {
      return [
        { title: 'Industrial night dumping', evidence: 'Packaging and silt fractions peak between 23:00 and 04:00.' },
        { title: 'Drain silt overflow', evidence: 'Monsoon multiplier raises leachate transmission into the stormwater line.' },
        { title: 'Unsegregated contractor haul', evidence: 'Industrial packaging appears without a manifest trail.' }
      ];
    }
    if (t.indexOf('food') >= 0) {
      return [
        { title: 'Bin capacity deficit', evidence: 'Food stalls outnumber collection points on the outer circle.' },
        { title: 'Peak-hour sweep gap', evidence: 'Cups and packaging accumulate before the evening round.' },
        { title: 'Informal disposal', evidence: 'Single-use packaging is visible in the adjacent drain.' }
      ];
    }
    return [
      { title: 'Seasonal leaf-litter accumulation', evidence: 'Dry leaves dominate the mixed municipal fraction in this ward.' },
      { title: 'Missed sweep window', evidence: 'Reports rise after the second weekly collection slot.' },
      { title: 'Low-severity but persistent site', evidence: 'Risk stays low at 18, yet recurrence history keeps the case open.' }
    ];
  }

  function postJson(path, payload) {
    return fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) throw new Error('API error');
      return response.json();
    });
  }

  function markFallback() {
    if (apiOnline) {
      apiOnline = false;
      setApiStatus('ENGINE: LOCAL / FALLBACK');
    }
  }

  function apiRisk(factors, rain) {
    if (!apiOnline) return Promise.resolve(computeRisk(factors, rain));
    return postJson('/api/risk', { factors: factors, rain: rain })
      .catch(function () { markFallback(); return computeRisk(factors, rain); });
  }

  function apiCluster(point, hotspots) {
    if (!apiOnline) {
      return Promise.resolve(localCluster(point, hotspots));
    }
    return postJson('/api/cluster', { lat: point.lat, lng: point.lng, hotspots: hotspots })
      .catch(function () { markFallback(); return localCluster(point, hotspots); });
  }

  function apiVision() {
    if (!apiOnline) return Promise.resolve(simulateVision());
    return postJson('/api/vision', {})
      .catch(function () { markFallback(); return simulateVision(); });
  }

  function apiVerdict(mode, hotspot) {
    if (!apiOnline) return Promise.resolve(normalizeVerdict(mode, hotspot));
    return postJson('/api/verdict', { mode: mode, hotspot: hotspot })
      .catch(function () { markFallback(); return normalizeVerdict(mode, hotspot); });
  }

  function localCluster(point, hotspots) {
    var best = null;
    var distance = Infinity;
    hotspots.forEach(function (h) {
      var d = haversineMeters(point, { lat: h.lat, lng: h.lng });
      if (d < distance) {
        distance = d;
        best = h;
      }
    });
    return {
      distanceMeters: Number(distance.toFixed(1)),
      matchedId: distance <= 30 && best ? best.id : null,
      action: distance <= 30 && best ? 'MERGE' : 'NEW_NODE',
      thresholdMeters: 30
    };
  }

  function selectedHotspot() {
    return state.hotspots.find(function (h) { return h.id === state.ui.selected; }) || state.hotspots[0];
  }

  function statusMeta(status) {
    return STATUS[status] || { label: status || 'UNKNOWN', cls: '' };
  }

  function renderTop(h) {
    var meta = statusMeta(h.status);
    document.getElementById('top-status').textContent = h.id + ' · ' + meta.label;
    var rainOn = state.ui.rain;
    document.getElementById('rain-toggle').setAttribute('aria-pressed', rainOn ? 'true' : 'false');
    document.getElementById('rain-label').textContent = rainOn ? 'MONSOON · M 1.35×' : 'DRY · M 1.00×';
  }

  function renderTable() {
    var body = document.getElementById('hotspot-tbody');
    body.innerHTML = state.hotspots.map(function (h) {
      var meta = statusMeta(h.status);
      var risk = h._risk || computeRisk(h.factors, state.ui.rain ? RAIN.monsoon : RAIN.dry);
      return '<tr data-id="' + h.id + '" class="' + (h.id === state.ui.selected ? 'is-selected' : '') + '">' +
        '<td>' + h.id + '</td>' +
        '<td>' + h.name + '<br><span class="status-tag">' + h.ward + '</span></td>' +
        '<td>' + h.wasteType + '</td>' +
        '<td>' + h.reports30d + '</td>' +
        '<td class="risk-cell">' + risk.capped + '</td>' +
        '<td><span class="status-tag">' + meta.label + '</span></td>' +
        '</tr>';
    }).join('');
  }

  function renderCase(h) {
    var meta = statusMeta(h.status);
    var risk = h._risk || computeRisk(h.factors, state.ui.rain ? RAIN.monsoon : RAIN.dry);
    var statusEl = document.getElementById('case-status');
    statusEl.textContent = meta.label;
    statusEl.className = 'pill ' + meta.cls;
    document.getElementById('case-title').textContent = h.id + ' / ' + h.ward.split('·')[0].trim();
    document.getElementById('case-risk').textContent = risk.capped;
    document.getElementById('case-risk-raw').textContent = 'raw ' + risk.raw;
    document.getElementById('case-cap').textContent = risk.capApplied ? 'CAP 100 APPLIED' : '';
    document.getElementById('case-day').textContent = 'DAY ' + String(h.monitor.currentDay).padStart(2, '0') + ' OF 14';
    document.getElementById('case-reports').textContent = h.reports30d;
    document.getElementById('case-waste').textContent = h.wasteType;

    var escrowClass = h.contract.escrow === 'RELEASED' ? 'is-released' :
      h.contract.escrow === 'WITHHELD' ? 'is-withheld' : '';
    var barClass = h.contract.escrow === 'RELEASED' ? 'is-released' :
      h.contract.escrow === 'WITHHELD' ? 'is-withheld' : 'is-held';
    var escrowText = h.contract.escrow === 'RELEASED' ? 'RELEASED' :
      h.contract.escrow === 'WITHHELD' ? 'FORFEITED' : inr(h.contract.heldAmount) + ' HELD';

    document.getElementById('case-ledger').innerHTML =
      '<div class="ledger-label">OUTCOME-LINKED SLA / 40 : 60</div>' +
      '<div class="ledger-bar"><i class="clear"></i><i class="hold ' + barClass + '"></i></div>' +
      '<div class="ledger-amounts"><span>40% CLEAR<br>' + inr(h.contract.total * 0.4) + '</span>' +
      '<em class="' + escrowClass + '">60% HOLD<br>' + escrowText + '</em></div>';

    var factorDefs = [
      ['RECURRENCE', h.factors.recurrence, 0.35, risk.parts.recurrence],
      ['HAZARD', h.factors.hazard, 0.25, risk.parts.hazard],
      ['PROXIMITY', h.factors.proximity, 0.25, risk.parts.proximity],
      ['DURATION', h.factors.duration, 0.15, risk.parts.duration]
    ];
    document.getElementById('case-factors').innerHTML = factorDefs.map(function (d) {
      return '<div class="factor-line"><span>' + d[0] + ' ×' + d[2].toFixed(2) + '</span>' +
        '<i><b style="width:' + d[1] + '%"></b></i><span>' + d[3].toFixed(1) + '</span></div>';
    }).join('');
  }

  function renderFormula(h) {
    var risk = h._risk || computeRisk(h.factors, state.ui.rain ? RAIN.monsoon : RAIN.dry);
    var m = state.ui.rain ? RAIN.monsoon : RAIN.dry;
    document.getElementById('m-rain').textContent = 'M ' + m.toFixed(2);
    var bars = [
      ['RECURRENCE 0.35', risk.parts.recurrence, 35],
      ['HAZARD 0.25', risk.parts.hazard, 25],
      ['PROXIMITY 0.25', risk.parts.proximity, 25],
      ['DURATION 0.15', risk.parts.duration, 15]
    ];
    document.getElementById('factor-bars').innerHTML = bars.map(function (b) {
      var pct = Math.min(100, (b[1] / b[2]) * 100);
      return '<div class="factor-bar"><span>' + b[0] + '</span><i><b style="width:' + pct.toFixed(1) + '%"></b></i>' +
        '<span>' + b[1].toFixed(1) + '</span></div>';
    }).join('');
  }

  function renderTimeline(h) {
    var ticks = h.monitor.checkpoints;
    if (!Array.isArray(ticks) || ticks.length !== 14) ticks = makeCheckpoints(h.monitor.currentDay || 0);
    document.getElementById('timeline-14').innerHTML = ticks.map(function (stateName, i) {
      return '<div class="tick ' + stateName + '" title="Day ' + (i + 1) + ' · ' + stateName.toUpperCase() + '">' +
        String(i + 1).padStart(2, '0') + '</div>';
    }).join('');
    document.getElementById('spillover-alert').classList.toggle('hidden', !h.monitor.spillover);
  }

  function renderVision() {
    var v = state.vision;
    var clusterOut = document.getElementById('cluster-output');
    var visionOut = document.getElementById('vision-output');

    if (!v) {
      clusterOut.innerHTML = 'NO REPORT ANALYSED. Load the Lajpat Nagar preset and submit a report.';
      visionOut.innerHTML = '<div class="vision-meta">AWAITING SIMULATED VISION PASS</div>';
      return;
    }

    clusterOut.innerHTML = '<strong>' + v.distance + ' m FROM ' + v.matchedId + '</strong> · ' +
      v.action + ' · recurrence counter incremented to ' +
      (selectedHotspot().reports30d) + '.';

    visionOut.innerHTML = '<div class="vision-meta">' + v.source + ' · ' + v.severity + ' · ' + v.dispatch + '</div>' +
      v.fractions.map(function (f) {
        return '<div class="vision-row"><span>' + f.label + '</span><i><b style="width:' + f.value + '%"></b></i>' +
          '<span>' + f.value + '%</span></div>';
      }).join('') +
      '<div class="vision-meta">ESTIMATED VOLUME ~' + v.massKg + ' KG</div>';
  }

  function renderVerdict(v) {
    if (!v) {
      document.getElementById('verdict-output').innerHTML = 'NO VERDICT RUN. Monitoring window is live at Day 04 of 14.';
      return;
    }
    document.getElementById('verdict-output').innerHTML =
      '<strong>' + v.mode + '</strong> · ' + v.message +
      '<br>ESCROW: <span class="' + (v.escrow === 'RELEASED' ? 'ok' : 'warn') + '">' + v.escrow + '</span>';
  }

  function renderRootCause(h) {
    document.getElementById('root-cause-list').innerHTML = diagnose(h).map(function (d, i) {
      return '<article class="cause-card"><span>HYPOTHESIS 0' + (i + 1) + '</span>' +
        '<h3>' + d.title + '</h3><p>' + d.evidence + '</p></article>';
    }).join('');
  }

  function renderMap(h) {
    document.querySelectorAll('.marker').forEach(function (m) {
      m.classList.toggle('is-selected', m.getAttribute('data-id') === h.id);
    });
    var marker = document.querySelector('.marker[data-id="' + h.id + '"]');
    if (marker) {
      document.getElementById('rings').setAttribute('transform',
        'translate(' + marker.getAttribute('data-x') + ',' + marker.getAttribute('data-y') + ')');
    }
    var halo = document.querySelector('.ring150');
    if (halo) halo.style.stroke = h.monitor.spillover ? 'var(--red)' : 'var(--monsoon)';
  }

  function renderAll() {
    var rainValue = state.ui.rain ? RAIN.monsoon : RAIN.dry;
    return Promise.all(state.hotspots.map(function (h) {
      return apiRisk(h.factors, rainValue).then(function (r) {
        h._risk = r;
      });
    })).then(function () {
      var h = selectedHotspot();
      renderTop(h);
      renderTable();
      renderCase(h);
      renderFormula(h);
      renderTimeline(h);
      renderVision();
      renderVerdict(state.lastVerdict);
      renderRootCause(h);
      renderMap(h);
      saveState();
    });
  }

  function goToChapter(n) {
    var section = document.getElementById('chapter-' + n);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setActiveChapter(n) {
    if (state.ui.chapter === n) return;
    state.ui.chapter = n;
    document.querySelectorAll('.rail-link').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-chapter') === String(n));
    });
    saveState();
  }

  function wireEvents() {
    document.getElementById('chapter-nav').addEventListener('click', function (e) {
      var btn = e.target.closest('.rail-link');
      if (btn) goToChapter(btn.getAttribute('data-chapter'));
    });

    document.getElementById('begin-btn').addEventListener('click', function () { goToChapter(2); });
    document.getElementById('replay-btn').addEventListener('click', function () { goToChapter(1); });

    document.getElementById('rain-toggle').addEventListener('click', function () {
      state.ui.rain = !state.ui.rain;
      renderAll().then(function () {
        announce(state.ui.rain ? 'Monsoon multiplier 1.35 active.' : 'Dry multiplier 1.00 active.');
      });
    });

    document.getElementById('hotspot-tbody').addEventListener('click', function (e) {
      var row = e.target.closest('tr[data-id]');
      if (!row) return;
      state.ui.selected = row.getAttribute('data-id');
      state.vision = null;
      state.lastVerdict = null;
      renderAll();
    });

    document.getElementById('mini-map').addEventListener('click', function (e) {
      var marker = e.target.closest('.marker');
      if (!marker) return;
      state.ui.selected = marker.getAttribute('data-id');
      state.vision = null;
      state.lastVerdict = null;
      renderAll();
    });

    document.getElementById('loop-strip').addEventListener('click', function (e) {
      var frame = e.target.closest('.loop-frame');
      if (!frame) return;
      document.querySelectorAll('.loop-frame').forEach(function (f) { f.classList.remove('is-current'); });
      frame.classList.add('is-current');
    });

    document.getElementById('preset-btn').addEventListener('click', function () {
      document.getElementById('lat-input').value = '28.5702';
      document.getElementById('lng-input').value = '77.2432';
      announce('Lajpat Nagar preset loaded.');
    });

    document.getElementById('submit-report').addEventListener('click', function () {
      var lat = Number(document.getElementById('lat-input').value);
      var lng = Number(document.getElementById('lng-input').value);
      var out = document.getElementById('cluster-output');

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        out.innerHTML = '<span class="warn">INVALID COORDINATES. Enter numeric latitude and longitude.</span>';
        return;
      }

      Promise.all([
        apiCluster({ lat: lat, lng: lng }, state.hotspots),
        apiVision()
      ]).then(function (results) {
        var cluster = results[0];
        var vision = results[1];
        state.vision = {
          distance: cluster.distanceMeters,
          matchedId: cluster.matchedId,
          action: cluster.action,
          source: vision.source,
          fractions: vision.fractions,
          massKg: vision.massKg,
          severity: vision.severity,
          dispatch: vision.dispatch
        };
        state.reports.push({ lat: lat, lng: lng, matchedId: cluster.matchedId, at: Date.now() });
        if (cluster.matchedId) {
          var h = state.hotspots.find(function (x) { return x.id === cluster.matchedId; });
          if (h) {
            h.reports30d += 1;
            h.factors.recurrence = Math.min(100, h.factors.recurrence + 1);
            state.ui.selected = h.id;
          }
        }
        return renderAll();
      }).then(function () {
        announce('Report merged. Simulated vision analysis complete.');
      });
    });

    document.getElementById('sim-recurrence').addEventListener('click', function () { runVerdict('recurrence'); });
    document.getElementById('sim-success').addEventListener('click', function () { runVerdict('success'); });

    document.getElementById('reset-btn').addEventListener('click', function () {
      try { window.localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      state = seedState();
      renderAll().then(function () {
        document.querySelectorAll('.loop-frame').forEach(function (f, i) {
          f.classList.toggle('is-current', i === 0);
        });
        announce('Local session reset to seed state.');
      });
    });

    window.addEventListener('scroll', function () {
      var max = document.body.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      document.getElementById('progress-bar').style.width = pct.toFixed(2) + '%';
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveChapter(Number(entry.target.id.replace('chapter-', '')));
          }
        });
      }, { threshold: 0.3 });
      document.querySelectorAll('.chapter').forEach(function (c) { observer.observe(c); });
    }
  }

  function runVerdict(mode) {
    var h = selectedHotspot();
    var buttons = [document.getElementById('sim-recurrence'), document.getElementById('sim-success')];
    buttons.forEach(function (b) { b.disabled = true; });
    apiVerdict(mode, h).then(function (v) {
      h.monitor.checkpoints = v.checkpoints;
      h.monitor.spillover = v.spillover;
      h.monitor.currentDay = mode === 'success' ? 14 : 5;
      h.status = v.status;
      h.contract.escrow = v.escrow;
      h.contract.heldAmount = v.heldAmount;
      state.lastVerdict = v;
      return renderAll();
    }).then(function () {
      buttons.forEach(function (b) { b.disabled = false; });
      announce(state.lastVerdict.message);
    });
  }

  setApiStatus(API_MODE ? 'ENGINE: API / VERCEL' : 'ENGINE: LOCAL / OFFLINE');
  wireEvents();
  renderAll();
}());

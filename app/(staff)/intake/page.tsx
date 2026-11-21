'use client';

import { useState, type FormEvent } from 'react';
import { Bar, Badge, Card, PageHeader } from '@/components/ui';
import { PRESET } from '@/lib/engine';
import { useStore } from '@/lib/store';

const WASTE_TYPES = [
  'Organic + Single-Use Plastic',
  'Construction & Demolition (C&D)',
  'Mixed Municipal & Dry Leaves',
  'Food Packaging & Cups',
  'Industrial Packaging & Silt'
];

const ROLES = ['Citizen', 'Field inspector'];

interface FormErrors {
  lat?: string;
  lng?: string;
  notes?: string;
  wasteType?: string;
}

export default function IntakePage() {
  const { state, dispatch } = useStore();
  const [role, setRole] = useState(ROLES[0]);
  const [wasteType, setWasteType] = useState(WASTE_TYPES[0]);
  const [lat, setLat] = useState(String(PRESET.lat));
  const [lng, setLng] = useState(String(PRESET.lng));
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const latValue = Number(lat);
    const lngValue = Number(lng);

    if (!Number.isFinite(latValue) || latValue < 28.4 || latValue > 28.85) {
      next.lat = 'Enter a latitude between 28.40 and 28.85.';
    }
    if (!Number.isFinite(lngValue) || lngValue < 76.9 || lngValue > 77.55) {
      next.lng = 'Enter a longitude between 76.90 and 77.55.';
    }
    if (!wasteType) next.wasteType = 'Select a waste stream.';
    if (notes.trim().length < 8) next.notes = 'Add at least 8 characters of field notes.';

    return next;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setSubmitted(false);
      return;
    }

    dispatch({
      type: 'report',
      lat: Number(lat),
      lng: Number(lng),
      wasteType,
      role,
      notes: notes.trim()
    });
    setSubmitted(true);
    setNotes('');
  };

  return (
    <>
      <PageHeader
        eyebrow="Field intake"
        title="Report and classify"
        description="Reports inside 30 m of an existing case merge into it; anything further opens a new case. Classification below is a rule-based demonstration, not a trained model."
      />

      <div className="split-even">
        <Card title="New report" subtitle="Coordinates must fall inside the Delhi NCR demo grid">
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="role">Reported by</label>
                <select id="role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="waste">Waste stream</label>
                <select
                  id="waste"
                  className={`input${errors.wasteType ? ' invalid' : ''}`}
                  value={wasteType}
                  onChange={(e) => setWasteType(e.target.value)}
                >
                  {WASTE_TYPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                {errors.wasteType ? <span className="error">{errors.wasteType}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="lat">Latitude</label>
                <input
                  id="lat"
                  className={`input${errors.lat ? ' invalid' : ''}`}
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  inputMode="decimal"
                />
                {errors.lat ? <span className="error">{errors.lat}</span> : null}
              </div>

              <div className="field">
                <label htmlFor="lng">Longitude</label>
                <input
                  id="lng"
                  className={`input${errors.lng ? ' invalid' : ''}`}
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  inputMode="decimal"
                />
                {errors.lng ? <span className="error">{errors.lng}</span> : null}
              </div>

              <div className="field full">
                <label htmlFor="notes">Field notes</label>
                <textarea
                  id="notes"
                  className={`input${errors.notes ? ' invalid' : ''}`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What is at the site, how long has it been there, and what is nearby?"
                />
                {errors.notes ? <span className="error">{errors.notes}</span> : null}
              </div>
            </div>

            <div className="form-actions mt-16">
              <button type="submit" className="btn btn-primary">
                Submit report
              </button>
              <span className="small muted">Saved to this browser only.</span>
            </div>
          </form>

          {submitted && state.cluster ? (
            <div className={`callout mt-16 ${state.cluster.action === 'MERGE' ? 'ok' : 'warn'}`}>
              {state.cluster.action === 'MERGE' ? (
                <>
                  <strong>Merged into {state.cluster.matchedId}.</strong> The report sits{' '}
                  {state.cluster.distanceMeters} m from the case centroid, inside the{' '}
                  {state.cluster.thresholdMeters} m cluster radius.
                </>
              ) : (
                <>
                  <strong>New case {state.selectedId} opened.</strong> The nearest existing case is{' '}
                  {state.cluster.distanceMeters} m away, beyond the {state.cluster.thresholdMeters} m
                  radius.
                </>
              )}
            </div>
          ) : null}
        </Card>

        <Card
          title="Waste classification"
          subtitle="Rule-based sample output"
          actions={
            <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'vision' })}>
              Run sample
            </button>
          }
        >
          {state.vision ? (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Badge tone="info">{state.vision.source}</Badge>
                <span className="small muted">
                  {state.vision.massKg} kg estimated · severity {state.vision.severity.toLowerCase()}
                </span>
              </div>

              <div className="mt-16">
                {state.vision.fractions.map((fraction) => (
                  <div className="meter" key={fraction.label}>
                    <div className="meter-head">
                      <span>{fraction.label}</span>
                      <b>{fraction.value}%</b>
                    </div>
                    <Bar value={fraction.value} />
                  </div>
                ))}
              </div>

              <div className="divider" />
              <div className="between small">
                <span className="muted">Suggested dispatch</span>
                <strong>{state.vision.dispatch}</strong>
              </div>
            </>
          ) : (
            <div className="callout">
              No classification yet. Run the sample to see how a field image would be broken down into
              waste fractions before dispatch.
            </div>
          )}

          <div className="callout mt-16">
            <strong>Demo only.</strong> This is a fixed rule-based output. A production build needs a
            trained classifier, confidence scores and human review before any dispatch decision.
          </div>
        </Card>
      </div>

      <Card title="Recent reports" subtitle="This session" flush className="mt-16">
        {state.reports.length === 0 ? (
          <div className="empty">
            <h3>No reports yet</h3>
            <p>Submit a report above to test the 30 m clustering rule.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Coordinates</th>
                <th>Matched case</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {state.reports.slice(0, 6).map((report) => (
                <tr key={`${report.at}-${report.lat}-${report.lng}`}>
                  <td className="small">{new Date(report.at).toLocaleTimeString('en-IN')}</td>
                  <td className="mono small">
                    {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                  </td>
                  <td className="mono small">{report.matchedId ?? '—'}</td>
                  <td>
                    <Badge tone={report.matchedId ? 'ok' : 'warn'}>
                      {report.matchedId ? 'Merged' : 'New case'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}

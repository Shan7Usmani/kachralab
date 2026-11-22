'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import LocationPicker from '@/components/LocationPicker';
import { Badge, Icon } from '@/components/ui';
import { CATEGORIES } from '@/lib/citizen';

interface SubmitResult {
  reference: string;
  caseId: string;
  action: 'MERGED' | 'NEW';
  status: string;
  trackUrl: string;
}

export default function ReportPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('28.5703');
  const [lng, setLng] = useState('77.2432');
  const [website, setWebsite] = useState('');
  const [locMsg, setLocMsg] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    document.title = 'Report waste | NagarSeva';
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocMsg('This browser does not support location sharing.');
      return;
    }

    setLocMsg('Locating…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(5));
        setLng(position.coords.longitude.toFixed(5));
        setLocMsg(`Location captured, accurate to about ${Math.round(position.coords.accuracy)} m.`);
      },
      () => {
        setLocMsg('Location permission denied. Pick the spot on the map or enter coordinates.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const latValue = Number(lat);
    const lngValue = Number(lng);
    const next: Record<string, string> = {};

    if (!Number.isFinite(latValue) || latValue < 28.4 || latValue > 28.85) {
      next.lat = 'Pick a location inside the Delhi NCR demo grid.';
    }
    if (!Number.isFinite(lngValue) || lngValue < 76.9 || lngValue > 77.55) {
      next.lng = 'Pick a location inside the Delhi NCR demo grid.';
    }
    if (description.trim().length < 10) {
      next.description = 'Add at least 10 characters so the field team knows what to expect.';
    }
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone.trim())) {
      next.phone = 'Enter a valid phone number or leave it blank.';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: latValue,
          lng: lngValue,
          category,
          description: description.trim(),
          reporterName: name.trim() || undefined,
          reporterPhone: phone.trim() || undefined,
          website
        })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.errors) setErrors(data.errors);
        setFormError(data?.message || 'The report could not be submitted. Please try again.');
        return;
      }

      setResult(data as SubmitResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setFormError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setDescription('');
    setCategory(CATEGORIES[0]);
    setErrors({});
    setFormError('');
  };

  if (result) {
    return (
      <div className="card success-panel">
        <Badge tone="ok">Report received</Badge>
        <h1>Your reference number</h1>
        <div className="ref-code">{result.reference}</div>
        <p className="small muted">
          Case {result.caseId} ·{' '}
          {result.action === 'MERGED'
            ? 'merged with an existing hotspot within 30 m'
            : 'opened as a new case'}
        </p>

        <div className="row" style={{ justifyContent: 'center', marginTop: 18 }}>
          <Link className="btn btn-primary" href={result.trackUrl}>
            Track this report
          </Link>
          <button type="button" className="btn" onClick={reset}>
            Report another
          </button>
        </div>

        <div className="callout mt-24" style={{ textAlign: 'left' }}>
          <strong>What happens next.</strong> The report appears in the municipal inbox immediately.
          Staff check for duplicates, assign a field team, clear the site, and then verify it stays clean
          for 14 days. Keep the reference number to check progress.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="public-hero">
        <div className="eyebrow">Citizen reporting</div>
        <h1>Report a waste problem</h1>
        <p>
          Tell us where the problem is and what it looks like. No account is needed. You will get a
          reference number to track the complaint.
        </p>
      </div>

      <form className="card" onSubmit={submit} noValidate>
        <div className="card-body stack">
          <div>
            <div className="between" style={{ marginBottom: 8 }}>
              <label className="field-label" htmlFor="map">
                Where is it?
              </label>
              <button type="button" className="btn btn-sm" onClick={locate}>
                <Icon name="pin" />
                Use my location
              </button>
            </div>

            <LocationPicker
              lat={Number(lat) || 28.5703}
              lng={Number(lng) || 77.2432}
              onPick={(nextLat, nextLng) => {
                setLat(String(nextLat));
                setLng(String(nextLng));
                setLocMsg('Location set on the map.');
              }}
            />
            <p className="small muted" style={{ marginTop: 6 }}>
              Tap the map to place the pin. {locMsg}
            </p>

            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field">
                <label htmlFor="lat">Latitude</label>
                <input
                  id="lat"
                  className={`input${errors.lat ? ' invalid' : ''}`}
                  value={lat}
                  onChange={(event) => setLat(event.target.value)}
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
                  onChange={(event) => setLng(event.target.value)}
                  inputMode="decimal"
                />
                {errors.lng ? <span className="error">{errors.lng}</span> : null}
              </div>
            </div>
          </div>

          <div className="field">
            <label>What is the problem?</label>
            <div className="choice-grid">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`choice${category === item ? ' active' : ''}`}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className={`input${errors.description ? ' invalid' : ''}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is at the site? How long has it been there? Any landmark nearby?"
              maxLength={800}
            />
            <div className="between">
              {errors.description ? <span className="error">{errors.description}</span> : <span />}
              <span className="hint">{description.length}/800</span>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Your name (optional)</label>
              <input
                id="name"
                className={`input${errors.reporterName ? ' invalid' : ''}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
              {errors.reporterName ? <span className="error">{errors.reporterName}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone (optional)</label>
              <input
                id="phone"
                className={`input${errors.phone || errors.reporterPhone ? ' invalid' : ''}`}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="For follow-up only"
              />
              {errors.phone || errors.reporterPhone ? (
                <span className="error">{errors.phone || errors.reporterPhone}</span>
              ) : null}
            </div>
          </div>

          <div className="honeypot" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>
          </div>

          {formError ? <div className="callout danger">{formError}</div> : null}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
            <span className="small muted">Your phone number is never shown publicly.</span>
          </div>
        </div>
      </form>
    </>
  );
}

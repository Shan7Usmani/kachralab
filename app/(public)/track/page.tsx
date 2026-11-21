'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui';

export default function TrackSearchPage() {
  const router = useRouter();
  const [reference, setReference] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = reference.trim().toUpperCase();
    if (value) router.push(`/track/${encodeURIComponent(value)}`);
  };

  return (
    <>
      <div className="public-hero">
        <div className="eyebrow">Complaint tracking</div>
        <h1>Track a report</h1>
        <p>Enter the reference number you received when the complaint was submitted.</p>
      </div>

      <form className="card" onSubmit={submit}>
        <div className="card-body">
          <div className="field">
            <label htmlFor="reference">Reference number</label>
            <input
              id="reference"
              className="input"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="KL-2026-AB12CD"
              autoComplete="off"
            />
            <span className="hint">It starts with KL and appears on the confirmation screen.</span>
          </div>

          <button type="submit" className="btn btn-primary mt-16" disabled={!reference.trim()}>
            <Icon name="arrow" />
            Track report
          </button>
        </div>
      </form>
    </>
  );
}

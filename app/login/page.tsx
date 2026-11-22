'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge, Card } from '@/components/ui';

const STAFF_PASSWORD = 'nagarseva2026';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/inbox';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (response.ok) {
      router.push(redirect);
      router.refresh();
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  return (
    <div className="public-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Card className="auth-card">
          <div className="text-center mb-24">
            <div className="mb-12"><Badge tone="info">Staff Access</Badge></div>
            <h1>Sign in to NagarSeva</h1>
            <p className="small muted mt-8">Enter the staff password to access the municipal dashboard.</p>
          </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="password">Staff Password</label>
            <input
              id="password"
              type="password"
              className={`input${error ? ' invalid' : ''}`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter staff password"
              disabled={submitting}
            />
            {error && <span className="error">{error}</span>}
          </div>

          <div className="form-actions mt-24">
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="callout mt-16" style={{ fontSize: 13 }}>
          <strong>Demo password:</strong> <code>nagarseva2026</code>
        </div>
      </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="public-hero" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
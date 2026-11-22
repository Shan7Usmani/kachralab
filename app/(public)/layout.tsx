import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NagarSeva | Report a waste problem',
  description: 'Report a municipal waste problem in Delhi NCR and track what happens next.'
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link href="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">KL</span>
          <span>
            <span className="brand-name">NagarSeva</span>
            <span className="brand-sub">Municipal waste reporting</span>
          </span>
        </Link>
        <nav className="public-nav" aria-label="Public">
          <Link href="/report">Report waste</Link>
          <Link href="/track">Track a report</Link>
          <Link href="/" className="btn btn-sm">
            Staff console
          </Link>
        </nav>
      </header>

      <main className="public-main">{children}</main>

      <footer className="public-foot">
        Illustrative demonstration for CodeSprint 2026. Reports are stored for this demo only and are
        visible to the municipal demo console.
      </footer>
    </div>
  );
}

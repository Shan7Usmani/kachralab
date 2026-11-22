'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { Icon } from '@/components/ui';

const NAV = [
  {
    group: 'Workspace',
    items: [
      { href: '/', label: 'Overview', icon: 'grid' },
      { href: '/hotspots', label: 'Hotspots', icon: 'pin' },
      { href: '/map', label: 'Map', icon: 'map' }
    ]
  },
  {
    group: 'Operations',
    items: [
      { href: '/intake', label: 'Intake', icon: 'camera' },
      { href: '/inbox', label: 'Citizen inbox', icon: 'inbox' },
      { href: '/verify', label: 'Verification', icon: 'check' }
    ]
  },
  {
    group: 'Programme',
    items: [
      { href: '/impact', label: 'Impact', icon: 'chart' },
      { href: '/method', label: 'Method', icon: 'book' }
    ]
  }
];

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/hotspots': 'Hotspots',
  '/map': 'Map',
  '/intake': 'Intake',
  '/inbox': 'Citizen inbox',
  '/verify': 'Verification',
  '/impact': 'Impact',
  '/method': 'Method'
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, dispatch } = useStore();

  useEffect(() => {
    const title = TITLES[pathname] ?? 'Overview';
    document.title = `${title} | NagarSeva`;
  }, [pathname]);

  const reset = () => {
    if (window.confirm('Reset all demo data to the seed dataset? This clears local reports and verdicts.')) {
      dispatch({ type: 'reset' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">KL</span>
          <span>
            <span className="brand-name">NagarSeva</span>
            <span className="brand-sub">Waste intervention intelligence</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Primary">
          {NAV.map((group) => (
            <div className="nav-group" key={group.group}>
              <div className="nav-label">{group.group}</div>
              {group.items.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          Shared case register · Postgres or local file storage
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumb">
            <strong>Municipal operations</strong>
            <span>/</span>
            <span>Delhi NCR demo grid</span>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="switch"
              aria-pressed={state.rain}
              onClick={() => dispatch({ type: 'rain', value: !state.rain })}
              title="Apply the monsoon risk multiplier"
            >
              <span className="switch-track" aria-hidden="true" />
              Monsoon multiplier
            </button>
            <button type="button" className="btn btn-sm" onClick={reset}>
              <Icon name="reset" />
              Reset
            </button>
            <button type="button" className="btn btn-sm" onClick={handleLogout}>
              <Icon name="log-out" />
              Sign out
            </button>
            <Link className="btn btn-primary btn-sm" href="/intake">
              <Icon name="plus" />
              New report
            </Link>
          </div>
        </header>

        <main className="content">{children}</main>

        <footer className="foot">
          Illustrative demonstration data. Rule-based classification, simulated escrow and browser-local
          state. Production gaps are listed on the Method page.
        </footer>
      </div>
    </div>
  );
}

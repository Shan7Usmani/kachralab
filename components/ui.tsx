import type { ReactNode } from 'react';
import { statusLabel, statusTone, type HotspotStatus } from '@/lib/engine';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  flush = false,
  className = ''
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title || actions ? (
        <div className="card-head">
          <div>
            {title ? <h2 className="card-title">{title}</h2> : null}
            {subtitle ? <p className="card-sub">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={flush ? 'card-body flush' : 'card-body'}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'danger' | 'warn' | 'ok' | 'info';
}) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value${tone ? ` t-${tone}` : ''}`}>{value}</span>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  children
}: {
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'info';
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: HotspotStatus }) {
  return <Badge tone={statusTone(status) as 'ok' | 'warn' | 'danger' | 'info'}>{statusLabel(status)}</Badge>;
}

export function Bar({ value, tone = '' }: { value: number; tone?: '' | 'ok' | 'warn' | 'danger' | 'info' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`bar ${tone}`} role="presentation">
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

const ICONS: Record<string, string> = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  pin: 'M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  check: 'M4 12l5 5L20 6',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  book: 'M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2z M8 7h8M8 11h8',
  layers: 'M12 3 3 8l9 5 9-5-9-5zM3 13l9 5 9-5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  reset: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5'
};

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS | string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name] ?? ICONS.grid} />
    </svg>
  );
}

export const inr = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

export const timeLabel = (at: number): string =>
  at
    ? new Date(at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : 'Seed';

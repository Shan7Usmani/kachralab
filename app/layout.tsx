import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KachraLab | Live Intervention Console',
  description:
    'Outcome-linked municipal waste intervention intelligence. Hotspot memory, explainable risk, 14-day verification and split escrow.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

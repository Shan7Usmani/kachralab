import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'KachraLab | Municipal waste operations',
  description:
    'Demonstration console for municipal waste hotspot intelligence: 30 m report clustering, weighted risk, a 14-day verification window and outcome-linked escrow.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}

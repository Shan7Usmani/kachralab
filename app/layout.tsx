import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'KachraLab | Live Intervention Console',
  description:
    'Outcome-linked municipal waste intervention intelligence. Hotspot memory, explainable risk, 14-day verification and split escrow.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="global-footnote">
          Illustrative data · rule-based vision · simulated escrow · production stack on roadmap
        </div>
      </body>
    </html>
  );
}

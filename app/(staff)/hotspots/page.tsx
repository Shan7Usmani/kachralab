import { Suspense } from 'react';
import { HotspotsClient } from './HotspotsClient';
import { listCases } from '@/lib/server/cases';

export const dynamic = 'force-dynamic';

async function getHotspotsData() {
  const cases = await listCases();
  return { cases };
}

export default async function HotspotsPage() {
  const { cases } = await getHotspotsData();

  return (
    <Suspense fallback={<div className="empty"><h3>Loading hotspots</h3><p>Reading the shared case register.</p></div>}>
      <HotspotsClient initialCases={cases} />
    </Suspense>
  );
}
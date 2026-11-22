import { Suspense } from 'react';
import { NGOClient } from './NGOClient';
import { listCases } from '@/lib/server/cases';

export const dynamic = 'force-dynamic';

async function getNGOData() {
  const cases = await listCases();
  const orgCases = cases.filter((c) => c.assignedTo === 'Safai Saathi Foundation');
  return { cases: orgCases };
}

export default async function NGOPage() {
  const { cases } = await getNGOData();

  return (
    <Suspense fallback={<div className="empty"><h3>Loading NGO dashboard</h3><p>Reading assigned cases.</p></div>}>
      <NGOClient initialCases={cases} />
    </Suspense>
  );
}
import { Suspense } from 'react';
import { VerifyClient } from './VerifyClient';
import { listCases, getCase, listCaseEvents } from '@/lib/server/cases';

export const dynamic = 'force-dynamic';

async function getVerifyData(id?: string) {
  const cases = await listCases();
  let caseData = cases[0];
  let events: Awaited<ReturnType<typeof listCaseEvents>> = [];

  if (id) {
    const found = await getCase(id);
    if (found) {
      caseData = found;
      events = await listCaseEvents(id);
    }
  } else if (cases.length > 0) {
    caseData = cases[0];
    events = await listCaseEvents(cases[0].id);
  }

  return { cases, case: caseData, events };
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const { cases, case: caseData, events } = await getVerifyData(params.id);

  return (
    <Suspense fallback={<div className="empty"><h3>Loading verification</h3><p>Reading the case details.</p></div>}>
      <VerifyClient initialCases={cases} initialCase={caseData} initialEvents={events} />
    </Suspense>
  );
}
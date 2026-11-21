import { NextResponse } from 'next/server';
import {
  CaseActionError,
  applyCaseAction,
  getCase,
  listCaseEvents,
  listCases
} from '@/lib/server/cases';
import { storageMode } from '@/lib/server/db';
import { TEAMS, isCasePriority, type CaseAction } from '@/lib/case';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS: CaseAction[] = [
  'triage',
  'assign',
  'start',
  'clear',
  'verify_day',
  'recurrence',
  'release',
  'escalate',
  'note',
  'close',
  'clear_flags'
];

function isAction(value: unknown): value is CaseAction {
  return typeof value === 'string' && (ACTIONS as string[]).includes(value);
}

export async function GET(request: Request) {
  if (storageMode === 'unavailable') {
    return NextResponse.json({
      configured: false,
      mode: storageMode,
      cases: [],
      teams: TEAMS
    });
  }

  const id = new URL(request.url).searchParams.get('id');

  try {
    if (id) {
      const item = await getCase(id);
      if (!item) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
      }
      const events = await listCaseEvents(id);
      return NextResponse.json({
        configured: true,
        mode: storageMode,
        case: item,
        events,
        teams: TEAMS
      });
    }

    const cases = await listCases();
    return NextResponse.json({ configured: true, mode: storageMode, cases, teams: TEAMS });
  } catch (error) {
    console.error('case register failed', error);
    return NextResponse.json(
      { configured: false, mode: storageMode, cases: [], teams: TEAMS, error: 'load_failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (storageMode === 'unavailable') {
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const caseId = typeof body?.caseId === 'string' ? body.caseId.trim() : '';
  const action = body?.action;

  if (!caseId || !isAction(action)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    const updated = await applyCaseAction(caseId, {
      action,
      team: typeof body?.team === 'string' ? body.team : undefined,
      note: typeof body?.note === 'string' ? body.note.slice(0, 500) : undefined,
      priority: isCasePriority(body?.priority) ? body.priority : undefined
    });
    const events = await listCaseEvents(caseId);
    return NextResponse.json({ ok: true, case: updated, events });
  } catch (error) {
    if (error instanceof CaseActionError) {
      return NextResponse.json(
        { error: 'invalid_transition', message: error.message },
        { status: 409 }
      );
    }
    console.error('case action failed', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

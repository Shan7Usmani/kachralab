import { NextResponse } from 'next/server';
import { isCategory, isCitizenStatus } from '@/lib/citizen';
import { storageMode } from '@/lib/server/db';
import { createReport, listCitizenCases, setCaseStatus } from '@/lib/server/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 6;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

function validPhone(value: string): boolean {
  return /^[0-9+\-\s]{7,15}$/.test(value);
}

export async function GET() {
  if (storageMode === 'unavailable') {
    return NextResponse.json({ configured: false, mode: storageMode, cases: [] });
  }

  try {
    const cases = await listCitizenCases();
    return NextResponse.json({ configured: true, mode: storageMode, cases });
  } catch (error) {
    console.error('citizen inbox failed', error);
    return NextResponse.json(
      { configured: false, mode: storageMode, cases: [], error: 'load_failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (storageMode === 'unavailable') {
    return NextResponse.json(
      {
        error: 'storage_unavailable',
        message: 'Complaint storage is not configured on this deployment yet.'
      },
      { status: 503 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'rate_limited', message: 'Too many submissions from this connection. Try again later.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields, humans do not.
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const reporterName = typeof body.reporterName === 'string' ? body.reporterName.trim() : '';
  const reporterPhone = typeof body.reporterPhone === 'string' ? body.reporterPhone.trim() : '';
  const errors: Record<string, string> = {};

  if (!Number.isFinite(lat) || lat < 28.4 || lat > 28.85) {
    errors.lat = 'Pick a location inside the Delhi NCR demo grid.';
  }
  if (!Number.isFinite(lng) || lng < 76.9 || lng > 77.55) {
    errors.lng = 'Pick a location inside the Delhi NCR demo grid.';
  }
  if (!isCategory(body.category)) {
    errors.category = 'Choose the type of problem.';
  }
  if (description.length < 10 || description.length > 800) {
    errors.description = 'Add between 10 and 800 characters.';
  }
  if (reporterName.length > 80) {
    errors.reporterName = 'Keep the name under 80 characters.';
  }
  if (reporterPhone && !validPhone(reporterPhone)) {
    errors.reporterPhone = 'Enter a valid phone number or leave it blank.';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'validation', errors }, { status: 400 });
  }

  try {
    const report = await createReport({
      lat,
      lng,
      category: body.category as string,
      description,
      reporterName: reporterName || null,
      reporterPhone: reporterPhone || null
    });

    return NextResponse.json(
      {
        ok: true,
        reference: report.reference,
        caseId: report.caseId,
        action: report.action,
        status: report.status,
        trackUrl: `/track/${report.reference}`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('citizen report failed', error);
    return NextResponse.json(
      { error: 'server_error', message: 'The report could not be saved. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (storageMode === 'unavailable') {
    return NextResponse.json({ error: 'storage_unavailable' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as
    | { caseId?: unknown; status?: unknown }
    | null;
  const caseId = typeof body?.caseId === 'string' ? body.caseId : '';

  if (!caseId || !isCitizenStatus(body?.status)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  try {
    await setCaseStatus(caseId, body.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('citizen status update failed', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

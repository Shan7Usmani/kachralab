import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || (!isProduction ? 'nagarseva2026' : '');
const COOKIE_NAME = 'nagarseva_staff_auth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password;

  // In development without a configured password, accept the default password
  if (!process.env.STAFF_PASSWORD && !isProduction) {
    if (password !== 'nagarseva2026') {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, 'nagarseva2026', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    });
    return response;
  }

  if (!password || password !== STAFF_PASSWORD) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, STAFF_PASSWORD, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
  });

  return response;
}
import { NextResponse } from 'next/server';

const STAFF_PASSWORD = process.env.STAFF_PASSWORD;
const COOKIE_NAME = 'kachralab_staff_auth';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password;

  // In development without a configured password, accept any password
  if (!STAFF_PASSWORD && process.env.NODE_ENV === 'development') {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, 'dev', {
      httpOnly: true,
secure: String(process.env.NODE_ENV) === 'production',
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
    secure: String(process.env.NODE_ENV) === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
  });

  return response;
}
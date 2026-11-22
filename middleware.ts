import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'nagarseva2026';
const COOKIE_NAME = 'nagarseva_staff_auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaffRoute = pathname.startsWith('/inbox') ||
                       pathname.startsWith('/hotspots') ||
                       pathname.startsWith('/verify') ||
                       pathname.startsWith('/map') ||
                       pathname.startsWith('/impact') ||
                       pathname.startsWith('/intake') ||
                       pathname.startsWith('/method');

  if (!isStaffRoute) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(COOKIE_NAME);
  const isAuthenticated = authCookie?.value === STAFF_PASSWORD;

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/inbox/:path*',
    '/hotspots/:path*',
    '/verify/:path*',
    '/map/:path*',
    '/impact/:path*',
    '/intake/:path*',
    '/method/:path*'
  ]
};
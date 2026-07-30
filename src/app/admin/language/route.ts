import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_LOCALE_COOKIE, toAdminLocale } from '@/app/admin/i18n';

export const dynamic = 'force-dynamic';

function safeRedirectTarget(request: NextRequest): URL {
  const next = request.nextUrl.searchParams.get('next');
  if (next?.startsWith('/admin')) return new URL(next, request.url);

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === request.nextUrl.origin && url.pathname.startsWith('/admin')) return url;
    } catch {
      // Fall through to the admin dashboard.
    }
  }

  return new URL('/admin', request.url);
}

export async function GET(request: NextRequest) {
  const locale = toAdminLocale(request.nextUrl.searchParams.get('lang'));
  const response = NextResponse.redirect(safeRedirectTarget(request));
  response.cookies.set(ADMIN_LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

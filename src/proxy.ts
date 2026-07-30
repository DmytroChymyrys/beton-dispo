import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';
import { siteConfig } from '@/lib/site';

/** Paths that must never be locale-prefixed or host-rewritten by locale logic. */
const NON_LOCALIZED_PREFIXES = ['/api', '/admin', '/_next', '/_vercel'];

/**
 * Anything whose last segment has a file extension is an asset, not a page:
 * `/images/betondispo/photo.webp`, `/icon.svg`, `/apple-icon.png`,
 * `/favicon.ico`, `/robots.txt`, `/sitemap.xml`. Locale-prefixing those would
 * 404 every static file on the site. No page slug contains a dot, so this is
 * safe as a rule rather than a list that has to be kept in sync with `public/`.
 */
function isAssetPath(pathname: string): boolean {
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  return lastSegment.includes('.');
}

/**
 * betondispo.com (and any other alias) → the canonical host, preserving path
 * and query so `betondispo.com/fr/soumission` lands on
 * `betondispo.ca/fr/soumission`.
 * Skipped on localhost and on *.vercel.app preview deployments.
 */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  let canonical: URL;
  try {
    canonical = new URL(siteConfig.url);
  } catch {
    return null;
  }
  if (canonical.protocol !== 'https:') return null;

  const host = request.headers.get('host');
  if (!host) return null;
  if (host === canonical.host) return null;
  if (host.endsWith('.vercel.app') || host.startsWith('localhost')) return null;

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical.origin);
  return NextResponse.redirect(target, 308);
}

export default function proxy(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;

  if (
    NON_LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    isAssetPath(pathname) ||
    // Metadata routes Next serves without an extension.
    pathname.endsWith('/opengraph-image')
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split('/')[1] ?? '';
  if ((locales as readonly string[]).includes(firstSegment)) {
    return NextResponse.next();
  }

  // `/` and any unprefixed path default to French. English remains available
  // through explicit `/en/...` URLs and the language switcher.
  const locale = defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

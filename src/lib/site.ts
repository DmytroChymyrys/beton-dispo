const DEFAULT_SITE_URL = 'https://betondispo.ca';

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configured) return DEFAULT_SITE_URL;

  try {
    const url = new URL(configured);
    if (process.env.VERCEL_ENV === 'production' && url.hostname === 'localhost') {
      return DEFAULT_SITE_URL;
    }
  } catch {
    return DEFAULT_SITE_URL;
  }

  return configured;
}

/**
 * Static, non-secret facts about the site. Safe to import from client
 * components — nothing here may ever hold a credential.
 */
export const siteConfig = {
  name: 'BétonDispo',
  /** Canonical origin, no trailing slash. */
  url: resolveSiteUrl().replace(/\/$/, ''),
  hasExplicitSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  contactEmail: 'info@betondispo.com',
  privacyEmail: 'privacy@betondispo.com',
  /**
   * Areas we currently accept requests for. Deliberately broad regions rather
   * than a precise coverage promise.
   */
  areasServed: ['Rive-Sud', 'Montréal', 'Grand Montréal', 'Québec'],
} as const;

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}

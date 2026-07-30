/**
 * Static, non-secret facts about the site. Safe to import from client
 * components — nothing here may ever hold a credential.
 */
export const siteConfig = {
  name: 'BétonDispo',
  /** Canonical origin, no trailing slash. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3987').replace(/\/$/, ''),
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

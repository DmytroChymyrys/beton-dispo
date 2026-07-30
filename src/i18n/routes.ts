import { locales, type Locale } from './config';

/**
 * Single source of truth for localized URL slugs.
 *
 * Each route has one stable *key* (used in code) and one slug per locale (used
 * in the URL). The language switcher maps a path in one locale to the matching
 * path in the other by looking the slug up here, which is why every public page
 * must be registered.
 *
 * To add a page: add an entry here, then create
 * `src/app/[locale]/<fr-slug>/page.tsx` and `src/app/[locale]/<en-slug>/page.tsx`
 * that both guard on the locale and render the shared page component.
 */
export const routes = {
  home: { fr: '', en: '' },
  quote: { fr: 'soumission', en: 'quote' },
  calculator: { fr: 'calculateur-beton', en: 'concrete-calculator' },
  concreteSlab: { fr: 'dalle-beton', en: 'concrete-slab' },
  concreteDelivery: { fr: 'livraison-beton', en: 'concrete-delivery' },
  howItWorks: { fr: 'comment-ca-marche', en: 'how-it-works' },
  services: { fr: 'services', en: 'services' },
  faq: { fr: 'faq', en: 'faq' },
  privacy: { fr: 'politique-confidentialite', en: 'privacy' },
  terms: { fr: 'conditions', en: 'terms' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

/**
 * Prefix for city landing pages
 * (`/fr/beton/brossard`, `/en/concrete/brossard`).
 */
export const locationSegment = {
  fr: 'beton',
  en: 'concrete',
} as const satisfies Record<Locale, string>;

/** Absolute, locale-prefixed path for a route key. Always starts with `/`. */
export function pathFor(key: RouteKey, locale: Locale): string {
  const slug = routes[key][locale];
  return slug ? `/${locale}/${slug}` : `/${locale}`;
}

/** Reverse lookup: which route key does this first path segment belong to? */
export function routeKeyForSlug(slug: string, locale: Locale): RouteKey | null {
  const entries = Object.entries(routes) as [RouteKey, Record<Locale, string>][];
  const match = entries.find(([, slugs]) => slugs[locale] === slug);
  return match ? match[0] : null;
}

/**
 * Map the current pathname to its equivalent in `target`, preserving the page
 * whenever a translation exists. Falls back to the target locale's home page
 * for anything unrecognised (e.g. a 404 URL) rather than producing a broken
 * link.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  const [current, ...rest] = segments;

  if (!current || !(locales as readonly string[]).includes(current)) {
    return `/${target}`;
  }
  const from = current as Locale;
  if (rest.length === 0) return `/${target}`;

  const [first, ...tail] = rest;
  if (!first) return `/${target}`;

  // City pages: /fr/beton/brossard -> /en/concrete/brossard
  if (first === locationSegment[from]) {
    return [`/${target}`, locationSegment[target], ...tail].join('/');
  }

  const key = routeKeyForSlug(first, from);
  if (!key) return `/${target}`;

  const translated = pathFor(key, target);
  return tail.length ? [translated, ...tail].join('/') : translated;
}

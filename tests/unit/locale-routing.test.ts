import { describe, expect, it } from 'vitest';
import { defaultLocale, isLocale, locales, otherLocale } from '@/i18n/config';
import { pathFor, routeKeyForSlug, routes, switchLocalePath } from '@/i18n/routes';
import { pickLocale } from '@/i18n/detect';

describe('pickLocale', () => {
  it('falls back to French when no header is sent', () => {
    expect(pickLocale(null)).toBe('fr');
  });

  it.each([
    ['fr-CA,fr;q=0.9,en;q=0.8', 'fr'],
    ['fr', 'fr'],
    ['en-US,en;q=0.9', 'en'],
    ['en-CA', 'en'],
  ])('maps %s to %s', (header, expected) => {
    expect(pickLocale(header)).toBe(expected);
  });

  it('honours quality values rather than header order', () => {
    expect(pickLocale('en;q=0.4,fr;q=0.9')).toBe('fr');
    expect(pickLocale('fr;q=0.3,en;q=0.8')).toBe('en');
  });

  it('falls back to French for an unsupported language — Québec is the primary market', () => {
    expect(pickLocale('de-DE,de;q=0.9')).toBe('fr');
    expect(pickLocale('es,it;q=0.8')).toBe('fr');
    expect(pickLocale('')).toBe('fr');
  });

  it('ignores a malformed quality value instead of throwing', () => {
    expect(pickLocale('en;q=abc,fr')).toBe('fr');
  });
});

describe('route registry', () => {
  it('defines every route in every locale', () => {
    for (const [key, slugs] of Object.entries(routes)) {
      for (const locale of locales) {
        expect(slugs[locale], `${key}.${locale}`).toBeDefined();
      }
    }
  });

  it('has no duplicate slugs within a locale', () => {
    for (const locale of locales) {
      const slugs = Object.values(routes).map((entry) => entry[locale]);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it.each([
    ['home', 'fr', '/fr'],
    ['home', 'en', '/en'],
    ['quote', 'fr', '/fr/soumission'],
    ['quote', 'en', '/en/quote'],
    ['howItWorks', 'fr', '/fr/comment-ca-marche'],
    ['howItWorks', 'en', '/en/how-it-works'],
    ['privacy', 'fr', '/fr/politique-confidentialite'],
    ['terms', 'en', '/en/terms'],
  ] as const)('builds %s/%s as %s', (key, locale, expected) => {
    expect(pathFor(key, locale)).toBe(expected);
  });

  it('resolves a slug back to its route key', () => {
    expect(routeKeyForSlug('soumission', 'fr')).toBe('quote');
    expect(routeKeyForSlug('quote', 'en')).toBe('quote');
    // A slug from the other locale must not resolve.
    expect(routeKeyForSlug('quote', 'fr')).toBeNull();
    expect(routeKeyForSlug('nope', 'fr')).toBeNull();
  });
});

describe('switchLocalePath', () => {
  it.each([
    ['/fr', 'en', '/en'],
    ['/en', 'fr', '/fr'],
    ['/fr/soumission', 'en', '/en/quote'],
    ['/en/quote', 'fr', '/fr/soumission'],
    ['/fr/comment-ca-marche', 'en', '/en/how-it-works'],
    ['/en/how-it-works', 'fr', '/fr/comment-ca-marche'],
    ['/fr/politique-confidentialite', 'en', '/en/privacy'],
    ['/fr/services', 'en', '/en/services'],
    ['/fr/faq', 'en', '/en/faq'],
  ] as const)('maps %s to %s -> %s', (pathname, target, expected) => {
    expect(switchLocalePath(pathname, target)).toBe(expected);
  });

  it('preserves the page for future per-city landing pages', () => {
    expect(switchLocalePath('/fr/livraison-beton/brossard', 'en')).toBe(
      '/en/concrete-delivery/brossard',
    );
    expect(switchLocalePath('/en/concrete-delivery/laval', 'fr')).toBe('/fr/livraison-beton/laval');
  });

  it('falls back to the target home page for an unknown path', () => {
    expect(switchLocalePath('/fr/does-not-exist', 'en')).toBe('/en');
    expect(switchLocalePath('/', 'en')).toBe('/en');
    expect(switchLocalePath('', 'fr')).toBe('/fr');
  });

  it('round-trips back to the original path', () => {
    for (const key of Object.keys(routes) as (keyof typeof routes)[]) {
      for (const locale of locales) {
        const original = pathFor(key, locale);
        const other = switchLocalePath(original, otherLocale(locale));
        expect(switchLocalePath(other, locale)).toBe(original);
      }
    }
  });
});

describe('locale config', () => {
  it('defaults to French', () => {
    expect(defaultLocale).toBe('fr');
  });

  it('recognises only the configured locales', () => {
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

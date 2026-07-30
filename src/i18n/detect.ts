import { defaultLocale, locales, type Locale } from './config';

/**
 * Picks a locale from an `Accept-Language` header.
 *
 * French is the fallback, not English: Québec is the primary market, so
 * anything that isn't explicitly a better match for English lands on /fr.
 *
 * Kept out of `proxy.ts` so it can be unit-tested without pulling in the
 * Next.js request runtime.
 */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        base: (tag.trim().toLowerCase().split('-')[0] ?? '') as string,
        q: Number.isNaN(q) ? 0 : q,
      };
    })
    .filter((entry) => entry.base.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const entry of ranked) {
    if ((locales as readonly string[]).includes(entry.base)) return entry.base as Locale;
  }
  return defaultLocale;
}

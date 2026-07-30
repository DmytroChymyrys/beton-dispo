import type { MetadataRoute } from 'next';
import { defaultLocale, localeTags, locales } from '@/i18n/config';
import { pathFor, routes, type RouteKey } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';
import { cityAlternates, cityPath, citySlugs } from '@/lib/city-pages';

/** Relative crawl priority. The home page and the quote form are the goal. */
const priorities: Record<RouteKey, number> = {
  home: 1,
  quote: 0.9,
  calculator: 0.95,
  concreteSlab: 0.86,
  concreteDelivery: 0.86,
  services: 0.8,
  howItWorks: 0.7,
  faq: 0.6,
  privacy: 0.2,
  terms: 0.2,
};

/**
 * One entry per locale per page, each carrying the full set of language
 * alternates so Google sees the FR/EN pair as one document.
 *
 * When per-city landing pages arrive, map them here the same way using
 * `locationSegment`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const keys = Object.keys(routes) as RouteKey[];
  const lastModified = new Date();

  const staticPages = keys.flatMap((key) =>
    locales.map((locale) => {
      const languages: Record<string, string> = {};
      for (const l of locales) {
        languages[localeTags[l]] = absoluteUrl(pathFor(key, l));
      }
      languages['x-default'] = absoluteUrl(pathFor(key, defaultLocale));

      return {
        url: absoluteUrl(pathFor(key, locale)),
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: priorities[key],
        alternates: { languages },
      };
    }),
  );

  const cityPages = citySlugs.flatMap((city) =>
    locales.map((locale) => ({
      url: absoluteUrl(cityPath(city, locale)),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      alternates: { languages: cityAlternates(city) },
    })),
  );

  return [...staticPages, ...cityPages];
}

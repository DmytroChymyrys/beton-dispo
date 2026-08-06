import type { MetadataRoute } from 'next';
import { defaultLocale, localeTags, locales } from '@/i18n/config';
import { pathFor, routes, type RouteKey } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';
import { cityAlternates, cityPath, citySlugs } from '@/lib/city-pages';
import {
  LOCAL_CALCULATOR_LAST_MODIFIED,
  localCalculatorAlternates,
  localCalculatorPath,
  localCalculatorSlugs,
} from '@/lib/local-calculator-pages';
import {
  archiveProjectAlternates,
  archiveProjectPath,
  cityServiceProjectAlternates,
  cityServiceProjectPath,
  cityProjectsAlternates,
  cityProjectsPath,
  serviceProjectAlternates,
  serviceProjectKeys,
  serviceProjectPages,
  serviceProjectPath,
  projectArchiveMonths,
} from '@/lib/project-intelligence-pages';
import {
  dynamicSeoLandingKeys,
  seoLandingAlternates,
  seoLandingPath,
} from '@/lib/seo-landing-pages';
import { getProjectPublicationReadiness } from '@/server/project-intelligence';

/** Relative crawl priority. The home page and the quote form are the goal. */
const priorities: Record<RouteKey, number> = {
  home: 1,
  quote: 0.9,
  calculator: 0.95,
  concreteSlab: 0.86,
  concreteDelivery: 0.86,
  concretePatio: 0.87,
  recentProjects: 0.78,
  marketIndex: 0.76,
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
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const keys = Object.keys(routes) as RouteKey[];
  const lastModified = new Date();
  const readiness = await getProjectPublicationReadiness(
    serviceProjectKeys.map((key) => ({
      key,
      projectType: serviceProjectPages[key].projectType,
    })),
  );

  const staticPages = keys.flatMap((key) => {
    if (key === 'recentProjects' && !readiness.recentProjects.indexable) return [];
    if (key === 'marketIndex' && !readiness.marketIndex.indexable) return [];

    return locales.map((locale) => {
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
    });
  });

  const cityPages = citySlugs.flatMap((city) =>
    locales.map((locale) => {
      return {
        url: absoluteUrl(cityPath(city, locale)),
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.75,
        alternates: { languages: cityAlternates(city) },
      };
    }),
  );

  const localCalculatorPages = localCalculatorSlugs.flatMap((city) =>
    locales.map((locale) => ({
      url: absoluteUrl(localCalculatorPath(city, locale)),
      lastModified: LOCAL_CALCULATOR_LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.82,
      alternates: { languages: localCalculatorAlternates(city) },
    })),
  );

  const seoLandingSitemapPages = dynamicSeoLandingKeys.flatMap((key) =>
    locales.map((locale) => ({
      url: absoluteUrl(seoLandingPath(key, locale)),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.78,
      alternates: { languages: seoLandingAlternates(key) },
    })),
  );

  const projectCityPages = citySlugs.flatMap((city) => {
    if (!readiness.cityProjects[city].indexable) return [];

    return locales.map((locale) => ({
      url: absoluteUrl(cityProjectsPath(city, locale)),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.74,
      alternates: { languages: cityProjectsAlternates(city) },
    }));
  });

  const projectServicePages = serviceProjectKeys.flatMap((service) => {
    if (!readiness.projectTypeProjects[serviceProjectPages[service].projectType].indexable) {
      return [];
    }

    return locales.map((locale) => ({
      url: absoluteUrl(serviceProjectPath(service, locale)),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.73,
      alternates: { languages: serviceProjectAlternates(service) },
    }));
  });

  const projectCityServicePages = citySlugs.flatMap((city) =>
    serviceProjectKeys.flatMap((service) => {
      const ready = readiness.cityServiceProjects[`${city}:${service}`]?.indexable ?? false;
      if (!ready) return [];

      return locales.map((locale) => ({
        url: absoluteUrl(cityServiceProjectPath(city, service, locale)),
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 0.71,
        alternates: { languages: cityServiceProjectAlternates(city, service) },
      }));
    }),
  );

  const projectArchivePages = projectArchiveMonths().flatMap((archive) => {
    const archiveKey = `${archive.year}-${String(archive.month).padStart(2, '0')}`;
    if (!(readiness.monthlyArchives[archiveKey]?.indexable ?? false)) return [];

    return locales.map((locale) => ({
      url: absoluteUrl(archiveProjectPath(archive, locale)),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.68,
      alternates: { languages: archiveProjectAlternates(archive) },
    }));
  });

  return [
    ...staticPages,
    ...cityPages,
    ...localCalculatorPages,
    ...seoLandingSitemapPages,
    ...projectCityPages,
    ...projectServicePages,
    ...projectCityServicePages,
    ...projectArchivePages,
  ];
}

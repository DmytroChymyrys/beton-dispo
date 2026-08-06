import type { Metadata } from 'next';
import type { Locale } from '@/i18n/config';
import { defaultLocale, localeTags, otherLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor, projectSegment } from '@/i18n/routes';
import { absoluteUrl } from '@/lib/site';
import type { ProjectType } from '@/lib/quote-options';
import { cityPages, type CitySlug } from './city-pages';

export const archiveMonthSlugs = {
  fr: [
    'janvier',
    'fevrier',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'decembre',
  ],
  en: [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ],
} as const satisfies Record<Locale, readonly string[]>;

export type ProjectArchiveMonth = {
  year: number;
  month: number;
};

export const serviceProjectPages = {
  garage: {
    projectType: 'GARAGE',
    slugs: { fr: 'garage', en: 'garage-slab' },
    title: { fr: 'Projets de dalle de garage', en: 'Garage Slab Projects' },
    shortTitle: { fr: 'Garage', en: 'Garage slabs' },
    description: {
      fr: 'Projets anonymisés de dalles de garage: volumes demandés, villes actives, tendances locales et demandes BétonDispo.',
      en: 'Anonymized garage slab projects: requested volumes, active cities, local trends and BétonDispo requests.',
    },
  },
  foundation: {
    projectType: 'FOUNDATION',
    slugs: { fr: 'fondation', en: 'foundation' },
    title: { fr: 'Projets de fondation en béton', en: 'Concrete Foundation Projects' },
    shortTitle: { fr: 'Fondation', en: 'Foundation' },
    description: {
      fr: 'Statistiques anonymisées de projets de fondation: volumes en m³, villes, activité récente et délais de réponse.',
      en: 'Anonymized foundation project statistics: m³ volumes, cities, recent activity and response times.',
    },
  },
  patio: {
    projectType: 'LANDSCAPING',
    slugs: { fr: 'patio', en: 'patio' },
    title: { fr: 'Projets de patio et terrasse en béton', en: 'Concrete Patio Projects' },
    shortTitle: { fr: 'Patio', en: 'Patio' },
    description: {
      fr: 'Demandes anonymisées pour patios, terrasses et aménagements en béton avec volumes, villes et tendances récentes.',
      en: 'Anonymized requests for concrete patios, outdoor terraces and landscaping projects with volumes, cities and recent trends.',
    },
  },
  slab: {
    projectType: 'SLAB',
    slugs: { fr: 'dalle-beton', en: 'concrete-slab' },
    title: { fr: 'Projets de dalle de béton', en: 'Concrete Slab Projects' },
    shortTitle: { fr: 'Dalle de béton', en: 'Concrete slab' },
    description: {
      fr: 'Projets anonymisés de dalles de béton: volumes demandés, villes actives et tendances des demandes qualifiées.',
      en: 'Anonymized concrete slab projects: requested volumes, active cities and qualified-request trends.',
    },
  },
  commercial: {
    projectType: 'COMMERCIAL',
    slugs: { fr: 'commercial', en: 'commercial' },
    title: { fr: 'Projets de béton commercial', en: 'Commercial Concrete Projects' },
    shortTitle: { fr: 'Commercial', en: 'Commercial' },
    description: {
      fr: 'Aperçu anonymisé des demandes de béton commercial: villes, volumes, activité récente et types de projets.',
      en: 'Anonymized view of commercial concrete requests: cities, volumes, recent activity and project types.',
    },
  },
} as const satisfies Record<
  string,
  {
    projectType: ProjectType;
    slugs: Record<Locale, string>;
    title: Record<Locale, string>;
    shortTitle: Record<Locale, string>;
    description: Record<Locale, string>;
  }
>;

export type ServiceProjectKey = keyof typeof serviceProjectPages;

export const serviceProjectKeys = Object.keys(serviceProjectPages) as ServiceProjectKey[];

export function serviceProjectKeyForSlug(slug: string, locale: Locale): ServiceProjectKey | null {
  return serviceProjectKeys.find((key) => serviceProjectPages[key].slugs[locale] === slug) ?? null;
}

export function serviceProjectPath(key: ServiceProjectKey, locale: Locale): string {
  return `/${locale}/${projectSegment[locale]}/${serviceProjectPages[key].slugs[locale]}`;
}

export function serviceProjectAlternates(key: ServiceProjectKey): Record<string, string> {
  return {
    [localeTags.fr]: absoluteUrl(serviceProjectPath(key, 'fr')),
    [localeTags.en]: absoluteUrl(serviceProjectPath(key, 'en')),
    'x-default': absoluteUrl(serviceProjectPath(key, defaultLocale)),
  };
}

export function cityServiceProjectPath(
  city: CitySlug,
  service: ServiceProjectKey,
  locale: Locale,
): string {
  return `/${locale}/${city}/${serviceProjectPages[service].slugs[locale]}`;
}

export function cityServiceProjectAlternates(
  city: CitySlug,
  service: ServiceProjectKey,
): Record<string, string> {
  return {
    [localeTags.fr]: absoluteUrl(cityServiceProjectPath(city, service, 'fr')),
    [localeTags.en]: absoluteUrl(cityServiceProjectPath(city, service, 'en')),
    'x-default': absoluteUrl(cityServiceProjectPath(city, service, defaultLocale)),
  };
}

export function cityProjectsPath(city: CitySlug, locale: Locale): string {
  return `/${locale}/${projectSegment[locale]}/${city}`;
}

export function cityProjectsAlternates(city: CitySlug): Record<string, string> {
  return {
    [localeTags.fr]: absoluteUrl(cityProjectsPath(city, 'fr')),
    [localeTags.en]: absoluteUrl(cityProjectsPath(city, 'en')),
    'x-default': absoluteUrl(cityProjectsPath(city, defaultLocale)),
  };
}

export function archiveMonthForSlug(
  year: string,
  monthSlug: string,
  locale: Locale,
): ProjectArchiveMonth | null {
  const parsedYear = Number(year);
  const monthIndex = archiveMonthSlugs[locale].findIndex((slug) => slug === monthSlug);
  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(parsedYear) || parsedYear < 2025 || parsedYear > currentYear + 1) {
    return null;
  }
  if (monthIndex < 0) return null;

  return { year: parsedYear, month: monthIndex + 1 };
}

export function archiveMonthLabel(locale: Locale, archive: ProjectArchiveMonth): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(archive.year, archive.month - 1, 1)));
}

export function archiveProjectPath(archive: ProjectArchiveMonth, locale: Locale): string {
  return `/${locale}/${projectSegment[locale]}/${archive.year}/${archiveMonthSlugs[locale][archive.month - 1]}`;
}

export function archiveProjectAlternates(archive: ProjectArchiveMonth): Record<string, string> {
  return {
    [localeTags.fr]: absoluteUrl(archiveProjectPath(archive, 'fr')),
    [localeTags.en]: absoluteUrl(archiveProjectPath(archive, 'en')),
    'x-default': absoluteUrl(archiveProjectPath(archive, defaultLocale)),
  };
}

export function projectArchiveMonths(): ProjectArchiveMonth[] {
  const now = new Date();
  const start = new Date(Date.UTC(2026, 0, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const months: ProjectArchiveMonth[] = [];

  for (
    let cursor = start;
    cursor <= end;
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  ) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
  }

  return months.reverse();
}

export function projectIntelligenceTitle(locale: Locale, city?: CitySlug): string {
  if (city) {
    const cityName = cityPages[city].name;
    return locale === 'fr'
      ? `Projets de béton à ${cityName} | BétonDispo`
      : `Concrete Projects in ${cityName} | BétonDispo`;
  }

  return locale === 'fr'
    ? 'Projets de béton récents au Québec | BétonDispo'
    : 'Recent Concrete Projects in Québec | BétonDispo';
}

export function projectIntelligenceDescription(locale: Locale, city?: CitySlug): string {
  if (city) {
    const cityName = cityPages[city].name;
    return locale === 'fr'
      ? `Statistiques anonymisées et projets récents de béton à ${cityName}: volumes en m³, types de projets, activité locale et demandes BétonDispo.`
      : `Anonymized concrete project statistics and recent projects in ${cityName}: m³ volumes, project types, local activity and BétonDispo requests.`;
  }

  return locale === 'fr'
    ? 'Consultez des projets de béton récents et anonymisés au Québec, avec volumes demandés, villes, types de projets et tendances du marché.'
    : 'Explore anonymized recent concrete projects in Québec, including requested volumes, cities, project types and market trends.';
}

function noindexFollow(indexable: boolean): Metadata['robots'] {
  return indexable ? undefined : { index: false, follow: true };
}

export function buildProjectIntelligenceMetadata(
  locale: Locale,
  city?: CitySlug,
  { indexable = true }: { indexable?: boolean } = {},
): Metadata {
  const title = projectIntelligenceTitle(locale, city);
  const description = projectIntelligenceDescription(locale, city);
  const canonical = absoluteUrl(city ? cityProjectsPath(city, locale) : pathFor('recentProjects', locale));
  const languages = city
    ? cityProjectsAlternates(city)
    : {
        [localeTags.fr]: absoluteUrl(pathFor('recentProjects', 'fr')),
        [localeTags.en]: absoluteUrl(pathFor('recentProjects', 'en')),
        'x-default': absoluteUrl(pathFor('recentProjects', defaultLocale)),
      };
  const dict = getDictionary(locale);
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title,
    description,
    robots: noindexFollow(indexable),
    alternates: indexable ? { canonical, languages } : undefined,
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title,
      description,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export function buildServiceProjectMetadata(
  locale: Locale,
  service: ServiceProjectKey,
  { indexable = true }: { indexable?: boolean } = {},
): Metadata {
  const page = serviceProjectPages[service];
  const title = `${page.title[locale]} | BétonDispo`;
  const description = page.description[locale];
  const canonical = absoluteUrl(serviceProjectPath(service, locale));
  const languages = serviceProjectAlternates(service);
  const dict = getDictionary(locale);
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title,
    description,
    robots: noindexFollow(indexable),
    alternates: indexable ? { canonical, languages } : undefined,
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title,
      description,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export function buildCityServiceProjectMetadata(
  locale: Locale,
  city: CitySlug,
  service: ServiceProjectKey,
  { indexable = true }: { indexable?: boolean } = {},
): Metadata {
  const cityName = cityPages[city].name;
  const page = serviceProjectPages[service];
  const title =
    locale === 'fr'
      ? `${page.shortTitle[locale]} à ${cityName} | Projets anonymisés BétonDispo`
      : `${page.shortTitle[locale]} in ${cityName} | Anonymized BétonDispo Projects`;
  const description =
    locale === 'fr'
      ? `Projets anonymisés de ${page.shortTitle[locale].toLowerCase()} à ${cityName}: volumes en m³, demandes récentes, tendances locales et CTA de soumission.`
      : `Anonymized ${page.shortTitle[locale].toLowerCase()} projects in ${cityName}: m³ volumes, recent requests, local trends and quote CTA.`;
  const canonical = absoluteUrl(cityServiceProjectPath(city, service, locale));
  const languages = cityServiceProjectAlternates(city, service);
  const dict = getDictionary(locale);
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title,
    description,
    robots: noindexFollow(indexable),
    alternates: indexable ? { canonical, languages } : undefined,
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title,
      description,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export function buildArchiveProjectMetadata(
  locale: Locale,
  archive: ProjectArchiveMonth,
  { indexable = true }: { indexable?: boolean } = {},
): Metadata {
  const label = archiveMonthLabel(locale, archive);
  const title =
    locale === 'fr'
      ? `Projets de béton en ${label} | BétonDispo`
      : `Concrete Projects in ${label} | BétonDispo`;
  const description =
    locale === 'fr'
      ? `Archive anonymisée des projets de béton en ${label}: volumes demandés, villes actives, types de projets et tendances BétonDispo.`
      : `Anonymized archive of concrete projects in ${label}: requested volumes, active cities, project types and BétonDispo trends.`;
  const canonical = absoluteUrl(archiveProjectPath(archive, locale));
  const languages = archiveProjectAlternates(archive);
  const dict = getDictionary(locale);
  const socialImage = {
    url: absoluteUrl(`/${locale}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: dict.meta.siteName,
  };

  return {
    title,
    description,
    robots: noindexFollow(indexable),
    alternates: indexable ? { canonical, languages } : undefined,
    openGraph: {
      type: 'website',
      siteName: dict.meta.siteName,
      title,
      description,
      url: canonical,
      locale: dict.meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [socialImage.url],
    },
  };
}

export function buildMarketIndexMetadata(
  locale: Locale,
  { indexable = true }: { indexable?: boolean } = {},
): Metadata {
  const title =
    locale === 'fr'
      ? 'Indice du marché du béton au Québec | BétonDispo'
      : 'Québec Concrete Market Index | BétonDispo';
  const description =
    locale === 'fr'
      ? 'Indice public et anonymisé de la demande de béton: volume moyen, ville la plus active, type de projet dominant et tendances récentes.'
      : 'A public anonymized concrete demand index: average volume, most active city, top project type and recent market trends.';
  const canonical = absoluteUrl(pathFor('marketIndex', locale));
  const languages = {
    [localeTags.fr]: absoluteUrl(pathFor('marketIndex', 'fr')),
    [localeTags.en]: absoluteUrl(pathFor('marketIndex', 'en')),
    'x-default': absoluteUrl(pathFor('marketIndex', defaultLocale)),
  };

  return {
    title,
    description,
    robots: noindexFollow(indexable),
    alternates: indexable ? { canonical, languages } : undefined,
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      locale: getDictionary(locale).meta.ogLocale,
      alternateLocale: getDictionary(otherLocale(locale)).meta.ogLocale,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

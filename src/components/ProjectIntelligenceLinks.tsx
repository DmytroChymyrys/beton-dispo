import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { pathFor } from '@/i18n/routes';
import { cityPages, citySlugs, type CitySlug } from '@/lib/city-pages';
import {
  archiveMonthLabel,
  archiveProjectPath,
  cityServiceProjectPath,
  cityProjectsPath,
  projectArchiveMonths,
  serviceProjectKeys,
  serviceProjectPages,
  serviceProjectPath,
  type ServiceProjectKey,
} from '@/lib/project-intelligence-pages';
import { getProjectPublicationReadiness } from '@/server/project-intelligence';

type IntelligenceLink = {
  href: string;
  title: string;
  description: string;
};

const serviceHighlights: ServiceProjectKey[] = ['slab', 'patio', 'garage', 'foundation'];

export async function ProjectIntelligenceLinks({
  locale,
  currentCity,
  currentService,
}: {
  locale: Locale;
  currentCity?: CitySlug;
  currentService?: ServiceProjectKey;
}) {
  const links = await intelligenceLinks(locale, currentCity, currentService);

  if (!links.length) return null;

  return (
    <section className="rounded-card border-line bg-surface border p-6">
      <h2 className="text-2xl">
        {locale === 'fr' ? 'Données de projets' : 'Project intelligence'}
      </h2>
      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
        {locale === 'fr'
          ? 'Explorer les tendances anonymisées par ville, service et demande récente.'
          : 'Explore anonymized trends by city, service and recent demand.'}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <article key={link.href} className="border-line rounded-card border p-4">
            <h3 className="font-display text-lg font-bold">{link.title}</h3>
            <p className="text-ink-muted mt-2 text-sm leading-relaxed">{link.description}</p>
            <Link
              href={link.href}
              className="text-accent mt-3 inline-flex min-h-10 items-center text-sm font-semibold hover:underline"
            >
              {locale === 'fr' ? 'Voir les données' : 'View data'}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function footerIntelligenceLinks(locale: Locale): Promise<{ href: string; label: string }[]> {
  const readiness = await getProjectPublicationReadiness(serviceReadinessInputs());
  const links: { href: string; label: string }[] = [];

  if (readiness.recentProjects.indexable) {
    links.push({
      href: pathFor('recentProjects', locale),
      label: locale === 'fr' ? 'Projets récents' : 'Recent projects',
    });
  }

  if (readiness.marketIndex.indexable) {
    links.push({
      href: pathFor('marketIndex', locale),
      label: locale === 'fr' ? 'Indice du marché' : 'Market index',
    });
  }

  for (const archive of projectArchiveMonths()) {
    const key = archiveReadinessKey(archive);
    if (!(readiness.monthlyArchives[key]?.indexable ?? false)) continue;
    links.push({
      href: archiveProjectPath(archive, locale),
      label: archiveMonthLabel(locale, archive),
    });
    break;
  }

  for (const service of serviceHighlights) {
    if (!readiness.projectTypeProjects[serviceProjectPages[service].projectType].indexable) continue;
    links.push({
      href: serviceProjectPath(service, locale),
      label: serviceProjectPages[service].shortTitle[locale],
    });
  }

  for (const city of citySlugs) {
    if (!readiness.cityProjects[city].indexable) continue;
    links.push({
      href: cityProjectsPath(city, locale),
      label: locale === 'fr' ? `Projets à ${cityPages[city].name}` : `${cityPages[city].name} projects`,
    });
  }

  return links.slice(0, 7);
}

async function intelligenceLinks(
  locale: Locale,
  currentCity?: CitySlug,
  currentService?: ServiceProjectKey,
): Promise<IntelligenceLink[]> {
  const readiness = await getProjectPublicationReadiness(serviceReadinessInputs());
  const base: IntelligenceLink[] = [
    ...(readiness.recentProjects.indexable
      ? [
          {
            href: pathFor('recentProjects', locale),
            title: locale === 'fr' ? 'Projets récents anonymisés' : 'Recent anonymized projects',
            description:
              locale === 'fr'
                ? 'Voir les demandes qualifiées récentes sans données personnelles.'
                : 'View recent qualified requests without personal data.',
          },
        ]
      : []),
    ...(readiness.marketIndex.indexable
      ? [
          {
            href: pathFor('marketIndex', locale),
            title: locale === 'fr' ? 'Indice du marché du béton' : 'Concrete market index',
            description:
              locale === 'fr'
                ? 'Suivre les volumes, villes actives et types de projets dominants.'
                : 'Track volumes, active cities and leading project types.',
          },
        ]
      : []),
  ];
  const latestArchive = projectArchiveMonths().find(
    (archive) => readiness.monthlyArchives[archiveReadinessKey(archive)]?.indexable ?? false,
  );
  if (latestArchive) {
    base.push({
      href: archiveProjectPath(latestArchive, locale),
      title:
        locale === 'fr'
          ? `Archive ${archiveMonthLabel(locale, latestArchive)}`
          : `${archiveMonthLabel(locale, latestArchive)} archive`,
      description:
        locale === 'fr'
          ? 'Consulter les projets anonymisés regroupés par mois.'
          : 'Review anonymized projects grouped by month.',
    });
  }

  const serviceLinks = serviceHighlights
    .filter((service) => service !== currentService)
    .filter((service) =>
      currentCity
        ? (readiness.cityServiceProjects[cityServiceReadinessKey(currentCity, service)]?.indexable ?? false)
        : readiness.projectTypeProjects[serviceProjectPages[service].projectType].indexable,
    )
    .slice(0, 2)
    .map((service) => ({
      href: currentCity
        ? cityServiceProjectPath(currentCity, service, locale)
        : serviceProjectPath(service, locale),
      title: serviceProjectPages[service].shortTitle[locale],
      description:
        currentCity
          ? locale === 'fr'
            ? `${serviceProjectPages[service].shortTitle[locale]} à ${cityPages[currentCity].name}: projets, volumes et tendances locales.`
            : `${serviceProjectPages[service].shortTitle[locale]} in ${cityPages[currentCity].name}: projects, volumes and local trends.`
          : serviceProjectPages[service].description[locale],
    }));

  const cityLinks = citySlugs
    .filter((city) => city !== currentCity)
    .filter((city) =>
      currentService
        ? (readiness.cityServiceProjects[cityServiceReadinessKey(city, currentService)]?.indexable ?? false)
        : readiness.cityProjects[city].indexable,
    )
    .slice(0, 2)
    .map((city) => ({
      href: currentService
        ? cityServiceProjectPath(city, currentService, locale)
        : cityProjectsPath(city, locale),
      title: cityPages[city].name,
      description:
        currentService
          ? locale === 'fr'
            ? `${serviceProjectPages[currentService].shortTitle[locale]} à ${cityPages[city].name}: activité anonymisée et volumes récents.`
            : `${serviceProjectPages[currentService].shortTitle[locale]} in ${cityPages[city].name}: anonymized activity and recent volumes.`
          : locale === 'fr'
          ? `Projets anonymisés, volumes et tendances locales à ${cityPages[city].name}.`
          : `Anonymized projects, volumes and local trends in ${cityPages[city].name}.`,
    }));

  return [...base, ...serviceLinks, ...cityLinks].slice(0, 6);
}

function serviceReadinessInputs() {
  return serviceProjectKeys.map((key) => ({
    key,
    projectType: serviceProjectPages[key].projectType,
  }));
}

function archiveReadinessKey(archive: { year: number; month: number }): string {
  return `${archive.year}-${String(archive.month).padStart(2, '0')}`;
}

function cityServiceReadinessKey(city: CitySlug, service: ServiceProjectKey): string {
  return `${city}:${service}`;
}

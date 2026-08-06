import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pathFor } from '@/i18n/routes';
import { buttonClass } from '@/components/ui/button-styles';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { ProjectIntelligenceLinks } from '@/components/ProjectIntelligenceLinks';
import { RelatedServices } from '@/components/RelatedServices';
import { absoluteUrl } from '@/lib/site';
import { cityPages, citySlugs, type CitySlug } from '@/lib/city-pages';
import { PROJECT_TYPES, type ProjectType } from '@/lib/quote-options';
import { breadcrumbSchema } from '@/lib/structured-data';
import {
  archiveMonthLabel,
  archiveProjectPath,
  cityServiceProjectPath,
  cityProjectsPath,
  projectIntelligenceDescription,
  projectIntelligenceTitle,
  serviceProjectPages,
  serviceProjectPath,
  type ProjectArchiveMonth,
  type ServiceProjectKey,
} from '@/lib/project-intelligence-pages';
import type {
  ProjectDistributionRow,
  ProjectIntelligenceData,
  ProjectIntelligenceStats,
  MarketIntelligenceStats,
  MarketTrendRow,
  PublicProjectStatus,
  PublicProject,
} from '@/server/project-intelligence';

type Mode = 'recent' | 'city' | 'market' | 'service' | 'cityService' | 'archive';
type ProjectFaq = { question: string; answer: string };
export type RecentProjectFilters = {
  city?: CitySlug;
  projectType?: ProjectType;
  status?: PublicProjectStatus;
  page: number;
};

export function ProjectIntelligencePage({
  locale,
  data,
  mode,
  city,
  service,
  archive,
  filters,
  indexable = true,
}: {
  locale: Locale;
  data: ProjectIntelligenceData;
  mode: Mode;
  city?: CitySlug;
  service?: ServiceProjectKey;
  archive?: ProjectArchiveMonth;
  filters?: RecentProjectFilters;
  indexable?: boolean;
}) {
  const copy = getCopy(locale, mode, city, service, archive);
  const insight = dynamicInsight(locale, data, mode, city, service, archive);
  const faqs = projectIntelligenceFaqs(locale, mode, city, service, archive);
  const preview = !indexable;
  const homeLabel = locale === 'fr' ? 'Accueil' : 'Home';
  const currentPath =
    mode === 'market'
      ? pathFor('marketIndex', locale)
      : mode === 'archive' && archive
        ? archiveProjectPath(archive, locale)
      : mode === 'cityService' && city && service
        ? cityServiceProjectPath(city, service, locale)
      : mode === 'service' && service
        ? serviceProjectPath(service, locale)
      : city
        ? cityProjectsPath(city, locale)
        : pathFor('recentProjects', locale);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: homeLabel, href: pathFor('home', locale) },
    ...(city || service || archive
      ? [
          {
            label: locale === 'fr' ? 'Projets récents' : 'Recent projects',
            href: pathFor('recentProjects', locale),
          },
        ]
      : []),
    ...(mode === 'cityService' && city
      ? [{ label: cityPages[city].name, href: cityProjectsPath(city, locale) }]
      : []),
    { label: copy.shortTitle },
  ];

  const breadcrumbLdItems = breadcrumbs.map((item, index) => ({
    name: item.label,
    url: item.href ? absoluteUrl(item.href) : index === breadcrumbs.length - 1 ? absoluteUrl(currentPath) : absoluteUrl(pathFor('recentProjects', locale)),
  }));

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbLdItems)} />
      {indexable ? (
        <JsonLd data={collectionSchema(locale, copy.title, copy.description, currentPath, data.projects)} />
      ) : null}
      <JsonLd data={projectFaqSchema(faqs)} />

      <div className="border-line bg-surface border-b">
        <div className="container-page py-10 md:py-14">
          <Breadcrumbs items={breadcrumbs} />
          <p className="text-accent font-display mt-8 text-sm font-bold tracking-wide uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl leading-[1.08] sm:text-5xl">{copy.title}</h1>
          <p className="text-ink-muted mt-4 max-w-3xl text-lg leading-relaxed">
            {copy.description}
          </p>
          <DynamicInsight locale={locale} insight={insight} />
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href={pathFor('quote', locale)} className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
              {locale === 'fr' ? 'Obtenir une soumission' : 'Request a quote'}
            </Link>
            <Link
              href={pathFor('calculator', locale)}
              className={buttonClass('secondary', 'lg', 'w-full sm:w-auto')}
            >
              {locale === 'fr' ? 'Calculer le volume' : 'Calculate volume'}
            </Link>
          </div>
        </div>
      </div>

      {preview ? (
        <ProjectPreviewState
          locale={locale}
          mode={mode}
          city={city}
          service={service}
          archive={archive}
        />
      ) : (
      <main className="bg-ground">
        <section className="container-page py-10 md:py-14">
          {mode === 'market' && data.market ? (
            <MarketSnapshot locale={locale} market={data.market} stats={data.stats} />
          ) : null}
          {mode === 'recent' && filters ? (
            <RecentProjectFiltersPanel locale={locale} filters={filters} />
          ) : null}
          <StatsGrid locale={locale} stats={data.stats} />

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title={locale === 'fr' ? 'Projets anonymisés récents' : 'Recent anonymized projects'}>
              <ProjectList locale={locale} projects={data.projects} />
              {mode === 'recent' && filters && data.pagination ? (
                <ProjectPagination locale={locale} filters={filters} pagination={data.pagination} />
              ) : null}
            </Panel>

            <div className="space-y-6">
              <Panel title={locale === 'fr' ? 'Types de projets' : 'Project types'}>
                <DistributionBars locale={locale} rows={data.projectDistribution} kind="project" />
              </Panel>
              <Panel title={locale === 'fr' ? 'Villes actives' : 'Active cities'}>
                <DistributionBars locale={locale} rows={data.cityDistribution} kind="city" />
              </Panel>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Panel title={locale === 'fr' ? 'Pages de villes' : 'City project pages'}>
              <CityLinks locale={locale} currentCity={city} />
            </Panel>
            <Panel title={locale === 'fr' ? 'À propos des données' : 'About this data'}>
              <p className="text-ink-muted leading-relaxed">{copy.privacy}</p>
              <p className="text-ink-muted mt-3 leading-relaxed">
                {locale === 'fr'
                  ? 'Les statistiques changent automatiquement à mesure que les demandes qualifiées évoluent dans le CRM.'
                  : 'Statistics update automatically as qualified requests move through the CRM.'}
              </p>
            </Panel>
          </div>
        </section>

        <section className="container-page pb-12 md:pb-16">
          <div className="space-y-6">
            <ProjectIntelligenceLinks locale={locale} currentCity={city} currentService={service} />
            <ProjectFaqSection locale={locale} faqs={faqs} />
            <RelatedServices locale={locale} current="calculator" />
          </div>
        </section>
      </main>
      )}
    </>
  );
}

function getCopy(
  locale: Locale,
  mode: Mode,
  city?: CitySlug,
  service?: ServiceProjectKey,
  archive?: ProjectArchiveMonth,
) {
  const cityName = city ? cityPages[city].name : null;
  const servicePage = service ? serviceProjectPages[service] : null;
  const archiveLabel = archive ? archiveMonthLabel(locale, archive) : null;
  const title =
    mode === 'market'
      ? locale === 'fr'
        ? 'Indice du marché du béton au Québec'
        : 'Québec Concrete Market Index'
      : mode === 'archive' && archiveLabel
        ? locale === 'fr'
          ? `Projets de béton en ${archiveLabel}`
          : `Concrete projects in ${archiveLabel}`
      : mode === 'cityService' && cityName && servicePage
        ? locale === 'fr'
          ? `${servicePage.shortTitle[locale]} à ${cityName}`
          : `${servicePage.shortTitle[locale]} in ${cityName}`
      : servicePage
        ? servicePage.title[locale]
      : projectIntelligenceTitle(locale, city);
  const description =
    mode === 'market'
      ? locale === 'fr'
        ? 'Un aperçu public et anonymisé de la demande de béton captée par BétonDispo: volumes, villes, types de projets et délais de réponse.'
        : 'A public anonymized view of concrete demand captured by BétonDispo: volumes, cities, project types and response times.'
      : mode === 'archive' && archiveLabel
        ? locale === 'fr'
          ? `Archive mensuelle anonymisée des projets de béton en ${archiveLabel}: volumes, villes actives, types de projets et activité récente.`
          : `Monthly anonymized archive of concrete projects in ${archiveLabel}: volumes, active cities, project types and recent activity.`
      : mode === 'cityService' && cityName && servicePage
        ? locale === 'fr'
          ? `Demandes anonymisées pour ${servicePage.shortTitle[locale].toLowerCase()} à ${cityName}: volumes, activité récente, délais de réponse et tendances locales.`
          : `Anonymized ${servicePage.shortTitle[locale].toLowerCase()} requests in ${cityName}: volumes, recent activity, response times and local trends.`
      : servicePage
        ? servicePage.description[locale]
      : projectIntelligenceDescription(locale, city);

  return {
    title,
    shortTitle:
      mode === 'market'
        ? locale === 'fr'
          ? 'Indice du marché'
          : 'Market index'
        : mode === 'archive' && archiveLabel
          ? archiveLabel
        : mode === 'cityService' && cityName && servicePage
          ? `${servicePage.shortTitle[locale]} · ${cityName}`
        : servicePage
          ? servicePage.shortTitle[locale]
        : cityName ?? (locale === 'fr' ? 'Projets récents' : 'Recent projects'),
    description,
    eyebrow:
      mode === 'market'
        ? locale === 'fr'
          ? 'Intelligence de marché'
          : 'Market intelligence'
        : mode === 'archive'
          ? locale === 'fr'
            ? 'Archive mensuelle'
            : 'Monthly archive'
        : mode === 'cityService'
          ? locale === 'fr'
            ? 'Projets locaux par service'
            : 'Local projects by service'
        : servicePage
          ? locale === 'fr'
            ? 'Projets par service'
            : 'Projects by service'
        : locale === 'fr'
          ? 'Projets réels anonymisés'
          : 'Anonymized real projects',
    privacy:
      locale === 'fr'
        ? 'Aucune donnée personnelle n’est publiée. Les noms, adresses, codes postaux, téléphones, courriels, fournisseurs, notes et identifiants internes sont exclus.'
        : 'No personal data is published. Names, addresses, postal codes, phones, emails, suppliers, notes and internal identifiers are excluded.',
  };
}

function StatsGrid({ locale, stats }: { locale: Locale; stats: ProjectIntelligenceStats }) {
  const items = [
    {
      label: locale === 'fr' ? 'Projets qualifiés' : 'Qualified projects',
      value: String(stats.totalProjects),
    },
    {
      label: locale === 'fr' ? 'Volume total demandé' : 'Total requested volume',
      value: volume(locale, stats.totalVolumeM3),
    },
    {
      label: locale === 'fr' ? 'Volume moyen' : 'Average volume',
      value: stats.averageVolumeM3 === null ? '—' : volume(locale, stats.averageVolumeM3),
    },
    {
      label: locale === 'fr' ? 'Plus grand projet' : 'Largest project',
      value: stats.largestVolumeM3 === null ? '—' : volume(locale, stats.largestVolumeM3),
    },
    {
      label: locale === 'fr' ? 'Ville la plus active' : 'Most active city',
      value: stats.busiestCity ?? '—',
    },
    {
      label: locale === 'fr' ? 'Réponse moyenne' : 'Average response',
      value: minutes(locale, stats.averageResponseMinutes),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-card border-line bg-surface border p-5">
          <p className="text-ink-muted text-sm">{item.label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function MarketSnapshot({
  locale,
  market,
  stats,
}: {
  locale: Locale;
  market: MarketIntelligenceStats;
  stats: ProjectIntelligenceStats;
}) {
  const dict = getDictionary(locale);
  const topProject = stats.topProjectType
    ? dict.quote.options.projectType[stats.topProjectType]
    : '—';
  const cards = [
    {
      label: locale === 'fr' ? "Aujourd'hui" : 'Today',
      value: String(market.projectsToday),
    },
    {
      label: locale === 'fr' ? 'Cette semaine' : 'This week',
      value: String(market.projectsThisWeek),
    },
    {
      label: locale === 'fr' ? 'Ce mois-ci' : 'This month',
      value: String(market.projectsThisMonth),
    },
    {
      label: locale === 'fr' ? 'Cette année' : 'This year',
      value: String(market.projectsThisYear),
    },
    {
      label: locale === 'fr' ? 'Volume médian' : 'Median volume',
      value: market.medianVolumeM3 === null ? '—' : volume(locale, market.medianVolumeM3),
    },
    {
      label: locale === 'fr' ? 'Mois le plus actif' : 'Busiest month',
      value: market.busiestMonth ? formatMonthKey(locale, market.busiestMonth) : '—',
    },
  ];

  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-card border-accent bg-accent-tint border p-6">
        <p className="text-accent font-display text-sm font-bold tracking-wide uppercase">
          {locale === 'fr' ? 'Résumé dynamique' : 'Dynamic summary'}
        </p>
        <h2 className="mt-3 text-3xl">
          {locale === 'fr' ? 'Signal de demande en temps réel' : 'Live demand signal'}
        </h2>
        <p className="text-ink-muted mt-4 leading-relaxed">
          {locale === 'fr'
            ? `${market.projectsThisMonth} projet(s) qualifié(s) sont visibles ce mois-ci. ${topProject} ressort comme type dominant, avec ${stats.busiestCity ?? 'aucune ville dominante'} comme secteur le plus actif.`
            : `${market.projectsThisMonth} qualified project(s) are visible this month. ${topProject} stands out as the leading type, with ${stats.busiestCity ?? 'no dominant city'} as the most active area.`}
        </p>
      </section>

      <section className="rounded-card border-line bg-surface border p-6">
        <h2 className="text-2xl">
          {locale === 'fr' ? 'Statistiques du marché' : 'Market statistics'}
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="bg-ground rounded-lg p-4">
              <p className="text-ink-muted text-sm">{card.label}</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border-line bg-surface border p-6 lg:col-span-2">
        <h2 className="text-2xl">
          {locale === 'fr' ? 'Tendance mensuelle' : 'Monthly trend'}
        </h2>
        <MonthlyTrend locale={locale} rows={market.monthlyTrend} />
      </section>
    </div>
  );
}

function RecentProjectFiltersPanel({
  locale,
  filters,
}: {
  locale: Locale;
  filters: RecentProjectFilters;
}) {
  const dict = getDictionary(locale);
  const selectClass = 'min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink';

  return (
    <form
      method="get"
      action={pathFor('recentProjects', locale)}
      className="rounded-card border-line bg-surface mb-8 grid gap-4 border p-5 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end"
    >
      <label className="grid gap-2">
        <span className="font-display text-sm font-bold">
          {locale === 'fr' ? 'Ville' : 'City'}
        </span>
        <select name="city" defaultValue={filters.city ?? ''} className={selectClass}>
          <option value="">{locale === 'fr' ? 'Toutes les villes' : 'All cities'}</option>
          {citySlugs.map((city) => (
            <option key={city} value={city}>
              {cityPages[city].name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="font-display text-sm font-bold">
          {locale === 'fr' ? 'Type de projet' : 'Project type'}
        </span>
        <select name="project" defaultValue={filters.projectType ?? ''} className={selectClass}>
          <option value="">{locale === 'fr' ? 'Tous les types' : 'All types'}</option>
          {PROJECT_TYPES.map((projectType) => (
            <option key={projectType} value={projectType}>
              {dict.quote.options.projectType[projectType]}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="font-display text-sm font-bold">
          {locale === 'fr' ? 'Statut public' : 'Public status'}
        </span>
        <select name="status" defaultValue={filters.status ?? ''} className={selectClass}>
          <option value="">{locale === 'fr' ? 'Tous les statuts' : 'All statuses'}</option>
          <option value="in_progress">{locale === 'fr' ? 'En planification' : 'In planning'}</option>
          <option value="completed">{locale === 'fr' ? 'Complété' : 'Completed'}</option>
        </select>
      </label>

      <button type="submit" className={buttonClass('primary', 'md', 'w-full')}>
        {locale === 'fr' ? 'Filtrer' : 'Filter'}
      </button>
      <Link href={pathFor('recentProjects', locale)} className={buttonClass('secondary', 'md', 'w-full')}>
        {locale === 'fr' ? 'Réinitialiser' : 'Reset'}
      </Link>
    </form>
  );
}

function ProjectPagination({
  locale,
  filters,
  pagination,
}: {
  locale: Locale;
  filters: RecentProjectFilters;
  pagination: NonNullable<ProjectIntelligenceData['pagination']>;
}) {
  if (pagination.totalPages <= 1) {
    return (
      <p className="text-ink-muted mt-5 text-sm">
        {locale === 'fr'
          ? `${pagination.total} projet(s) dans cette vue.`
          : `${pagination.total} project(s) in this view.`}
      </p>
    );
  }

  const previous = Math.max(1, pagination.page - 1);
  const next = Math.min(pagination.totalPages, pagination.page + 1);

  return (
    <nav
      aria-label={locale === 'fr' ? 'Pagination des projets' : 'Project pagination'}
      className="border-line mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-ink-muted text-sm">
        {locale === 'fr'
          ? `Page ${pagination.page} de ${pagination.totalPages} · ${pagination.total} projet(s)`
          : `Page ${pagination.page} of ${pagination.totalPages} · ${pagination.total} project(s)`}
      </p>
      <div className="flex gap-3">
        <Link
          href={recentProjectsQuery(locale, filters, previous)}
          aria-disabled={pagination.page <= 1}
          className={buttonClass(
            'secondary',
            'md',
            pagination.page <= 1 ? 'pointer-events-none opacity-50' : '',
          )}
        >
          {locale === 'fr' ? 'Précédent' : 'Previous'}
        </Link>
        <Link
          href={recentProjectsQuery(locale, filters, next)}
          aria-disabled={pagination.page >= pagination.totalPages}
          className={buttonClass(
            'secondary',
            'md',
            pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : '',
          )}
        >
          {locale === 'fr' ? 'Suivant' : 'Next'}
        </Link>
      </div>
    </nav>
  );
}

function recentProjectsQuery(locale: Locale, filters: RecentProjectFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.projectType) params.set('project', filters.projectType);
  if (filters.status) params.set('status', filters.status);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `${pathFor('recentProjects', locale)}${query ? `?${query}` : ''}`;
}

function DynamicInsight({
  locale,
  insight,
}: {
  locale: Locale;
  insight: { text: string; signals: string[] };
}) {
  return (
    <section className="border-line bg-ground mt-6 max-w-4xl rounded-lg border p-5">
      <p className="text-accent font-display text-xs font-bold tracking-wide uppercase">
        {locale === 'fr' ? 'Résumé généré par les données' : 'Data-generated summary'}
      </p>
      <p className="text-ink-soft mt-2 leading-relaxed">{insight.text}</p>
      {insight.signals.length ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {insight.signals.map((signal) => (
            <li key={signal} className="text-ink-muted text-sm">
              <span aria-hidden="true" className="text-accent mr-2 font-bold">
                |
              </span>
              {signal}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProjectList({ locale, projects }: { locale: Locale; projects: PublicProject[] }) {
  const dict = getDictionary(locale);
  if (!projects.length) {
    return (
      <p className="text-ink-muted py-8 text-center">
        {locale === 'fr'
          ? 'Les projets publics apparaîtront ici lorsque les demandes qualifiées seront disponibles.'
          : 'Public projects will appear here once qualified requests are available.'}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {projects.map((project, index) => (
        <article key={`${project.city}-${project.createdAt.toISOString()}-${index}`} className="border-line rounded-lg border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold">{dict.quote.options.projectType[project.projectType]}</h3>
              <p className="text-ink-muted mt-1">
                {project.city} · {project.volumeM3 === null ? (locale === 'fr' ? 'Volume à confirmer' : 'Volume to confirm') : volume(locale, project.volumeM3)}
              </p>
              <p className="text-ink-soft mt-1 text-sm">
                {statusLabel(locale, project.status)} {formatMonth(locale, project.createdAt)}
              </p>
            </div>
            {project.citySlug ? (
              <Link href={cityProjectsPath(project.citySlug, locale)} className="text-accent text-sm font-bold hover:underline">
                {locale === 'fr' ? 'Voir la ville' : 'View city'}
              </Link>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function DistributionBars({
  locale,
  rows,
  kind,
}: {
  locale: Locale;
  rows: ProjectDistributionRow[];
  kind: 'project' | 'city';
}) {
  const dict = getDictionary(locale);
  if (!rows.length) {
    return <p className="text-ink-muted">{locale === 'fr' ? 'Pas encore assez de données.' : 'Not enough data yet.'}</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const label =
          kind === 'project' && row.label in dict.quote.options.projectType
            ? dict.quote.options.projectType[row.label as keyof typeof dict.quote.options.projectType]
            : row.label;
        return (
          <div key={row.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="font-semibold">{label}</span>
              <span className="text-ink-muted tabular-nums">{row.count}</span>
            </div>
            <div className="bg-line h-2 overflow-hidden rounded-full">
              <div className="bg-accent h-full rounded-full" style={{ width: `${Math.max(8, row.share * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyTrend({ locale, rows }: { locale: Locale; rows: MarketTrendRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-ink-muted mt-4">
        {locale === 'fr' ? 'Pas encore assez de données.' : 'Not enough data yet.'}
      </p>
    );
  }

  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="mt-5 grid gap-3">
      {rows.map((row) => (
        <div key={row.month} className="grid gap-2 sm:grid-cols-[150px_1fr_140px] sm:items-center">
          <p className="font-semibold">{formatMonthKey(locale, row.month)}</p>
          <div className="bg-line h-3 overflow-hidden rounded-full">
            <div
              className="bg-accent h-full rounded-full"
              style={{ width: `${Math.max(8, (row.count / maxCount) * 100)}%` }}
            />
          </div>
          <p className="text-ink-muted text-sm tabular-nums sm:text-right">
            {row.count} · {volume(locale, row.volumeM3)}
          </p>
        </div>
      ))}
    </div>
  );
}

function CityLinks({ locale, currentCity }: { locale: Locale; currentCity?: CitySlug }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {citySlugs.map((city) => (
        <Link
          key={city}
          href={cityProjectsPath(city, locale)}
          className={`border-line rounded-lg border px-4 py-3 font-semibold hover:border-accent hover:text-accent ${
            city === currentCity ? 'bg-accent-tint text-accent' : ''
          }`}
        >
          {cityPages[city].name}
        </Link>
      ))}
    </div>
  );
}

function ProjectFaqSection({ locale, faqs }: { locale: Locale; faqs: ProjectFaq[] }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5 md:p-6">
      <h2 className="text-2xl">
        {locale === 'fr' ? 'Questions fréquentes sur ces données' : 'Frequently asked questions about this data'}
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {faqs.map((faq) => (
          <article key={faq.question} className="border-line rounded-lg border p-4">
            <h3 className="font-display text-lg font-bold">{faq.question}</h3>
            <p className="text-ink-muted mt-2 leading-relaxed">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectPreviewState({
  locale,
  mode,
  city,
  service,
  archive,
}: {
  locale: Locale;
  mode: Mode;
  city?: CitySlug;
  service?: ServiceProjectKey;
  archive?: ProjectArchiveMonth;
}) {
  const cityName = city ? cityPages[city].name : null;
  const serviceName = service ? serviceProjectPages[service].shortTitle[locale] : null;
  const archiveLabel = archive ? archiveMonthLabel(locale, archive) : null;
  const context =
    serviceName && cityName
      ? `${serviceName} · ${cityName}`
      : serviceName ?? cityName ?? archiveLabel ?? (locale === 'fr' ? 'Québec' : 'Québec');

  return (
    <main className="bg-ground">
      <section className="container-page py-10 md:py-14">
        <div className="rounded-card border-line bg-surface border p-6 md:p-8">
          <p className="text-accent font-display text-sm font-bold tracking-wide uppercase">
            {locale === 'fr' ? 'Données à venir' : 'Data coming soon'}
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl">
            {locale === 'fr'
              ? `Cette page sera publiée lorsque nous aurons assez de données pour ${context}.`
              : `This page will be published once we have enough data for ${context}.`}
          </h2>
          <div className="text-ink-muted mt-5 grid gap-4 leading-relaxed md:grid-cols-2">
            <p>
              {locale === 'fr'
                ? 'BétonDispo publie seulement des tendances anonymisées lorsqu’il y a assez de projets réels pour être utile et éviter les conclusions trompeuses.'
                : 'BétonDispo only publishes anonymized trends when there are enough real projects to be useful and avoid misleading conclusions.'}
            </p>
            <p>
              {locale === 'fr'
                ? 'Aucun nom, adresse, code postal, téléphone, courriel, fournisseur, note ou identifiant interne n’est publié.'
                : 'No names, addresses, postal codes, phone numbers, emails, suppliers, notes or internal identifiers are published.'}
            </p>
          </div>

          <div className="border-line mt-6 grid gap-4 border-t pt-6 md:grid-cols-3">
            <div>
              <h3 className="font-display font-bold">
                {locale === 'fr' ? 'Information utile' : 'Useful information'}
              </h3>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                {mode === 'market'
                  ? locale === 'fr'
                    ? 'L’indice du marché affichera les tendances globales lorsque le volume de projets sera suffisant.'
                    : 'The market index will show overall trends once project volume is sufficient.'
                  : locale === 'fr'
                    ? 'Vous pouvez quand même calculer votre volume ou demander une soumission pour votre projet.'
                    : 'You can still calculate your volume or request a quote for your project.'}
              </p>
            </div>
            <div>
              <h3 className="font-display font-bold">
                {locale === 'fr' ? 'Pages déjà utiles' : 'Useful pages now'}
              </h3>
              <div className="mt-2 grid gap-1">
                <Link href={pathFor('concreteSlab', locale)} className="text-accent text-sm font-semibold hover:underline">
                  {locale === 'fr' ? 'Dalle de béton' : 'Concrete slab'}
                </Link>
                <Link href={pathFor('concretePatio', locale)} className="text-accent text-sm font-semibold hover:underline">
                  {locale === 'fr' ? 'Béton pour terrasse' : 'Concrete patio'}
                </Link>
                <Link href={pathFor('services', locale)} className="text-accent text-sm font-semibold hover:underline">
                  {locale === 'fr' ? 'Services' : 'Services'}
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={pathFor('calculator', locale)} className={buttonClass('secondary', 'md', 'w-full')}>
                {locale === 'fr' ? 'Calculer le volume' : 'Calculate volume'}
              </Link>
              <Link href={pathFor('quote', locale)} className={buttonClass('primary', 'md', 'w-full')}>
                {locale === 'fr' ? 'Obtenir une soumission' : 'Request a quote'}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <RelatedServices locale={locale} current="calculator" />
        </div>
      </section>
    </main>
  );
}

function dynamicInsight(
  locale: Locale,
  data: ProjectIntelligenceData,
  mode: Mode,
  city?: CitySlug,
  service?: ServiceProjectKey,
  archive?: ProjectArchiveMonth,
): { text: string; signals: string[] } {
  const { stats, market } = data;
  const dict = getDictionary(locale);
  const place = city
    ? cityPages[city].name
    : service
      ? serviceProjectPages[service].shortTitle[locale]
      : archive
        ? archiveMonthLabel(locale, archive)
      : locale === 'fr'
        ? 'les secteurs desservis'
        : 'served areas';

  if (stats.totalProjects === 0) {
    return {
      text:
        locale === 'fr'
          ? `Les premières statistiques publiques pour ${place} apparaîtront lorsque des demandes qualifiées seront disponibles. La page est déjà prête à se mettre à jour automatiquement avec des données anonymisées.`
          : `The first public statistics for ${place} will appear once qualified requests are available. This page is already ready to update automatically with anonymized data.`,
      signals: [
        locale === 'fr' ? 'Aucune donnée personnelle publiée' : 'No personal data published',
        locale === 'fr' ? 'Mise à jour par le CRM' : 'CRM-powered updates',
        locale === 'fr' ? 'Soumission et calculateur disponibles' : 'Quote and calculator available',
      ],
    };
  }

  const top = stats.topProjectType
    ? dict.quote.options.projectType[stats.topProjectType]
    : locale === 'fr'
      ? 'les projets de béton'
      : 'concrete projects';
  const avgVolume = stats.averageVolumeM3 === null ? '—' : volume(locale, stats.averageVolumeM3);
  const largestVolume = stats.largestVolumeM3 === null ? '—' : volume(locale, stats.largestVolumeM3);
  const response = minutes(locale, stats.averageResponseMinutes);
  const marketSentence =
    mode === 'market' && market
      ? locale === 'fr'
        ? `${market.projectsThisMonth} projet(s) sont visibles ce mois-ci et ${market.projectsThisYear} depuis le début de l’année.`
        : `${market.projectsThisMonth} project(s) are visible this month and ${market.projectsThisYear} since the start of the year.`
      : null;
  const archiveSentence =
    mode === 'archive' && archive
      ? locale === 'fr'
        ? `Cette archive regroupe les demandes qualifiées du mois de ${archiveMonthLabel(locale, archive)}.`
        : `This archive groups qualified requests from ${archiveMonthLabel(locale, archive)}.`
      : null;
  const localitySentence =
    city && service
      ? locale === 'fr'
        ? `La page combine le signal local de ${cityPages[city].name} avec le type de projet ${serviceProjectPages[service].shortTitle[locale].toLowerCase()}.`
        : `This page combines the local signal for ${cityPages[city].name} with the ${serviceProjectPages[service].shortTitle[locale].toLowerCase()} project type.`
      : null;

  const text =
    locale === 'fr'
      ? [
          `${stats.totalProjects} projet(s) qualifié(s) alimentent cette page.`,
          `${top} ressort comme type de demande important, avec un volume moyen de ${avgVolume}.`,
          stats.busiestCity ? `${stats.busiestCity} est actuellement le secteur le plus actif.` : null,
          marketSentence,
          archiveSentence,
          localitySentence,
        ]
          .filter(Boolean)
          .join(' ')
      : [
          `${stats.totalProjects} qualified project(s) power this page.`,
          `${top} stands out as an important request type, with an average volume of ${avgVolume}.`,
          stats.busiestCity ? `${stats.busiestCity} is currently the most active area.` : null,
          marketSentence,
          archiveSentence,
          localitySentence,
        ]
          .filter(Boolean)
          .join(' ');

  return {
    text,
    signals: [
      locale === 'fr' ? `Volume max: ${largestVolume}` : `Largest volume: ${largestVolume}`,
      locale === 'fr' ? `Réponse moyenne: ${response}` : `Average response: ${response}`,
      locale === 'fr' ? 'Données anonymisées' : 'Anonymized data',
    ],
  };
}

function projectIntelligenceFaqs(
  locale: Locale,
  mode: Mode,
  city?: CitySlug,
  service?: ServiceProjectKey,
  archive?: ProjectArchiveMonth,
): ProjectFaq[] {
  const dict = getDictionary(locale);
  const cityName = city ? cityPages[city].name : locale === 'fr' ? 'votre ville' : 'your city';
  const serviceName = service
    ? serviceProjectPages[service].shortTitle[locale].toLowerCase()
    : locale === 'fr'
      ? 'béton'
      : 'concrete';
  const archiveLabel = archive ? archiveMonthLabel(locale, archive) : null;

  const privacy =
    locale === 'fr'
      ? {
          question: 'Est-ce que ces projets proviennent de vrais clients?',
          answer:
            'Oui. Les données proviennent de demandes qualifiées ou gagnées dans BétonDispo, mais elles sont anonymisées avant publication. Aucun nom, adresse, téléphone, courriel, fournisseur, note ou identifiant interne n’est affiché.',
        }
      : {
          question: 'Do these projects come from real customers?',
          answer:
            'Yes. The data comes from qualified or won BétonDispo requests, but it is anonymized before publication. No names, addresses, phone numbers, emails, suppliers, notes or internal identifiers are shown.',
        };

  const estimate =
    locale === 'fr'
      ? {
          question: 'Puis-je utiliser ces volumes pour commander mon béton?',
          answer:
            'Ces volumes donnent un repère utile, mais chaque chantier est différent. Utilisez le calculateur de béton ou demandez une soumission pour confirmer la quantité adaptée à votre projet.',
        }
      : {
          question: 'Can I use these volumes to order my concrete?',
          answer:
            'These volumes are useful benchmarks, but every site is different. Use the concrete calculator or request a quote to confirm the amount that fits your project.',
        };

  const freshness =
    locale === 'fr'
      ? {
          question: 'À quelle fréquence ces pages se mettent-elles à jour?',
          answer:
            'Les pages sont alimentées par le CRM. Lorsqu’une demande admissible est créée, qualifiée ou gagnée, les statistiques publiques peuvent changer automatiquement.',
        }
      : {
          question: 'How often are these pages updated?',
          answer:
            'The pages are powered by the CRM. When an eligible request is created, qualified or won, the public statistics can update automatically.',
        };

  const modeSpecific: ProjectFaq =
    mode === 'market'
      ? locale === 'fr'
        ? {
            question: 'Est-ce que l’indice du marché montre les prix du béton?',
            answer:
              'Non. L’indice présente la demande observée par BétonDispo: volumes, villes actives, types de projets et tendances. Il ne remplace pas une soumission de prix.',
          }
        : {
            question: 'Does the market index show concrete prices?',
            answer:
              'No. The index shows demand observed by BétonDispo: volumes, active cities, project types and trends. It does not replace a price quote.',
          }
      : mode === 'archive' && archiveLabel
        ? locale === 'fr'
          ? {
              question: `Que contient l’archive ${archiveLabel}?`,
              answer:
                'Cette archive regroupe les projets publics admissibles du mois sélectionné. Elle aide à suivre la demande locale sans publier de renseignements personnels.',
            }
          : {
              question: `What is included in the ${archiveLabel} archive?`,
              answer:
                'This archive groups eligible public projects from the selected month. It helps track local demand without publishing personal information.',
            }
      : mode === 'city' || mode === 'cityService'
        ? locale === 'fr'
          ? {
              question: `Comment interpréter les projets à ${cityName}?`,
              answer: `Les projets affichés donnent une idée de l’activité récente à ${cityName}. Ils peuvent aider à comparer les volumes typiques et à préparer une demande de soumission.`,
            }
          : {
              question: `How should I interpret projects in ${cityName}?`,
              answer: `The displayed projects show recent activity in ${cityName}. They can help compare typical volumes and prepare a quote request.`,
            }
      : mode === 'service'
        ? locale === 'fr'
          ? {
              question: `Ces statistiques couvrent-elles tous les projets de ${serviceName}?`,
              answer:
                'Elles couvrent les demandes admissibles reçues par BétonDispo, pas tout le marché. Elles restent utiles pour voir les volumes et villes les plus fréquents.',
            }
          : {
              question: `Do these statistics cover every ${serviceName} project?`,
              answer:
                'They cover eligible requests received by BétonDispo, not the entire market. They are still useful for seeing common volumes and active cities.',
            }
        : locale === 'fr'
          ? {
              question: 'Pourquoi certains projets sont-ils en planification?',
              answer:
                'Un projet peut être publié comme signal anonymisé lorsqu’il est qualifié, même avant d’être complété. Les projets gagnés apparaissent comme complétés.',
            }
          : {
              question: 'Why are some projects shown as in planning?',
              answer:
                'A project can be published as an anonymized signal once it is qualified, even before completion. Won projects appear as completed.',
            };

  return [
    privacy,
    modeSpecific,
    estimate,
    freshness,
    locale === 'fr'
      ? {
          question: 'Comment puis-je obtenir une estimation pour mon projet?',
          answer: `Choisissez le type de projet, calculez le volume approximatif en m³, puis envoyez une demande de soumission. BétonDispo utilise ces informations pour mieux orienter votre demande. Les types comme ${dict.quote.options.projectType.SLAB.toLowerCase()} ou ${dict.quote.options.projectType.GARAGE.toLowerCase()} sont souvent calculés à partir de longueur, largeur et épaisseur.`,
        }
      : {
          question: 'How can I get an estimate for my project?',
          answer: `Choose the project type, calculate the approximate volume in m³, then send a quote request. BétonDispo uses that information to route your request more effectively. Types like ${dict.quote.options.projectType.SLAB.toLowerCase()} or ${dict.quote.options.projectType.GARAGE.toLowerCase()} are often calculated from length, width and thickness.`,
        },
  ];
}

function volume(locale: Locale, value: number): string {
  return `${new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    maximumFractionDigits: 2,
  }).format(value)} m³`;
}

function minutes(locale: Locale, value: number | null): string {
  if (value === null) return '—';
  const rounded = Math.round(value);
  if (rounded < 60) return locale === 'fr' ? `${rounded} min` : `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return locale === 'fr' ? `${hours} h ${mins} min` : `${hours} h ${mins} min`;
}

function formatMonth(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Toronto',
  }).format(date);
}

function formatMonthKey(locale: Locale, key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function statusLabel(locale: Locale, status: PublicProject['status']): string {
  if (status === 'completed') return locale === 'fr' ? 'Complété' : 'Completed';
  return locale === 'fr' ? 'En planification' : 'In planning';
}

function collectionSchema(
  locale: Locale,
  name: string,
  description: string,
  path: string,
  projects: PublicProject[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    url: absoluteUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: projects.slice(0, 12).map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: `${project.projectType} · ${project.city}`,
          description: `${project.city}, ${project.volumeM3 ?? 'unknown'} m3, ${formatMonth(locale, project.createdAt)}`,
        },
      })),
    },
  };
}

function projectFaqSchema(faqs: ProjectFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

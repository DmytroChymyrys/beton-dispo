import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { getAnalyticsReport, type AnalyticsFilters, type AnalyticsGroupRow, type AnalyticsLeadRow } from '@/server/admin-queries';
import { CUSTOMER_TYPES, PROJECT_TYPES, QUOTE_STATUSES } from '@/lib/quote-options';
import type { CustomerType, ProjectType, QuoteStatus } from '@/lib/quote-options';
import { adminOptions, formatDateTime, formatPercent, formatVolume } from '@/app/admin/labels';
import { getAdminLocale } from '@/app/admin/locale';
import { StatusBadge } from '@/app/admin/StatusBadge';
import { AnalyticsCharts } from './AnalyticsCharts';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DEVICE_CATEGORIES = ['mobile', 'tablet', 'desktop'] as const;
const RANGES = ['today', 'yesterday', '7d', '30d', 'month', 'previous_month', 'all', 'custom'] as const;
type RangeKey = (typeof RANGES)[number];

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function datePart(date: Date, timeZone = 'America/Toronto'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '01';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function monthStart(isoDate: string): string {
  return `${isoDate.slice(0, 8)}01`;
}

function previousMonthStart(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 8)}01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 10);
}

function dateBoundary(isoDate: string, end = false): Date {
  return new Date(`${isoDate}T${end ? '23:59:59.999' : '00:00:00.000'}-04:00`);
}

function parseFilters(params: Record<string, string | string[] | undefined>): {
  filters: AnalyticsFilters;
  range: RangeKey;
  from: string;
  to: string;
} {
  const today = datePart(new Date());
  const requestedRange = oneOf<RangeKey>(first(params.range), RANGES) ?? '30d';
  let from = first(params.from);
  let to = first(params.to);

  if (requestedRange !== 'custom') {
    if (requestedRange === 'today') {
      from = today;
      to = today;
    } else if (requestedRange === 'yesterday') {
      from = addDays(today, -1);
      to = from;
    } else if (requestedRange === '7d') {
      from = addDays(today, -6);
      to = today;
    } else if (requestedRange === '30d') {
      from = addDays(today, -29);
      to = today;
    } else if (requestedRange === 'month') {
      from = monthStart(today);
      to = today;
    } else if (requestedRange === 'previous_month') {
      from = previousMonthStart(today);
      to = addDays(monthStart(today), -1);
    } else {
      from = '';
      to = '';
    }
  }

  const safeFrom = from && ISO_DATE.test(from) ? from : '';
  const safeTo = to && ISO_DATE.test(to) ? to : '';

  return {
    range: requestedRange,
    from: safeFrom,
    to: safeTo,
    filters: {
      from: safeFrom ? dateBoundary(safeFrom) : undefined,
      to: safeTo ? dateBoundary(safeTo, true) : undefined,
      source: first(params.source)?.slice(0, 120),
      medium: first(params.medium)?.slice(0, 120),
      campaign: first(params.campaign)?.slice(0, 160),
      gclidPresent:
        first(params.gclid) === 'yes' ? true : first(params.gclid) === 'no' ? false : undefined,
      locale: oneOf(first(params.locale), ['fr', 'en']),
      projectType: oneOf<ProjectType>(first(params.projectType), PROJECT_TYPES),
      city: first(params.city)?.slice(0, 120),
      status: oneOf<QuoteStatus>(first(params.status), QUOTE_STATUSES),
      customerType: oneOf<CustomerType>(first(params.customerType), CUSTOMER_TYPES),
      deviceCategory: oneOf(first(params.deviceCategory), DEVICE_CATEGORIES),
      landingPage: first(params.landingPage)?.slice(0, 512),
    },
  };
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const locale = await getAdminLocale();
  const options = adminOptions(locale);
  const params = await searchParams;
  const parsed = parseFilters(params);
  const report = await getAnalyticsReport(parsed.filters);
  const t = copy[locale];

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t.title}</h1>
          <p className="text-ink-muted mt-1 max-w-2xl">{t.intro}</p>
        </div>
        <Link
          href={`/admin/analytics/export?${new URLSearchParams(params as Record<string, string>).toString()}`}
          className="border-line-strong hover:bg-surface-sunken inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold"
        >
          {t.export}
        </Link>
      </div>

      <Filters t={t} parsed={parsed} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t.quotes} value={report.kpis.total} />
        <Kpi label={t.open} value={report.kpis.open} />
        <Kpi label={t.won} value={report.kpis.won} note={formatPercent(report.kpis.winRate, locale)} />
        <Kpi label={t.volume} value={`${report.kpis.totalVolumeM3.toFixed(2)} m³`} />
        <Kpi label={t.avgResponse} value={formatMinutes(report.kpis.averageResponseMinutes, locale)} />
        <Kpi label={t.medianResponse} value={formatMinutes(report.kpis.medianResponseMinutes, locale)} />
        <Kpi label={t.withinHour} value={ratioLabel(report.kpis.respondedWithin60, locale)} />
        <Kpi label={t.revenue} value={money(report.kpis.betondispoRevenueCad, locale)} />
      </section>

      <AnalyticsCharts
        funnel={report.funnel}
        bySource={report.bySource}
        byLandingPage={report.byLandingPage}
        byProject={labelProjectRows(report.byProjectType, options.projectType)}
        byCity={report.byCity}
        gclidSplit={report.gclidSplit}
        labels={{
          funnel: t.funnel,
          sources: t.bySource,
          landingPages: t.byLandingPage,
          projectsCities: t.projectsCities,
          projects: t.byProject,
          cities: t.byCity,
          googleAds: t.gclidSplit,
          leads: t.leads,
          won: t.won,
          noData: t.noData,
        }}
      />

      <LeadTable
        title={t.googleAds}
        rows={report.googleAdsLeads}
        locale={locale}
        options={options}
        empty={t.noData}
      />

      <LeadTable
        title={t.requests}
        rows={report.requestRows}
        locale={locale}
        options={options}
        empty={t.noData}
      />
    </div>
  );
}

function Filters({
  t,
  parsed,
}: {
  t: (typeof copy)[keyof typeof copy];
  parsed: ReturnType<typeof parseFilters>;
}) {
  return (
    <form method="get" action="/admin/analytics" className="rounded-card border-line bg-surface grid gap-4 border p-5 md:grid-cols-3 xl:grid-cols-6">
      <Field label={t.range}>
        <select name="range" defaultValue={parsed.range} className={inputClass}>
          {RANGES.map((range) => (
            <option key={range} value={range}>
              {t.ranges[range]}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.from}>
        <input type="date" name="from" defaultValue={parsed.from} className={inputClass} />
      </Field>
      <Field label={t.to}>
        <input type="date" name="to" defaultValue={parsed.to} className={inputClass} />
      </Field>
      <Field label={t.source}>
        <input name="source" defaultValue={parsed.filters.source ?? ''} className={inputClass} />
      </Field>
      <Field label={t.medium}>
        <input name="medium" defaultValue={parsed.filters.medium ?? ''} className={inputClass} />
      </Field>
      <Field label={t.campaign}>
        <input name="campaign" defaultValue={parsed.filters.campaign ?? ''} className={inputClass} />
      </Field>
      <Field label={t.gclid}>
        <select name="gclid" defaultValue={parsed.filters.gclidPresent === true ? 'yes' : parsed.filters.gclidPresent === false ? 'no' : ''} className={inputClass}>
          <option value="">{t.all}</option>
          <option value="yes">{t.gclidYes}</option>
          <option value="no">{t.gclidNo}</option>
        </select>
      </Field>
      <Field label={t.locale}>
        <select name="locale" defaultValue={parsed.filters.locale ?? ''} className={inputClass}>
          <option value="">{t.all}</option>
          <option value="fr">fr</option>
          <option value="en">en</option>
        </select>
      </Field>
      <Field label={t.project}>
        <select name="projectType" defaultValue={parsed.filters.projectType ?? ''} className={inputClass}>
          <option value="">{t.all}</option>
          {PROJECT_TYPES.map((project) => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
      </Field>
      <Field label={t.city}>
        <input name="city" defaultValue={parsed.filters.city ?? ''} className={inputClass} />
      </Field>
      <Field label={t.status}>
        <select name="status" defaultValue={parsed.filters.status ?? ''} className={inputClass}>
          <option value="">{t.all}</option>
          {QUOTE_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </Field>
      <Field label={t.landingPage}>
        <input name="landingPage" defaultValue={parsed.filters.landingPage ?? ''} className={inputClass} />
      </Field>
      <div className="flex items-end gap-2 xl:col-span-6">
        <button className="bg-accent hover:bg-accent-hover inline-flex min-h-11 items-center rounded-lg px-5 font-semibold text-white">
          {t.apply}
        </button>
        <Link href="/admin/analytics" className="border-line-strong hover:bg-surface-sunken inline-flex min-h-11 items-center rounded-lg border px-5 font-semibold">
          {t.reset}
        </Link>
      </div>
    </form>
  );
}

const inputClass = 'min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm font-semibold">
      <span className="block">{label}</span>
      {children}
    </label>
  );
}

function Kpi({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-card border-line bg-surface border p-5">
      <p className="text-ink-muted text-sm">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums">{value}</p>
      {note ? <p className="text-ink-muted mt-1 text-xs">{note}</p> : null}
    </div>
  );
}

function LeadTable({
  title,
  rows,
  locale,
  options,
  empty,
}: {
  title: string;
  rows: AnalyticsLeadRow[];
  locale: 'fr' | 'en';
  options: ReturnType<typeof adminOptions>;
  empty: string;
}) {
  return (
    <section className="rounded-card border-line bg-surface overflow-x-auto border">
      <h2 className="border-line bg-surface-sunken border-b px-5 py-4 text-lg">{title}</h2>
      <table className="w-full min-w-[76rem] text-sm">
        <thead className="text-ink-muted text-left">
          <tr>
            <Th>Request</Th>
            <Th>Created</Th>
            <Th>Customer</Th>
            <Th>Project</Th>
            <Th>City</Th>
            <Th>Quantity</Th>
            <Th>Desired</Th>
            <Th>Source</Th>
            <Th>Landing</Th>
            <Th>GCLID</Th>
            <Th>Status</Th>
            <Th>Response</Th>
            <Th>Revenue</Th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.length === 0 ? (
            <tr><td colSpan={13} className="text-ink-muted px-4 py-6 text-center">{empty}</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">
                <Link href={`/admin/requests/${row.id}`} className="text-accent font-bold hover:underline">
                  {row.publicId}
                </Link>
              </td>
              <td className="text-ink-muted px-4 py-3 whitespace-nowrap tabular-nums">{formatDateTime(row.createdAt, locale)}</td>
              <td className="px-4 py-3">{options.customerType[row.customerType]}</td>
              <td className="px-4 py-3">{options.projectType[row.projectType as keyof typeof options.projectType] ?? row.projectType}</td>
              <td className="px-4 py-3">{row.city}</td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatVolume(row.estimatedVolumeM3, row.volumeUnknown, locale)}</td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{row.desiredDate}</td>
              <td className="px-4 py-3">{[row.source, row.medium, row.campaign].filter(Boolean).join(' / ') || 'Unknown'}</td>
              <td className="px-4 py-3">{row.landingPage}</td>
              <td className="px-4 py-3">{row.hasGclid ? 'Google Ads' : '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={row.status} locale={locale} /></td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatMinutes(row.responseMinutes, locale)}</td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{money(Number(row.revenueCad ?? 0), locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold tracking-wider uppercase">{children}</th>;
}

function formatMinutes(value: number | null, locale: 'fr' | 'en'): string {
  if (value == null) return '—';
  if (value < 60) return locale === 'fr' ? `${Math.round(value)} min` : `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return locale === 'fr' ? `${hours} h ${minutes} min` : `${hours} h ${minutes} min`;
}

function ratioLabel(value: number | null, locale: 'fr' | 'en'): string {
  return value == null ? '—' : formatPercent(value, locale);
}

function money(value: number, locale: 'fr' | 'en'): string {
  if (!value) return '—';
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

function labelProjectRows(
  rows: AnalyticsGroupRow[],
  labels: ReturnType<typeof adminOptions>['projectType'],
): AnalyticsGroupRow[] {
  return rows.map((row) => ({ ...row, label: labels[row.label as keyof typeof labels] ?? row.label }));
}

const copy = {
  fr: {
    title: 'Analytics',
    intro: 'Tableau interne basé sur Postgres pour comprendre les demandes, les sources, les pages et les résultats.',
    export: 'Exporter CSV',
    range: 'Période',
    from: 'Du',
    to: 'Au',
    source: 'Source',
    medium: 'Médium',
    campaign: 'Campagne',
    gclid: 'GCLID',
    gclidYes: 'Présent',
    gclidNo: 'Absent',
    locale: 'Langue',
    project: 'Projet',
    city: 'Ville',
    status: 'Statut',
    landingPage: 'Page d’arrivée',
    all: 'Tous',
    apply: 'Appliquer',
    reset: 'Réinitialiser',
    quotes: 'Demandes',
    open: 'Ouvertes',
    won: 'Gagnées',
    volume: 'Volume total',
    avgResponse: 'Réponse moyenne',
    medianResponse: 'Réponse médiane',
    withinHour: 'Répondu < 1 h',
    revenue: 'Revenu BétonDispo',
    funnel: 'Entonnoir',
    ofSubmitted: 'des demandes',
    bySource: 'Demandes par source / médium',
    byCampaign: 'Demandes par campagne',
    byLandingPage: 'Pages d’arrivée',
    byQuoteEntryPage: 'Pages d’entrée soumission',
    byProject: 'Demandes par projet',
    byCity: 'Demandes par ville',
    byDevice: 'Demandes par appareil',
    projectsCities: 'Projets et villes',
    leads: 'Demandes',
    gclidSplit: 'Google Ads identifié',
    googleAds: 'Demandes attribuées Google Ads',
    requests: 'Table analytique des demandes',
    noData: 'Aucune donnée.',
    ranges: {
      today: 'Aujourd’hui',
      yesterday: 'Hier',
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      month: 'Mois courant',
      previous_month: 'Mois précédent',
      custom: 'Personnalisée',
      all: 'Tout',
    },
  },
  en: {
    title: 'Analytics',
    intro: 'Internal Postgres-backed reporting for quote volume, acquisition sources, landing pages, and outcomes.',
    export: 'Export CSV',
    range: 'Range',
    from: 'From',
    to: 'To',
    source: 'Source',
    medium: 'Medium',
    campaign: 'Campaign',
    gclid: 'GCLID',
    gclidYes: 'Present',
    gclidNo: 'Absent',
    locale: 'Language',
    project: 'Project',
    city: 'City',
    status: 'Status',
    landingPage: 'Landing page',
    all: 'All',
    apply: 'Apply',
    reset: 'Reset',
    quotes: 'Quotes',
    open: 'Open',
    won: 'Won',
    volume: 'Total volume',
    avgResponse: 'Avg response',
    medianResponse: 'Median response',
    withinHour: 'Responded < 1 h',
    revenue: 'BétonDispo revenue',
    funnel: 'Funnel',
    ofSubmitted: 'of submitted',
    bySource: 'Leads by source / medium',
    byCampaign: 'Leads by campaign',
    byLandingPage: 'Landing pages',
    byQuoteEntryPage: 'Quote entry pages',
    byProject: 'Leads by project',
    byCity: 'Leads by city',
    byDevice: 'Leads by device',
    projectsCities: 'Projects and cities',
    leads: 'Leads',
    gclidSplit: 'Google Ads identified',
    googleAds: 'Google Ads-attributed leads',
    requests: 'Analytics request table',
    noData: 'No data.',
    ranges: {
      today: 'Today',
      yesterday: 'Yesterday',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      month: 'Current month',
      previous_month: 'Previous month',
      custom: 'Custom',
      all: 'All time',
    },
  },
} as const;

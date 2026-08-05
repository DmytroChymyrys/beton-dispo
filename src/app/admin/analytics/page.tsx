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
    <div className="container-page max-w-[1500px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{t.title}</h1>
          <p className="text-ink-muted mt-1 max-w-2xl">{t.intro}</p>
          <p className="text-ink-muted mt-1 text-xs">{t.updated(formatDateTime(new Date(), locale))}</p>
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
        <Kpi label={t.quotes} value={report.kpis.total} tone="accent" note={t.filteredPeriod} />
        <Kpi label={t.open} value={report.kpis.open} />
        <Kpi label={t.won} value={report.kpis.won} tone="success" note={formatPercent(report.kpis.winRate, locale)} />
        <Kpi label={t.revenue} value={money(report.kpis.betondispoRevenueCad, locale)} tone="success" note={!report.kpis.betondispoRevenueCad ? t.noRevenue : undefined} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t.volume} value={`${report.kpis.totalVolumeM3.toFixed(2)} m³`} quiet />
        <Kpi label={t.avgResponse} value={formatMinutes(report.kpis.averageResponseMinutes, locale)} quiet note={responseSample(report.kpis.contacted, t.respondedSample)} />
        <Kpi label={t.medianResponse} value={formatMinutes(report.kpis.medianResponseMinutes, locale)} quiet />
        <Kpi label={t.withinHour} value={ratioLabel(report.kpis.respondedWithin60, locale)} quiet note={responseSample(report.kpis.contacted, t.respondedSample)} />
      </section>

      <section className="rounded-card border-line bg-surface border p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{t.advertising}</h2>
            <p className="text-ink-muted mt-1 text-sm">{t.advertisingNote}</p>
          </div>
          <Link href="/admin/integrations/google-ads" className="text-accent text-sm font-semibold hover:underline">
            {t.googleAdsSettings}
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MiniKpi label={t.adSpend} value={moneyValue(report.advertising.spendCad, locale)} />
          <MiniKpi label={t.clicks} value={report.advertising.clicks} note={formatNullablePercent(report.advertising.ctr, locale)} />
          <MiniKpi label={t.avgCpc} value={moneyNullable(report.advertising.averageCpcCad, locale)} />
          <MiniKpi label={t.costPerQuote} value={moneyNullable(report.advertising.costPerQuoteCad, locale)} note={`${report.advertising.gclidQuotes} ${t.gclidQuotes}`} />
          <MiniKpi label={t.costPerQualified} value={moneyNullable(report.advertising.costPerQualifiedLeadCad, locale)} note={`${report.advertising.gclidQualifiedLeads} ${t.qualifiedLeadCount}`} />
          <MiniKpi label={t.roas} value={ratioNullable(report.advertising.betondispoRevenueRoas, locale)} note={t.roasBasis} />
        </div>
      </section>

      <AnalyticsCharts
        trend={report.quotesOverTime}
        funnel={report.funnel}
        byStatus={report.byStatus}
        bySource={report.bySource}
        byLandingPage={report.byLandingPage}
        byProject={labelProjectRows(report.byProjectType, options.projectType)}
        byCity={report.byCity}
        gclidSplit={report.gclidSplit}
        labels={{
          funnel: t.funnel,
          status: t.statusBreakdown,
          source: t.bySource,
          landingPages: t.byLandingPage,
          projects: t.byProject,
          cities: t.byCity,
          googleAds: t.gclidSplit,
          googleAdsEmpty: t.googleAdsEmpty,
          googleAdsHelp: t.googleAdsHelp,
          trend: t.trend,
          quotes: t.quotes,
          winRate: t.winRate,
          volume: t.volume,
          attributed: t.attributed,
          unattributed: t.unattributed,
          ofLeads: t.ofLeads,
          won: t.won,
          noData: t.noData,
          notEnoughActivity: t.notEnoughActivity,
        }}
      />

      <CampaignTable
        title={t.campaignPerformance}
        rows={report.advertising.campaigns}
        locale={locale}
        empty={t.noData}
      />

      <LeadTable
        title={t.googleAds}
        rows={report.googleAdsLeads}
        locale={locale}
        options={options}
        empty={t.noData}
        googleAds
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
  const advancedCount = [
    parsed.filters.medium,
    parsed.filters.campaign,
    parsed.filters.gclidPresent !== undefined,
    parsed.filters.locale,
    parsed.filters.landingPage,
    parsed.filters.customerType,
    parsed.filters.deviceCategory,
  ].filter(Boolean).length;
  const activeFilters = [
    parsed.range !== '30d' ? [t.range, t.ranges[parsed.range]] : null,
    parsed.filters.source ? [t.source, parsed.filters.source] : null,
    parsed.filters.projectType ? [t.project, parsed.filters.projectType] : null,
    parsed.filters.city ? [t.city, parsed.filters.city] : null,
    parsed.filters.status ? [t.status, parsed.filters.status] : null,
    parsed.filters.medium ? [t.medium, parsed.filters.medium] : null,
    parsed.filters.campaign ? [t.campaign, parsed.filters.campaign] : null,
    parsed.filters.gclidPresent !== undefined
      ? [t.gclid, parsed.filters.gclidPresent ? t.gclidYes : t.gclidNo]
      : null,
    parsed.filters.locale ? [t.locale, parsed.filters.locale] : null,
    parsed.filters.landingPage ? [t.landingPage, parsed.filters.landingPage] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <form method="get" action="/admin/analytics" className="rounded-card border-line bg-surface border p-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1fr_auto_auto] xl:items-end">
        <Field label={t.range}>
          <select name="range" defaultValue={parsed.range} className={inputClass}>
            {RANGES.map((range) => (
              <option key={range} value={range}>
                {t.ranges[range]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.source}>
          <input name="source" defaultValue={parsed.filters.source ?? ''} className={inputClass} />
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
        <Link href="/admin/analytics" className="border-line-strong hover:bg-surface-sunken inline-flex min-h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold">
          {t.reset}
        </Link>
        <button className="bg-accent hover:bg-accent-hover inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white">
          {t.apply}
        </button>
      </div>

      {parsed.range === 'custom' ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-md">
          <Field label={t.from}>
            <input type="date" name="from" defaultValue={parsed.from} className={inputClass} />
          </Field>
          <Field label={t.to}>
            <input type="date" name="to" defaultValue={parsed.to} className={inputClass} />
          </Field>
        </div>
      ) : null}

      <details className="mt-3">
        <summary className="text-ink-soft hover:text-ink cursor-pointer text-sm font-semibold">
          {t.moreFilters}{advancedCount ? ` (${advancedCount})` : ''}
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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
          <Field label={t.landingPage}>
            <input name="landingPage" defaultValue={parsed.filters.landingPage ?? ''} className={inputClass} />
          </Field>
        </div>
      </details>

      {activeFilters.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFilters.map(([label, value]) => (
            <span key={`${label}:${value}`} className="border-line bg-surface-sunken text-ink-muted rounded-full border px-3 py-1 text-xs">
              {label}: <span className="text-ink-soft">{value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </form>
  );
}

const inputClass = 'min-h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm font-semibold">
      <span className="block">{label}</span>
      {children}
    </label>
  );
}

function Kpi({
  label,
  value,
  note,
  tone = 'neutral',
  quiet = false,
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: 'neutral' | 'accent' | 'success';
  quiet?: boolean;
}) {
  const toneClass =
    tone === 'accent' ? 'text-accent' : tone === 'success' ? 'text-success' : 'text-ink';
  return (
    <div className={`rounded-card border-line bg-surface border ${quiet ? 'p-4' : 'p-5'}`}>
      <p className="text-ink-muted text-sm">{label}</p>
      <p className={`mt-2 font-extrabold tabular-nums ${quiet ? 'text-2xl' : 'text-3xl'} ${toneClass}`}>
        {value}
      </p>
      {note ? <p className="text-ink-muted mt-1 text-xs">{note}</p> : null}
    </div>
  );
}

function MiniKpi({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="bg-surface-sunken rounded-lg p-4">
      <p className="text-ink-muted text-xs font-bold tracking-wide uppercase">{label}</p>
      <p className="mt-2 text-xl font-extrabold tabular-nums">{value}</p>
      {note ? <p className="text-ink-muted mt-1 text-xs">{note}</p> : null}
    </div>
  );
}

function CampaignTable({
  title,
  rows,
  locale,
  empty,
}: {
  title: string;
  rows: {
    campaignId: string;
    campaignName: string;
    campaignStatus: string | null;
    campaignType: string | null;
    spendCad: number;
    impressions: number;
    clicks: number;
    ctr: number | null;
    averageCpcCad: number | null;
    googleReportedConversions: number;
    googleReportedConversionValue: number;
  }[];
  locale: 'fr' | 'en';
  empty: string;
}) {
  return (
    <section className="rounded-card border-line bg-surface overflow-x-auto border">
      <h2 className="border-line bg-surface-sunken border-b px-5 py-4 text-lg">{title}</h2>
      <table className="w-full min-w-[70rem] text-sm">
        <thead className="text-ink-muted text-left">
          <tr>
            <Th>Campaign</Th>
            <Th>Status</Th>
            <Th>Spend</Th>
            <Th>Impressions</Th>
            <Th>Clicks</Th>
            <Th>CTR</Th>
            <Th>Avg CPC</Th>
            <Th>Google conv.</Th>
            <Th>Google value</Th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.campaignId} className="hover:bg-surface-sunken">
                <td className="px-4 py-3">
                  <span className="block font-bold">{row.campaignName}</span>
                  <span className="text-ink-muted text-xs">{row.campaignId}</span>
                </td>
                <td className="px-4 py-3">{row.campaignStatus ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{moneyValue(row.spendCad, locale)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.clicks.toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatNullablePercent(row.ctr, locale)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{moneyNullable(row.averageCpcCad, locale)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.googleReportedConversions.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{moneyValue(row.googleReportedConversionValue, locale)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="text-ink-muted px-4 py-6 text-center" colSpan={9}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="text-ink-muted border-line border-t px-5 py-3 text-xs">
        Internal CRM leads are account-level unless Google Ads provides a reliable campaign-to-lead join.
      </p>
    </section>
  );
}

function LeadTable({
  title,
  rows,
  locale,
  options,
  empty,
  googleAds = false,
}: {
  title: string;
  rows: AnalyticsLeadRow[];
  locale: 'fr' | 'en';
  options: ReturnType<typeof adminOptions>;
  empty: string;
  googleAds?: boolean;
}) {
  return (
    <section className="rounded-card border-line bg-surface overflow-x-auto border">
      <h2 className="border-line bg-surface-sunken border-b px-5 py-4 text-lg">{title}</h2>
      {googleAds && rows.length === 0 ? (
        <p className="text-ink-muted px-5 py-6 text-sm">{empty}</p>
      ) : null}
      <table className="w-full min-w-[62rem] text-sm">
        <thead className="text-ink-muted text-left">
          <tr>
            <Th>Request</Th>
            <Th>Created</Th>
            {!googleAds ? <Th>Customer</Th> : null}
            <Th>Project</Th>
            <Th>City</Th>
            <Th>Quantity</Th>
            <Th>Source</Th>
            <Th>Status</Th>
            <Th>Response</Th>
            <Th>Revenue</Th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {rows.length === 0 ? (
            <tr><td colSpan={googleAds ? 9 : 10} className="text-ink-muted px-4 py-6 text-center">{empty}</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-sunken">
              <td className="bg-surface sticky left-0 px-4 py-3">
                <Link href={`/admin/requests/${row.id}`} className="text-accent font-bold hover:underline">
                  {row.publicId}
                </Link>
              </td>
              <td className="text-ink-muted px-4 py-3 whitespace-nowrap tabular-nums">{formatDateTime(row.createdAt, locale)}</td>
              {!googleAds ? <td className="px-4 py-3">{options.customerType[row.customerType]}</td> : null}
              <td className="px-4 py-3">{options.projectType[row.projectType as keyof typeof options.projectType] ?? row.projectType}</td>
              <td className="px-4 py-3">{row.city}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{formatVolume(row.estimatedVolumeM3, row.volumeUnknown, locale)}</td>
              <td className="px-4 py-3"><SourceBadge row={row} /></td>
              <td className="px-4 py-3"><StatusBadge status={row.status} locale={locale} /></td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatMinutes(row.responseMinutes, locale)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{money(Number(row.revenueCad ?? 0), locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SourceBadge({ row }: { row: AnalyticsLeadRow }) {
  const source = (row.source ?? '').toLowerCase();
  const medium = (row.medium ?? '').toLowerCase();
  let label = 'Unknown';
  let cls = 'bg-surface-sunken text-ink-muted border-line-strong';
  if (row.hasGclid) {
    label = 'Google Ads';
    cls = 'bg-success/10 text-success border-success/30';
  } else if (medium === 'organic') {
    label = 'Organic';
    cls = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (source === 'direct' || medium === 'none') {
    label = 'Direct';
  } else if (medium === 'referral') {
    label = 'Referral';
  } else if (source === 'test') {
    label = 'Test';
  } else if (source && source !== 'unknown') {
    label = source;
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
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

function responseSample(count: number, label: (count: number) => string): string {
  return count > 0 ? label(count) : '';
}

function money(value: number, locale: 'fr' | 'en'): string {
  if (!value) return '—';
  return moneyValue(value, locale);
}

function moneyValue(value: number, locale: 'fr' | 'en'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(value);
}

function moneyNullable(value: number | null, locale: 'fr' | 'en'): string {
  return value == null ? (locale === 'fr' ? 'Données insuffisantes' : 'Not enough data') : moneyValue(value, locale);
}

function formatNullablePercent(value: number | null, locale: 'fr' | 'en'): string {
  return value == null ? '—' : formatPercent(value, locale);
}

function ratioNullable(value: number | null, locale: 'fr' | 'en'): string {
  if (value == null) return locale === 'fr' ? 'Données insuffisantes' : 'Not enough data';
  return `${new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    maximumFractionDigits: 1,
  }).format(value)}×`;
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
    intro: 'Suivez les demandes, les sources d’acquisition, les délais de réponse et les résultats.',
    export: 'Exporter CSV',
    updated: (time: string) => `Mis à jour ${time}`,
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
    moreFilters: 'Plus de filtres',
    quotes: 'Demandes',
    open: 'Ouvertes',
    won: 'Gagnées',
    winRate: 'Taux gagné',
    volume: 'Volume total',
    avgResponse: 'Réponse moyenne',
    medianResponse: 'Réponse médiane',
    withinHour: 'Répondu < 1 h',
    revenue: 'Revenu BétonDispo',
    noRevenue: 'Aucun revenu enregistré',
    filteredPeriod: 'Période filtrée',
    respondedSample: (count: number) => `Basé sur ${count} demande${count === 1 ? '' : 's'} avec suivi`,
    advertising: 'Performance publicitaire',
    advertisingNote:
      'Dépenses Google Ads synchronisées séparément des demandes CRM avec GCLID.',
    googleAdsSettings: 'Paramètres Google Ads →',
    adSpend: 'Dépense',
    clicks: 'Clics',
    avgCpc: 'CPC moyen',
    costPerQuote: 'Coût / demande',
    costPerQualified: 'Coût / qualifiée',
    qualifiedLeadCount: 'qualifiées',
    roas: 'ROAS',
    roasBasis: 'Revenu BétonDispo',
    gclidQuotes: 'avec GCLID',
    campaignPerformance: 'Performance par campagne',
    trend: 'Demandes dans le temps',
    funnel: 'Entonnoir',
    statusBreakdown: 'Répartition des statuts',
    ofSubmitted: 'des demandes',
    bySource: 'Sources d’acquisition',
    byCampaign: 'Demandes par campagne',
    byLandingPage: 'Pages d’arrivée',
    byQuoteEntryPage: 'Pages d’entrée soumission',
    byProject: 'Demandes par projet',
    byCity: 'Demandes par ville',
    byDevice: 'Demandes par appareil',
    projectsCities: 'Projets et villes',
    leads: 'Demandes',
    gclidSplit: 'Attribution Google Ads',
    googleAds: 'Google Ads leads',
    googleAdsEmpty: 'Aucune demande attribuée Google Ads pour le moment.',
    googleAdsHelp: 'Les demandes avec GCLID apparaîtront ici après le déploiement du suivi.',
    attributed: 'Demandes avec GCLID',
    unattributed: 'Sans GCLID',
    ofLeads: 'sur',
    requests: 'Toutes les demandes',
    noData: 'Aucune donnée disponible pour cette période.',
    notEnoughActivity: 'Pas assez d’activité de statut pour construire l’entonnoir.',
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
    updated: (time: string) => `Updated ${time}`,
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
    moreFilters: 'More filters',
    quotes: 'Quotes',
    open: 'Open',
    won: 'Won',
    winRate: 'Win rate',
    volume: 'Total volume',
    avgResponse: 'Avg response',
    medianResponse: 'Median response',
    withinHour: 'Responded < 1 h',
    revenue: 'BétonDispo revenue',
    noRevenue: 'No revenue recorded',
    filteredPeriod: 'Filtered period',
    respondedSample: (count: number) => `Based on ${count} responded lead${count === 1 ? '' : 's'}`,
    advertising: 'Advertising performance',
    advertisingNote:
      'Google Ads spend is synced separately from CRM requests with GCLID attribution.',
    googleAdsSettings: 'Google Ads settings →',
    adSpend: 'Spend',
    clicks: 'Clicks',
    avgCpc: 'Avg CPC',
    costPerQuote: 'Cost / quote',
    costPerQualified: 'Cost / qualified',
    qualifiedLeadCount: 'qualified',
    roas: 'ROAS',
    roasBasis: 'BétonDispo revenue',
    gclidQuotes: 'with GCLID',
    campaignPerformance: 'Campaign performance',
    trend: 'Quotes over time',
    funnel: 'Funnel',
    statusBreakdown: 'Status breakdown',
    ofSubmitted: 'of submitted',
    bySource: 'Acquisition sources',
    byCampaign: 'Leads by campaign',
    byLandingPage: 'Landing pages',
    byQuoteEntryPage: 'Quote entry pages',
    byProject: 'Leads by project',
    byCity: 'Leads by city',
    byDevice: 'Leads by device',
    projectsCities: 'Projects and cities',
    leads: 'Leads',
    gclidSplit: 'Google Ads attribution',
    googleAds: 'Google Ads leads',
    googleAdsEmpty: 'No Google Ads-attributed leads yet.',
    googleAdsHelp: 'Future quote requests containing a GCLID will appear here.',
    attributed: 'Leads with GCLID',
    unattributed: 'Without GCLID',
    ofLeads: 'of',
    requests: 'All quote requests',
    noData: 'No data is available for this period.',
    notEnoughActivity: 'Not enough status activity yet to build the funnel.',
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

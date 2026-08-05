import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { getDashboardStats, listQuoteRequests } from '@/server/admin-queries';
import { StatusBadge } from '@/app/admin/StatusBadge';
import {
  adminOptions,
  formatDateTime,
  formatPercent,
  formatRelativeDateTime,
  formatVolume,
} from '@/app/admin/labels';
import { adminText } from '@/app/admin/i18n';
import { getAdminLocale } from '@/app/admin/locale';

/** Always reflects the current database state — never a cached snapshot. */
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();
  const locale = await getAdminLocale();
  const t = adminText[locale].dashboardPage;
  const options = adminOptions(locale);

  const [stats, latest] = await Promise.all([
    getDashboardStats(),
    listQuoteRequests({ sort: 'createdAt', direction: 'desc', page: 1 }),
  ]);

  return (
    <div className="container-page space-y-8">
      <div>
        <h1 className="text-3xl">{t.title}</h1>
        <p className="text-ink-muted mt-1">{t.intro}</p>
      </div>

      <section aria-labelledby="kpis">
        <h2 id="kpis" className="sr-only">
          {t.kpis}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t.last7} value={stats.last7} emphasis />
          <Stat label={t.last30} value={stats.last30} emphasis />
          <Stat
            label={t.qualified}
            value={stats.qualified}
            note={`${formatPercent(stats.qualifiedRate, locale)} ${t.qualifiedNote}`}
          />
          <Stat
            label={t.wonConversion}
            value={formatPercent(stats.wonRate, locale)}
            note={t.wonLost(stats.won, stats.lost)}
          />
          <Stat label={t.contractors} value={stats.contractors} />
          <Stat label={t.homeowners} value={stats.homeowners} />
          <Stat label={t.total} value={stats.total} />
          <div className="rounded-card border-line bg-surface border p-5">
            <p className="text-ink-muted font-display text-xs font-bold tracking-[0.12em] uppercase">
              {t.topCities}
            </p>
            {stats.topCities.length === 0 ? (
              <p className="text-ink-muted mt-3 text-sm">{t.noData}</p>
            ) : (
              <ul className="mt-3 space-y-1 text-sm">
                {stats.topCities.map((row) => (
                  <li key={row.city} className="flex justify-between gap-3">
                    <span className="text-ink-soft truncate">{row.city}</span>
                    <span className="font-semibold tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="latest" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="latest" className="text-xl">
            {t.latest}
          </h2>
          <Link
            href="/admin/requests"
            className="text-accent text-sm font-semibold hover:underline"
          >
            {t.viewAll}
          </Link>
        </div>

        {latest.rows.length === 0 ? (
          <p className="rounded-card border-line bg-surface text-ink-muted border border-dashed p-8 text-center">
            {t.empty}
          </p>
        ) : (
          <ul className="rounded-card border-line bg-surface divide-line divide-y overflow-hidden border">
            {latest.rows.slice(0, 8).map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/requests/${row.id}`}
                  className="hover:bg-surface-sunken flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4"
                >
                  <span className="font-display text-accent w-24 font-bold">{row.publicId}</span>
                  <span className="min-w-40 flex-1 font-medium">{row.name}</span>
                  <span className="text-ink-muted min-w-28 text-sm">{row.city}</span>
                  <span className="text-ink-muted min-w-32 text-sm">
                    {options.projectType[row.projectType]}
                  </span>
                  <span className="text-ink-muted min-w-20 text-sm tabular-nums">
                    {formatVolume(row.estimatedVolumeM3, row.volumeUnknown, locale)}
                  </span>
                  <span className="text-ink-muted min-w-36 text-sm tabular-nums">
                    <time dateTime={row.createdAt.toISOString()}>
                      <span className="block">{formatRelativeDateTime(row.createdAt, locale)}</span>
                      <span className="block text-xs">{formatDateTime(row.createdAt, locale)}</span>
                    </time>
                  </span>
                  <StatusBadge status={row.status} locale={locale} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-card border-line bg-surface border p-5">
      <p className="text-ink-muted font-display text-xs font-bold tracking-[0.12em] uppercase">
        {label}
      </p>
      <p
        className={`font-display mt-2 font-extrabold tabular-nums ${
          emphasis ? 'text-accent text-4xl' : 'text-ink text-3xl'
        }`}
      >
        {value}
      </p>
      {note ? <p className="text-ink-muted mt-1 text-sm">{note}</p> : null}
    </div>
  );
}

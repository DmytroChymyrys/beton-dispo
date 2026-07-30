import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { getDashboardStats, listQuoteRequests } from '@/server/admin-queries';
import { StatusBadge } from '@/app/admin/StatusBadge';
import { formatDateTime, formatPercent, formatVolume, frOptions } from '@/app/admin/labels';

/** Always reflects the current database state — never a cached snapshot. */
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [stats, latest] = await Promise.all([
    getDashboardStats(),
    listQuoteRequests({ sort: 'createdAt', direction: 'desc', page: 1 }),
  ]);

  return (
    <div className="container-page space-y-8">
      <div>
        <h1 className="text-3xl">Tableau de bord</h1>
        <p className="text-ink-muted mt-1">
          L’indicateur principal de la phase 1 est le nombre de demandes qualifiées.
        </p>
      </div>

      <section aria-labelledby="kpis">
        <h2 id="kpis" className="sr-only">
          Indicateurs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Demandes — 7 derniers jours" value={stats.last7} emphasis />
          <Stat label="Demandes — 30 derniers jours" value={stats.last30} emphasis />
          <Stat
            label="Demandes qualifiées"
            value={stats.qualified}
            note={`${formatPercent(stats.qualifiedRate)} du total`}
          />
          <Stat
            label="Conversion en gagnées"
            value={formatPercent(stats.wonRate)}
            note={`${stats.won} gagnées · ${stats.lost} perdues`}
          />
          <Stat label="Entrepreneurs" value={stats.contractors} />
          <Stat label="Particuliers" value={stats.homeowners} />
          <Stat label="Total des demandes" value={stats.total} />
          <div className="rounded-card border-line bg-surface border p-5">
            <p className="text-ink-muted font-display text-xs font-bold tracking-[0.12em] uppercase">
              Principales villes
            </p>
            {stats.topCities.length === 0 ? (
              <p className="text-ink-muted mt-3 text-sm">Aucune donnée.</p>
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
            Dernières demandes
          </h2>
          <Link
            href="/admin/requests"
            className="text-accent text-sm font-semibold hover:underline"
          >
            Voir toutes les demandes →
          </Link>
        </div>

        {latest.rows.length === 0 ? (
          <p className="rounded-card border-line bg-surface text-ink-muted border border-dashed p-8 text-center">
            Aucune demande pour le moment.
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
                    {frOptions.projectType[row.projectType]}
                  </span>
                  <span className="text-ink-muted min-w-20 text-sm tabular-nums">
                    {formatVolume(row.estimatedVolumeM3, row.volumeUnknown)}
                  </span>
                  <span className="text-ink-muted min-w-28 text-sm tabular-nums">
                    {formatDateTime(row.createdAt)}
                  </span>
                  <StatusBadge status={row.status} />
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

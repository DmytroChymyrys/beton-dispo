'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type GroupRow = {
  label: string;
  leads: number;
  contacted: number;
  won: number;
  volumeM3: number;
  revenueCad: number;
};

type FunnelRow = {
  stage: string;
  count: number;
  rateFromPrevious: number | null;
  rateFromSubmitted: number;
};

type TrendRow = {
  date: string;
  quotes: number;
  won: number;
};

type Props = {
  trend: TrendRow[];
  funnel: FunnelRow[];
  byStatus: GroupRow[];
  bySource: GroupRow[];
  byLandingPage: GroupRow[];
  byProject: GroupRow[];
  byCity: GroupRow[];
  gclidSplit: GroupRow[];
  labels: {
    trend: string;
    source: string;
    funnel: string;
    status: string;
    projects: string;
    cities: string;
    landingPages: string;
    googleAds: string;
    googleAdsEmpty: string;
    googleAdsHelp: string;
    quotes: string;
    won: string;
    winRate: string;
    volume: string;
    noData: string;
    notEnoughActivity: string;
    attributed: string;
    unattributed: string;
    ofLeads: string;
  };
};

const ORANGE = '#c2410c';
const GREEN = '#0f766e';
const SLATE = '#475569';
const BLUE = '#2563eb';
const RED = '#b91c1c';
const GRAY = '#9ca3af';
const TRACK = '#ebe7e0';

function tooltipStyle() {
  return {
    backgroundColor: '#fff',
    border: '1px solid #e2dfda',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
  };
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function topRows(rows: GroupRow[], limit = 5): GroupRow[] {
  return rows.filter((row) => row.leads > 0).slice(0, limit);
}

function truncate(value: string, max = 42): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="border-line bg-surface-sunken text-ink-muted flex min-h-36 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm">
      {title}
    </div>
  );
}

export function AnalyticsCharts({
  trend,
  funnel,
  byStatus,
  bySource,
  byLandingPage,
  byProject,
  byCity,
  gclidSplit,
  labels,
}: Props) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-card border-line bg-surface border p-5 xl:col-span-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-bold">{labels.trend}</h2>
            <p className="text-ink-muted text-xs">{labels.quotes} / {labels.won}</p>
          </div>
          {trend.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 10, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="quotesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ORANGE} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={ORANGE} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#ebe7e0" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="quotes"
                    name={labels.quotes}
                    stroke={ORANGE}
                    fill="url(#quotesFill)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="won"
                    name={labels.won}
                    stroke={GREEN}
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState title={labels.noData} />
            </div>
          )}
        </section>

        <SourceSummary rows={topRows(bySource, 5)} labels={labels} />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <FunnelCard rows={funnel} labels={labels} />
        <StatusBreakdown rows={byStatus} labels={labels} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <RankingCard title={labels.projects} rows={topRows(byProject)} labels={labels} />
        <RankingCard title={labels.cities} rows={topRows(byCity)} labels={labels} />
      </div>

      <LandingPageReport rows={topRows(byLandingPage, 8)} labels={labels} />
      <GoogleAdsCard rows={gclidSplit} labels={labels} />
    </div>
  );
}

function SourceSummary({ rows, labels }: { rows: GroupRow[]; labels: Props['labels'] }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5 xl:col-span-4">
      <h2 className="text-lg font-bold">{labels.source}</h2>
      <div className="mt-4">
        {rows.length ? (
          <RankedRows rows={rows} labels={labels} showWinRate />
        ) : (
          <EmptyState title={labels.noData} />
        )}
      </div>
    </section>
  );
}

function FunnelCard({ rows, labels }: { rows: FunnelRow[]; labels: Props['labels'] }) {
  const total = rows[0]?.count ?? 0;
  return (
    <section className="rounded-card border-line bg-surface border p-5 xl:col-span-7">
      <h2 className="text-lg font-bold">{labels.funnel}</h2>
      <div className="mt-4 space-y-3">
        {total > 0 ? (
          rows.map((row, index) => (
            <div key={row.stage}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{row.stage}</span>
                <span className="text-ink-muted tabular-nums">
                  {row.count} · {pct(row.rateFromSubmitted)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full" style={{ backgroundColor: TRACK }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(row.count ? 4 : 0, row.rateFromSubmitted * 100)}%`,
                    backgroundColor: [ORANGE, SLATE, BLUE, GREEN][index] ?? SLATE,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyState title={labels.notEnoughActivity} />
        )}
      </div>
    </section>
  );
}

function StatusBreakdown({ rows, labels }: { rows: GroupRow[]; labels: Props['labels'] }) {
  const total = rows.reduce((sum, row) => sum + row.leads, 0);
  const colors: Record<string, string> = {
    NEW: ORANGE,
    CONTACTED: SLATE,
    QUALIFIED: BLUE,
    QUOTING: BLUE,
    OFFER_SENT: BLUE,
    WON: GREEN,
    LOST: RED,
    INVALID: GRAY,
  };

  return (
    <section className="rounded-card border-line bg-surface border p-5 xl:col-span-5">
      <h2 className="text-lg font-bold">{labels.status}</h2>
      {total ? (
        <div className="mt-4 space-y-3">
          <div className="flex h-3 overflow-hidden rounded-full" style={{ backgroundColor: TRACK }}>
            {rows.map((row) => (
              <div
                key={row.label}
                style={{
                  width: `${(row.leads / total) * 100}%`,
                  backgroundColor: colors[row.label] ?? GRAY,
                }}
              />
            ))}
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colors[row.label] ?? GRAY }}
                  />
                  {row.label}
                </span>
                <span className="text-ink-muted tabular-nums">{row.leads}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState title={labels.noData} />
        </div>
      )}
    </section>
  );
}

function RankingCard({ title, rows, labels }: { title: string; rows: GroupRow[]; labels: Props['labels'] }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">
        {rows.length ? <RankedRows rows={rows} labels={labels} /> : <EmptyState title={labels.noData} />}
      </div>
    </section>
  );
}

function LandingPageReport({ rows, labels }: { rows: GroupRow[]; labels: Props['labels'] }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <h2 className="text-lg font-bold">{labels.landingPages}</h2>
      {rows.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="text-ink-muted text-left">
              <tr>
                <th className="py-2 pr-4 font-semibold">{labels.landingPages}</th>
                <th className="px-4 py-2 text-right font-semibold">{labels.quotes}</th>
                <th className="px-4 py-2 text-right font-semibold">{labels.won}</th>
                <th className="px-4 py-2 text-right font-semibold">{labels.winRate}</th>
                <th className="py-2 pl-4 text-right font-semibold">{labels.volume}</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="max-w-[28rem] py-3 pr-4">
                    {row.label.startsWith('/') ? (
                      <Link
                        href={row.label}
                        target="_blank"
                        className="text-accent hover:underline"
                        title={row.label}
                      >
                        {truncate(row.label, 58)}
                      </Link>
                    ) : (
                      <span title={row.label}>{truncate(row.label, 58)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.leads}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.won}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{pct(row.won / Math.max(1, row.leads))}</td>
                  <td className="py-3 pl-4 text-right tabular-nums">{row.volumeM3.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState title={labels.noData} />
        </div>
      )}
    </section>
  );
}

function GoogleAdsCard({ rows, labels }: { rows: GroupRow[]; labels: Props['labels'] }) {
  const attributed = rows.find((row) => row.label === 'Google Ads click identified')?.leads ?? 0;
  const total = rows.reduce((sum, row) => sum + row.leads, 0);
  const share = total ? attributed / total : 0;

  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <div className="grid gap-5 md:grid-cols-[18rem_1fr] md:items-center">
        <div>
          <h2 className="text-lg font-bold">{labels.googleAds}</h2>
          <p className="text-ink-muted mt-1 text-sm">{labels.googleAdsHelp}</p>
        </div>
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold tabular-nums">
                {attributed} <span className="text-ink-muted text-base font-semibold">{labels.ofLeads} {total}</span>
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                {attributed ? labels.attributed : labels.googleAdsEmpty}
              </p>
            </div>
            <p className="text-2xl font-extrabold tabular-nums">{pct(share)}</p>
          </div>
          <div className="mt-3 h-3 rounded-full" style={{ backgroundColor: TRACK }}>
            <div
              className="h-3 rounded-full"
              style={{ width: `${share * 100}%`, backgroundColor: attributed ? GREEN : GRAY }}
            />
          </div>
          <p className="text-ink-muted mt-2 text-xs">{labels.unattributed}: {Math.max(0, total - attributed)}</p>
        </div>
      </div>
    </section>
  );
}

function RankedRows({
  rows,
  labels,
  showWinRate = false,
}: {
  rows: GroupRow[];
  labels: Props['labels'];
  showWinRate?: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.leads), 1);
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="truncate font-medium" title={row.label}>{truncate(row.label, 34)}</span>
            <span className="text-ink-muted whitespace-nowrap tabular-nums">
              {row.leads} {labels.quotes}
              {row.won ? ` · ${row.won} ${labels.won}` : ''}
              {showWinRate ? ` · ${pct(row.won / Math.max(1, row.leads))}` : ''}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full" style={{ backgroundColor: TRACK }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max(6, (row.leads / max) * 100)}%`,
                backgroundColor: ORANGE,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

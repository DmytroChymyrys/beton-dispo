'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ChartRow = {
  label: string;
  leads: number;
  won: number;
  volumeM3: number;
};

type FunnelRow = {
  stage: string;
  count: number;
  rateFromSubmitted: number;
};

type Props = {
  funnel: FunnelRow[];
  bySource: ChartRow[];
  byLandingPage: ChartRow[];
  byProject: ChartRow[];
  byCity: ChartRow[];
  gclidSplit: ChartRow[];
  labels: {
    funnel: string;
    sources: string;
    landingPages: string;
    projectsCities: string;
    projects: string;
    cities: string;
    googleAds: string;
    leads: string;
    won: string;
    noData: string;
  };
};

const COLORS = ['#c2410c', '#475569', '#0f766e', '#b45309', '#7c3aed', '#0369a1'];

function shortLabel(value: string, max = 26): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function chartRows(rows: ChartRow[], limit = 6): ChartRow[] {
  return rows
    .filter((row) => row.leads > 0)
    .slice(0, limit)
    .map((row) => ({ ...row, label: shortLabel(row.label) }));
}

function Empty({ label }: { label: string }) {
  return <div className="text-ink-muted flex h-64 items-center justify-center text-sm">{label}</div>;
}

function tooltipStyle() {
  return {
    backgroundColor: '#fff',
    border: '1px solid #e2dfda',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgb(15 23 42 / 0.12)',
  };
}

export function AnalyticsCharts({
  funnel,
  bySource,
  byLandingPage,
  byProject,
  byCity,
  gclidSplit,
  labels,
}: Props) {
  const sourceRows = chartRows(bySource);
  const landingRows = chartRows(byLandingPage, 7);
  const projectRows = chartRows(byProject, 7);
  const cityRows = chartRows(byCity, 7);
  const gclidRows = chartRows(gclidSplit, 2);
  const funnelRows = funnel.map((row) => ({
    ...row,
    value: row.count,
    fill: COLORS[funnel.indexOf(row) % COLORS.length],
  }));

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <section className="rounded-card border-line bg-surface border p-5">
          <h2 className="text-xl">{labels.funnel}</h2>
          {funnelRows.some((row) => row.value > 0) ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Funnel dataKey="value" data={funnelRows} nameKey="stage" isAnimationActive>
                    <LabelList
                      position="right"
                      fill="#17181c"
                      stroke="none"
                      dataKey="stage"
                      fontSize={12}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label={labels.noData} />
          )}
        </section>

        <section className="rounded-card border-line bg-surface border p-5">
          <h2 className="text-xl">{labels.sources}</h2>
          {sourceRows.length ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceRows} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#e7e2dc" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend />
                  <Bar dataKey="leads" name={labels.leads} fill="#c2410c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="won" name={labels.won} fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label={labels.noData} />
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-card border-line bg-surface border p-5 xl:col-span-2">
          <h2 className="text-xl">{labels.landingPages}</h2>
          {landingRows.length ? (
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={landingRows}
                  layout="vertical"
                  margin={{ top: 8, right: 18, left: 80, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e7e2dc" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Bar dataKey="leads" name={labels.leads} fill="#c2410c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label={labels.noData} />
          )}
        </section>

        <section className="rounded-card border-line bg-surface border p-5">
          <h2 className="text-xl">{labels.googleAds}</h2>
          {gclidRows.length ? (
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gclidRows} dataKey="leads" nameKey="label" innerRadius={58} outerRadius={92}>
                    {gclidRows.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty label={labels.noData} />
          )}
        </section>
      </div>

      <section className="rounded-card border-line bg-surface border p-5">
        <h2 className="text-xl">{labels.projectsCities}</h2>
        <div className="mt-4 grid gap-6 xl:grid-cols-2">
          <RankedBars title={labels.projects} rows={projectRows} noData={labels.noData} />
          <RankedBars title={labels.cities} rows={cityRows} noData={labels.noData} />
        </div>
      </section>
    </div>
  );
}

function RankedBars({ title, rows, noData }: { title: string; rows: ChartRow[]; noData: string }) {
  return (
    <div>
      <h3 className="text-ink-muted text-sm font-bold tracking-wide uppercase">{title}</h3>
      {rows.length ? (
        <div className="mt-3 space-y-3">
          {rows.map((row, index) => {
            const max = Math.max(...rows.map((item) => item.leads), 1);
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-ink-muted tabular-nums">{row.leads}</span>
                </div>
                <div className="bg-surface-sunken mt-1 h-2 rounded-full">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(6, (row.leads / max) * 100)}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty label={noData} />
      )}
    </div>
  );
}

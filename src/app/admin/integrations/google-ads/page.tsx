import { requireAdmin } from '@/server/auth';
import { getGoogleAdsIntegrationDashboard } from '@/server/admin-queries';
import { getGoogleAdsPublicConfig } from '@/lib/google-ads/config';
import { testGoogleAdsConnection } from '@/lib/google-ads/client';
import {
  processOfflineConversionsAction,
  syncGoogleAdsAction,
  testGoogleAdsConnectionAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function GoogleAdsIntegrationPage() {
  await requireAdmin();
  const [dashboard, connection] = await Promise.all([
    getGoogleAdsIntegrationDashboard(),
    testGoogleAdsConnection(),
  ]);
  const config = getGoogleAdsPublicConfig();

  return (
    <div className="container-page max-w-[1300px] space-y-6">
      <div>
        <p className="text-accent text-sm font-bold tracking-wide uppercase">Integrations</p>
        <h1 className="mt-1 text-3xl">Google Ads</h1>
        <p className="text-ink-muted mt-2 max-w-3xl">
          Read-only spend sync, internal ROI reporting, and offline conversion audit queue.
          Quote submission remains tracked through GA4 separately.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Connection">
          <StatusLine label="Configured" value={connection.configured ? 'Yes' : 'No'} />
          <StatusLine label="Connected" value={connection.connected ? 'Yes' : 'No'} />
          <StatusLine label="Customer ID" value={connection.customerId ?? '—'} />
          {!config.configured && config.missing.length ? (
            <StatusLine label="Missing vars" value={config.missing.join(', ')} />
          ) : null}
          <StatusLine label="Account" value={connection.descriptiveName ?? '—'} />
          <StatusLine label="Currency" value={connection.currencyCode ?? '—'} />
          <StatusLine label="Timezone" value={connection.timeZone ?? '—'} />
          {connection.errorCode ? <StatusLine label="Error" value={connection.errorCode} /> : null}
          {connection.errorMessage ? (
            <p className="text-ink-muted mt-2 text-xs leading-relaxed">{connection.errorMessage}</p>
          ) : null}
          <form action={testGoogleAdsConnectionAction} className="mt-4">
            <Button>Test connection</Button>
          </form>
        </Card>

        <Card title="Reporting sync">
          <StatusLine label="API version" value={config.apiVersion} />
          {dashboard.lastSync ? (
            <>
              <StatusLine label="Last status" value={dashboard.lastSync.status} />
              <StatusLine
                label="Range"
                value={`${dashboard.lastSync.startDate} to ${dashboard.lastSync.endDate}`}
              />
              <StatusLine label="Rows" value={String(dashboard.lastSync.rowsUpserted)} />
              {dashboard.lastSync.errorCode ? (
                <StatusLine label="Error" value={dashboard.lastSync.errorCode} />
              ) : null}
              {dashboard.lastSync.sanitizedError ? (
                <p className="text-ink-muted mt-2 text-xs leading-relaxed">
                  {dashboard.lastSync.sanitizedError}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-ink-muted text-sm">No sync has run yet.</p>
          )}
          <form action={syncGoogleAdsAction} className="mt-4 grid gap-3">
            <select
              name="range"
              defaultValue="7d"
              className="border-line-strong bg-surface min-h-10 rounded-lg border px-3 text-sm"
            >
              <option value="7d">Refresh last 7 days</option>
              <option value="30d">Backfill last 30 days</option>
            </select>
            <Button>Sync now</Button>
          </form>
        </Card>

        <Card title="Offline conversions">
          <StatusLine label="Mode" value={config.offlineUploadMode} />
          <StatusLine
            label="Qualified lead action"
            value={config.qualifiedLeadActionConfigured ? 'Configured' : 'Missing'}
          />
          <StatusLine
            label="Won job action"
            value={config.wonJobActionConfigured ? 'Configured' : 'Missing'}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {['PENDING', 'RETRY', 'UPLOADED', 'SKIPPED', 'PERMANENTLY_FAILED'].map((status) => (
              <div key={status} className="bg-surface-sunken rounded-lg px-3 py-2">
                <p className="text-ink-muted text-xs font-semibold">{status}</p>
                <p className="text-xl font-extrabold tabular-nums">
                  {dashboard.queue.find((row) => row.status === status)?.count ?? 0}
                </p>
              </div>
            ))}
          </div>
          <form action={processOfflineConversionsAction} className="mt-4">
            <Button>Process queue</Button>
          </form>
        </Card>
      </section>

      <Card title="Conversion action rollout">
        <div className="grid gap-3 md:grid-cols-3">
          <Rollout title="quote_submit" status="Primary in GA4 / Google Ads" />
          <Rollout title="Qualified Lead" status="Secondary while validating" />
          <Rollout title="Won Job" status="Secondary while validating" />
        </div>
      </Card>

      <section className="rounded-card border-line bg-surface overflow-hidden border">
        <h2 className="border-line bg-surface-sunken border-b px-5 py-4 text-lg">Recent queue issues</h2>
        <table className="w-full min-w-[50rem] text-sm">
          <thead className="text-ink-muted text-left">
            <tr>
              <Th>Request</Th>
              <Th>Stage</Th>
              <Th>Attempts</Th>
              <Th>Error</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {dashboard.recentFailures.length ? (
              dashboard.recentFailures.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-bold text-accent">{row.requestNumber}</td>
                  <td className="px-4 py-3">{row.conversionStage}</td>
                  <td className="px-4 py-3 tabular-nums">{row.attemptCount}</td>
                  <td className="px-4 py-3">
                    {row.googleErrorCode ?? row.sanitizedError ?? '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.createdAt.toISOString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-ink-muted px-4 py-6 text-center" colSpan={5}>
                  No queue failures yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-accent hover:bg-accent-hover inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white">
      {children}
    </button>
  );
}

function Rollout({ title, status }: { title: string; status: string }) {
  return (
    <div className="border-line rounded-lg border p-4">
      <p className="font-bold">{title}</p>
      <p className="text-ink-muted mt-1 text-sm">{status}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold tracking-wider uppercase">{children}</th>;
}

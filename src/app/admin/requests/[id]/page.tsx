import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth';
import { getQuoteRequest, listQuoteRequestEvents } from '@/server/admin-queries';
import { StatusBadge } from '@/app/admin/StatusBadge';
import { adminOptions, formatDateTime, formatVolume, STATUS_LABELS } from '@/app/admin/labels';
import { adminText } from '@/app/admin/i18n';
import { getAdminLocale } from '@/app/admin/locale';
import type { QuoteRequestEvent } from '@/db/schema';
import type { QuoteStatus } from '@/lib/quote-options';
import { RequestEditor } from './RequestEditor';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const locale = await getAdminLocale();
  const t = adminText[locale].requestDetail;
  const options = adminOptions(locale);

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [request, events] = await Promise.all([getQuoteRequest(id), listQuoteRequestEvents(id)]);
  if (!request) notFound();

  const source = [request.utmSource, request.utmMedium, request.utmCampaign]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="container-page space-y-6">
      <div>
        <Link href="/admin/requests" className="text-ink-muted hover:text-ink text-sm">
          {t.back}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold">{request.publicId}</h1>
          <StatusBadge status={request.status} locale={locale} />
        </div>
        <p className="text-ink-muted mt-1 text-sm">
          {t.receivedMeta(
            formatDateTime(request.createdAt, locale),
            formatDateTime(request.updatedAt, locale),
            request.locale === 'fr' ? t.french : t.english,
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card title={t.client}>
            <Row label={t.name} value={request.name} />
            {request.companyName ? <Row label={t.company} value={request.companyName} /> : null}
            <Row label={t.type} value={options.customerType[request.customerType]} />
            <Row
              label={t.phone}
              value={
                <a href={`tel:${request.phone}`} className="text-accent hover:underline">
                  {request.phone}
                </a>
              }
            />
            <Row
              label={t.email}
              value={
                <a href={`mailto:${request.email}`} className="text-accent hover:underline">
                  {request.email}
                </a>
              }
            />
            <Row
              label={t.preferredContact}
              value={options.contactMethod[request.preferredContactMethod]}
            />
          </Card>

          <Card title={t.site}>
            <Row label={t.address} value={request.address} />
            <Row label={t.city} value={`${request.city} ${request.postalCode}`} />
            {request.accessNotes ? <Row label={t.access} value={request.accessNotes} /> : null}
          </Card>

          <Card title={t.project}>
            <Row label={t.type} value={options.projectType[request.projectType]} />
            <Row
              label={t.quantity}
              value={formatVolume(request.estimatedVolumeM3, request.volumeUnknown, locale)}
            />
            <Row
              label={t.specification}
              value={options.concreteStrength[request.concreteStrength]}
            />
            <Row label={t.pump} value={options.pumpRequired[request.pumpRequired]} />
            {request.pumpNotes ? <Row label={t.pumpNotes} value={request.pumpNotes} /> : null}
          </Card>

          <Card title={t.schedule}>
            <Row label={t.desiredDate} value={request.desiredDate} />
            <Row
              label={t.time}
              value={
                request.preferredTime
                  ? options.preferredTime[request.preferredTime]
                  : t.noPreference
              }
            />
            <Row label={t.flexible} value={request.scheduleFlexible ? t.yes : t.no} />
          </Card>

          {request.additionalNotes ? (
            <Card title={t.additional}>
              <p className="text-ink-soft whitespace-pre-wrap">{request.additionalNotes}</p>
            </Card>
          ) : null}

          <Card title={t.acquisition}>
            <Row label={t.source} value={source || '—'} />
            <Row
              label={t.termContent}
              value={[request.utmTerm, request.utmContent].filter(Boolean).join(' / ') || '—'}
            />
            <Row label={t.referrer} value={request.referrer || '—'} />
            <Row label={t.landingPage} value={request.landingPage || '—'} />
          </Card>

          <Card title={t.timeline}>
            <Timeline events={events} locale={locale} />
          </Card>
        </div>

        {/* Internal only — nothing in this column is ever exposed publicly. */}
        <RequestEditor
          id={request.id}
          status={request.status}
          internalNotes={request.internalNotes ?? ''}
          lostReason={request.lostReason ?? ''}
          locale={locale}
        />
      </div>
    </div>
  );
}

function Timeline({
  events,
  locale,
}: {
  events: QuoteRequestEvent[];
  locale: Awaited<ReturnType<typeof getAdminLocale>>;
}) {
  const t = adminText[locale].requestDetail;

  if (events.length === 0) {
    return <p className="text-ink-muted text-sm">{t.emptyTimeline}</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const statusFrom =
          typeof event.metadata?.from === 'string' ? (event.metadata.from as QuoteStatus) : null;
        const statusTo =
          typeof event.metadata?.to === 'string' ? (event.metadata.to as QuoteStatus) : null;
        const detail =
          statusFrom && statusTo
            ? t.statusChange(STATUS_LABELS[locale][statusFrom], STATUS_LABELS[locale][statusTo])
            : event.message;

        return (
          <li key={event.id} className="border-line border-l-2 pl-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {t.eventTypes[event.type as keyof typeof t.eventTypes] ?? event.type}
              </p>
              <time className="text-ink-muted text-xs tabular-nums">
                {formatDateTime(event.createdAt, locale)}
              </time>
            </div>
            <p className="text-ink-muted mt-1 text-sm">{detail}</p>
            <p className="text-ink-muted mt-1 text-xs">
              {t.eventActor[event.actor as keyof typeof t.eventActor] ?? event.actor}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <h2 className="text-ink-muted font-display text-xs font-bold tracking-[0.12em] uppercase">
        {title}
      </h2>
      <dl className="mt-3 space-y-2">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-ink-muted text-sm">{label}</dt>
      <dd className="text-ink-soft break-words">{value}</dd>
    </div>
  );
}

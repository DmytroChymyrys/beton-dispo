import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth';
import { getSupplierApplication } from '@/server/admin-queries';
import { getAdminLocale } from '@/app/admin/locale';
import { SupplierApplicationEditor } from '@/app/admin/suppliers/[id]/SupplierApplicationEditor';
import {
  SUPPLIER_APPLICATION_STATUS_LABELS,
  SUPPLIER_SERVICE_LABELS,
  type SupplierServiceCode,
} from '@/lib/supplier-options';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function SupplierApplicationDetailPage({ params }: Props) {
  await requireAdmin();
  const [{ id }, locale] = await Promise.all([params, getAdminLocale()]);
  const application = await getSupplierApplication(id);
  if (!application) notFound();

  const t = copy[locale];
  const statusLabels = SUPPLIER_APPLICATION_STATUS_LABELS[locale];
  const serviceLabels = SUPPLIER_SERVICE_LABELS[locale];

  return (
    <div className="container-page max-w-[1200px] space-y-6">
      <div>
        <Link href="/admin/suppliers" className="text-ink-muted hover:text-ink text-sm">
          ← {t.back}
        </Link>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-accent font-display text-sm font-bold tracking-widest uppercase">
              {application.publicId}
            </p>
            <h1 className="mt-1 text-3xl">{application.companyName}</h1>
          </div>
          <span className="bg-accent-tint rounded-full px-3 py-1 text-sm font-bold">
            {statusLabels[application.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Section title={t.company}>
            <Info label={t.companyName} value={application.companyName} />
            <Info
              label={t.website}
              value={
                application.website ? (
                  <a
                    className="text-accent hover:underline"
                    href={application.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {application.website}
                  </a>
                ) : (
                  '—'
                )
              }
            />
          </Section>

          <Section title={t.contact}>
            <Info label={t.contactName} value={application.contactName} />
            <Info
              label={t.email}
              value={
                <a className="text-accent hover:underline" href={`mailto:${application.email}`}>
                  {application.email}
                </a>
              }
            />
            <Info
              label={t.phone}
              value={
                <a className="text-accent hover:underline" href={`tel:${application.phone}`}>
                  {application.phone}
                </a>
              }
            />
          </Section>

          <Section title={t.coverage}>
            <p className="text-ink-soft leading-relaxed">{application.serviceAreaText}</p>
          </Section>

          <Section title={t.services}>
            <div className="flex flex-wrap gap-2">
              {application.services.map((service) => (
                <span
                  key={service}
                  className="bg-surface-sunken rounded-full px-3 py-1 text-sm font-semibold"
                >
                  {serviceLabels[service as SupplierServiceCode] ?? service}
                </span>
              ))}
            </div>
          </Section>

          <Section title={t.message}>
            <p className="text-ink-soft leading-relaxed whitespace-pre-line">
              {application.message || '—'}
            </p>
          </Section>

          <Section title={t.acquisition}>
            <Info label="Source / medium" value={sourceMedium(application)} />
            <Info
              label="Campaign"
              value={application.firstTouchCampaign ?? application.utmCampaign ?? '—'}
            />
            <Info
              label="Referrer"
              value={application.firstTouchReferrer ?? application.referrer ?? '—'}
            />
            <Info
              label="Landing page"
              value={application.firstTouchLandingPage ?? application.landingPage ?? '—'}
            />
            <Info
              label="GCLID"
              value={application.gclid ? `${application.gclid.slice(0, 20)}…` : '—'}
            />
          </Section>

          <Section title={t.timeline}>
            <ul className="space-y-2 text-sm">
              <TimelineItem label={t.submitted} value={application.createdAt} locale={locale} />
              <TimelineItem
                label={t.contacted}
                value={application.firstContactedAt}
                locale={locale}
              />
              <TimelineItem label={t.qualified} value={application.qualifiedAt} locale={locale} />
              <TimelineItem label={t.approved} value={application.approvedAt} locale={locale} />
              <TimelineItem label={t.rejected} value={application.rejectedAt} locale={locale} />
            </ul>
          </Section>
        </div>

        <aside className="space-y-4">
          <SupplierApplicationEditor
            id={application.id}
            status={application.status}
            internalNotes={application.internalNotes ?? ''}
            locale={locale}
          />
          <p className="text-ink-muted text-sm leading-relaxed">{t.approvalNote}</p>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border-line bg-surface border p-5">
      <h2 className="text-xl">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[180px_1fr]">
      <dt className="text-ink-muted text-sm font-semibold">{label}</dt>
      <dd className="text-ink-soft text-sm">{value}</dd>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  locale,
}: {
  label: string;
  value: Date | null;
  locale: 'fr' | 'en';
}) {
  return (
    <li className="flex justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold">{value ? formatDate(value, locale) : '—'}</span>
    </li>
  );
}

function formatDate(date: Date, locale: 'fr' | 'en') {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(date);
}

function sourceMedium(application: {
  firstTouchSource: string | null;
  firstTouchMedium: string | null;
  utmSource: string | null;
  utmMedium: string | null;
}) {
  const source = application.firstTouchSource ?? application.utmSource;
  const medium = application.firstTouchMedium ?? application.utmMedium;
  if (!source) return '—';
  return medium ? `${source} / ${medium}` : source;
}

const copy = {
  fr: {
    back: 'Retour aux fournisseurs',
    company: 'Entreprise',
    companyName: 'Nom',
    website: 'Site web',
    contact: 'Contact',
    contactName: 'Nom',
    email: 'Courriel',
    phone: 'Téléphone',
    coverage: 'Couverture',
    services: 'Services',
    message: 'Message du demandeur',
    acquisition: 'Acquisition',
    timeline: 'Suivi',
    submitted: 'Soumise',
    contacted: 'Contactée',
    qualified: 'Qualifiée',
    approved: 'Approuvée',
    rejected: 'Refusée',
    approvalNote: 'V1: approuver une demande ne crée pas encore un fournisseur actif.',
  },
  en: {
    back: 'Back to suppliers',
    company: 'Company',
    companyName: 'Name',
    website: 'Website',
    contact: 'Contact',
    contactName: 'Name',
    email: 'Email',
    phone: 'Phone',
    coverage: 'Coverage',
    services: 'Services',
    message: 'Applicant message',
    acquisition: 'Acquisition',
    timeline: 'Follow-up',
    submitted: 'Submitted',
    contacted: 'Contacted',
    qualified: 'Qualified',
    approved: 'Approved',
    rejected: 'Rejected',
    approvalNote: 'V1: approving an application does not yet create an active supplier.',
  },
} as const;

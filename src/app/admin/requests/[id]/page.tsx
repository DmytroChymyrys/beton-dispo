import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth';
import { getQuoteRequest } from '@/server/admin-queries';
import { StatusBadge } from '@/app/admin/StatusBadge';
import { formatDateTime, formatVolume, frOptions } from '@/app/admin/labels';
import { RequestEditor } from './RequestEditor';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const request = await getQuoteRequest(id);
  if (!request) notFound();

  const source = [request.utmSource, request.utmMedium, request.utmCampaign]
    .filter(Boolean)
    .join(' / ');

  return (
    <div className="container-page space-y-6">
      <div>
        <Link href="/admin/requests" className="text-ink-muted hover:text-ink text-sm">
          ← Toutes les demandes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-extrabold">{request.publicId}</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-ink-muted mt-1 text-sm">
          Reçue le {formatDateTime(request.createdAt)} · Modifiée le{' '}
          {formatDateTime(request.updatedAt)} · Demande soumise en{' '}
          {request.locale === 'fr' ? 'français' : 'anglais'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card title="Client">
            <Row label="Nom" value={request.name} />
            {request.companyName ? <Row label="Entreprise" value={request.companyName} /> : null}
            <Row label="Type" value={frOptions.customerType[request.customerType]} />
            <Row
              label="Téléphone"
              value={
                <a href={`tel:${request.phone}`} className="text-accent hover:underline">
                  {request.phone}
                </a>
              }
            />
            <Row
              label="Courriel"
              value={
                <a href={`mailto:${request.email}`} className="text-accent hover:underline">
                  {request.email}
                </a>
              }
            />
            <Row
              label="Contact préféré"
              value={frOptions.contactMethod[request.preferredContactMethod]}
            />
          </Card>

          <Card title="Chantier">
            <Row label="Adresse" value={request.address} />
            <Row label="Ville" value={`${request.city} ${request.postalCode}`} />
            {request.accessNotes ? <Row label="Accès" value={request.accessNotes} /> : null}
          </Card>

          <Card title="Projet">
            <Row label="Type" value={frOptions.projectType[request.projectType]} />
            <Row
              label="Quantité"
              value={formatVolume(request.estimatedVolumeM3, request.volumeUnknown)}
            />
            <Row
              label="Spécification"
              value={frOptions.concreteStrength[request.concreteStrength]}
            />
            <Row label="Pompe" value={frOptions.pumpRequired[request.pumpRequired]} />
            {request.pumpNotes ? <Row label="Notes pompage" value={request.pumpNotes} /> : null}
          </Card>

          <Card title="Échéancier">
            <Row label="Date souhaitée" value={request.desiredDate} />
            <Row
              label="Moment"
              value={
                request.preferredTime
                  ? frOptions.preferredTime[request.preferredTime]
                  : 'Aucune préférence'
              }
            />
            <Row label="Flexible" value={request.scheduleFlexible ? 'Oui' : 'Non'} />
          </Card>

          {request.additionalNotes ? (
            <Card title="Détails supplémentaires">
              <p className="text-ink-soft whitespace-pre-wrap">{request.additionalNotes}</p>
            </Card>
          ) : null}

          <Card title="Acquisition">
            <Row label="Source" value={source || '—'} />
            <Row
              label="Terme / contenu"
              value={[request.utmTerm, request.utmContent].filter(Boolean).join(' / ') || '—'}
            />
            <Row label="Référent" value={request.referrer || '—'} />
            <Row label="Page d’arrivée" value={request.landingPage || '—'} />
          </Card>
        </div>

        {/* Internal only — nothing in this column is ever exposed publicly. */}
        <RequestEditor
          id={request.id}
          status={request.status}
          internalNotes={request.internalNotes ?? ''}
          lostReason={request.lostReason ?? ''}
        />
      </div>
    </div>
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

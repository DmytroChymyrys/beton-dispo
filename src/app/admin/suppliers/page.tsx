import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { listSupplierApplications, type SupplierApplicationFilters } from '@/server/admin-queries';
import { getAdminLocale } from '@/app/admin/locale';
import {
  SUPPLIER_APPLICATION_STATUSES,
  SUPPLIER_APPLICATION_STATUS_LABELS,
  SUPPLIER_SERVICE_CODES,
  SUPPLIER_SERVICE_LABELS,
  type SupplierApplicationStatus,
  type SupplierServiceCode,
} from '@/lib/supplier-options';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): SupplierApplicationFilters {
  const status = one(searchParams.status);
  const service = one(searchParams.service);
  const page = Number(one(searchParams.page) ?? '1');

  return {
    status: SUPPLIER_APPLICATION_STATUSES.includes(status as SupplierApplicationStatus)
      ? (status as SupplierApplicationStatus)
      : undefined,
    service: SUPPLIER_SERVICE_CODES.includes(service as SupplierServiceCode)
      ? (service as SupplierServiceCode)
      : undefined,
    query: one(searchParams.q)?.trim() || undefined,
    source: one(searchParams.source)?.trim() || undefined,
    createdFrom: one(searchParams.createdFrom) || undefined,
    createdTo: one(searchParams.createdTo) || undefined,
    page: Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1,
  };
}

function queryString(
  filters: SupplierApplicationFilters,
  patch: Partial<SupplierApplicationFilters>,
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...patch };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === '') continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export default async function SuppliersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const [locale, rawParams] = await Promise.all([getAdminLocale(), searchParams]);
  const filters = parseFilters(rawParams);
  const result = await listSupplierApplications(filters);
  const t = copy[locale];
  const statusLabels = SUPPLIER_APPLICATION_STATUS_LABELS[locale];
  const serviceLabels = SUPPLIER_SERVICE_LABELS[locale];

  return (
    <div className="container-page max-w-[1400px] space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl">{t.title}</h1>
          <p className="text-ink-muted mt-2 max-w-3xl">{t.intro}</p>
        </div>
        <p className="text-ink-muted text-sm">
          {result.total} {t.total}
        </p>
      </div>

      <form
        method="get"
        action="/admin/suppliers"
        className="rounded-card border-line bg-surface border p-4"
      >
        <div className="grid gap-4 lg:grid-cols-5">
          <Field label={t.status}>
            <select name="status" defaultValue={filters.status ?? ''} className={inputClass}>
              <option value="">{t.allStatuses}</option>
              {SUPPLIER_APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.service}>
            <select name="service" defaultValue={filters.service ?? ''} className={inputClass}>
              <option value="">{t.allServices}</option>
              {SUPPLIER_SERVICE_CODES.map((service) => (
                <option key={service} value={service}>
                  {serviceLabels[service]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.search}>
            <input name="q" defaultValue={filters.query ?? ''} className={inputClass} />
          </Field>
          <Field label={t.source}>
            <input name="source" defaultValue={filters.source ?? ''} className={inputClass} />
          </Field>
          <div className="flex items-end gap-2">
            <button
              className="bg-accent text-surface min-h-11 rounded-lg px-4 text-sm font-bold"
              type="submit"
            >
              {t.filter}
            </button>
            <Link
              href="/admin/suppliers"
              className="border-line-strong min-h-11 rounded-lg border px-4 py-3 text-sm font-bold"
            >
              {t.reset}
            </Link>
          </div>
        </div>
      </form>

      <section className="rounded-card border-line bg-surface overflow-x-auto border">
        <table className="w-full min-w-[72rem] text-sm">
          <thead className="text-ink-muted bg-surface-sunken text-left">
            <tr>
              <Th>{t.id}</Th>
              <Th>{t.created}</Th>
              <Th>{t.company}</Th>
              <Th>{t.contact}</Th>
              <Th>{t.area}</Th>
              <Th>{t.services}</Th>
              <Th>{t.status}</Th>
              <Th>{t.source}</Th>
              <Th>{t.updated}</Th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {result.rows.length ? (
              result.rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-sunken">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/suppliers/${row.id}`}
                      className="text-accent font-bold hover:underline"
                    >
                      {row.publicId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(row.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 font-semibold">{row.companyName}</td>
                  <td className="px-4 py-3">
                    <div>{row.contactName}</div>
                    <div className="text-ink-muted text-xs">{row.email}</div>
                  </td>
                  <td className="px-4 py-3">{row.serviceAreaText}</td>
                  <td className="px-4 py-3">
                    {row.services
                      .slice(0, 3)
                      .map((service) => serviceLabels[service as SupplierServiceCode] ?? service)
                      .join(', ')}
                  </td>
                  <td className="px-4 py-3">{statusLabels[row.status]}</td>
                  <td className="px-4 py-3">{sourceLabel(row)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(row.updatedAt, locale)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="text-ink-muted px-4 py-8 text-center" colSpan={9}>
                  {t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {result.pageCount > 1 ? (
        <div className="flex justify-end gap-2">
          {result.page > 1 ? (
            <Link
              href={`/admin/suppliers${queryString(filters, { page: result.page - 1 })}`}
              className="border-line-strong rounded-lg border px-4 py-2 text-sm font-bold"
            >
              {t.previous}
            </Link>
          ) : null}
          {result.page < result.pageCount ? (
            <Link
              href={`/admin/suppliers${queryString(filters, { page: result.page + 1 })}`}
              className="border-line-strong rounded-lg border px-4 py-2 text-sm font-bold"
            >
              {t.next}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const inputClass = 'border-line-strong bg-surface min-h-11 w-full rounded-lg border px-3';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold tracking-wider uppercase">{children}</th>;
}

function sourceLabel(row: {
  firstTouchSource: string | null;
  utmSource: string | null;
  utmMedium: string | null;
}) {
  const source = row.firstTouchSource ?? row.utmSource;
  if (!source) return '—';
  return row.utmMedium ? `${source} / ${row.utmMedium}` : source;
}

function formatDate(date: Date, locale: 'fr' | 'en') {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Toronto',
  }).format(date);
}

const copy = {
  fr: {
    title: 'Fournisseurs',
    intro:
      'Demandes de partenariat reçues par le site. Une demande approuvée ne crée pas automatiquement un fournisseur actif.',
    total: 'demandes',
    id: 'N°',
    created: 'Créée',
    updated: 'Mise à jour',
    company: 'Entreprise',
    contact: 'Contact',
    area: 'Secteur',
    services: 'Services',
    status: 'Statut',
    source: 'Source',
    service: 'Service',
    search: 'Recherche',
    allStatuses: 'Tous',
    allServices: 'Tous',
    filter: 'Filtrer',
    reset: 'Réinitialiser',
    empty: 'Aucune demande partenaire pour le moment.',
    previous: 'Précédent',
    next: 'Suivant',
  },
  en: {
    title: 'Suppliers',
    intro:
      'Partner applications received from the site. An approved application does not automatically create an active supplier.',
    total: 'applications',
    id: 'No.',
    created: 'Created',
    updated: 'Updated',
    company: 'Company',
    contact: 'Contact',
    area: 'Area',
    services: 'Services',
    status: 'Status',
    source: 'Source',
    service: 'Service',
    search: 'Search',
    allStatuses: 'All',
    allServices: 'All',
    filter: 'Filter',
    reset: 'Reset',
    empty: 'No partner applications yet.',
    previous: 'Previous',
    next: 'Next',
  },
} as const;

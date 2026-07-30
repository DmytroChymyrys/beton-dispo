import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import {
  listCities,
  listQuoteRequests,
  PAGE_SIZE,
  SORTABLE,
  type RequestFilters,
  type SortDirection,
  type SortKey,
} from '@/server/admin-queries';
import { CUSTOMER_TYPES, QUOTE_STATUSES } from '@/lib/quote-options';
import type { CustomerType, QuoteStatus } from '@/lib/quote-options';
import { StatusBadge } from '@/app/admin/StatusBadge';
import { adminOptions, formatDateTime, formatVolume, STATUS_LABELS } from '@/app/admin/labels';
import { adminText } from '@/app/admin/i18n';
import { getAdminLocale } from '@/app/admin/locale';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.length > 0 ? v : undefined;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Every filter is validated before it reaches a query. */
function parseFilters(params: Record<string, string | string[] | undefined>): RequestFilters {
  const date = (key: string) => {
    const value = first(params[key]);
    return value && ISO_DATE.test(value) ? value : undefined;
  };
  const page = Number(first(params.page) ?? '1');

  return {
    status: oneOf<QuoteStatus>(first(params.status), QUOTE_STATUSES),
    customerType: oneOf<CustomerType>(first(params.customerType), CUSTOMER_TYPES),
    city: first(params.city)?.slice(0, 120),
    desiredFrom: date('desiredFrom'),
    desiredTo: date('desiredTo'),
    createdFrom: date('createdFrom'),
    createdTo: date('createdTo'),
    sort: oneOf<SortKey>(first(params.sort), Object.keys(SORTABLE) as SortKey[]) ?? 'createdAt',
    direction: oneOf<SortDirection>(first(params.direction), ['asc', 'desc']) ?? 'desc',
    page: Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1,
  };
}

function queryString(filters: RequestFilters, overrides: Partial<RequestFilters>): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== '' && !(key === 'page' && value === 1)) {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

const selectClass =
  'min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink';

export default async function AdminRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const locale = await getAdminLocale();
  const t = adminText[locale].requestList;
  const options = adminOptions(locale);

  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ rows, total, page, pageCount }, cities] = await Promise.all([
    listQuoteRequests(filters),
    listCities(),
  ]);

  const columns: { key: SortKey; label: string }[] = [
    { key: 'createdAt', label: t.received },
    { key: 'city', label: t.city },
    { key: 'desiredDate', label: t.desiredDate },
    { key: 'status', label: t.status },
  ];

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl">{t.title}</h1>
        <p className="text-ink-muted text-sm tabular-nums">
          {t.count(total, page, pageCount)}
        </p>
      </div>

      {/* GET form: filters live in the URL, so a filtered view is shareable
          and survives a reload. */}
      <form
        method="get"
        action="/admin/requests"
        className="rounded-card border-line bg-surface grid gap-4 border p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-sm font-semibold">
            {t.status}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={filters.status ?? ''}
            className={selectClass}
          >
            <option value="">{t.all}</option>
            {QUOTE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[locale][status]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="city" className="block text-sm font-semibold">
            {t.city}
          </label>
          <input
            id="city"
            name="city"
            list="admin-cities"
            defaultValue={filters.city ?? ''}
            placeholder={t.cityPlaceholder}
            className={selectClass}
          />
          <datalist id="admin-cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="customerType" className="block text-sm font-semibold">
            {t.customerType}
          </label>
          <select
            id="customerType"
            name="customerType"
            defaultValue={filters.customerType ?? ''}
            className={selectClass}
          >
            <option value="">{t.all}</option>
            {CUSTOMER_TYPES.map((type) => (
              <option key={type} value={type}>
                {options.customerType[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold">{t.desiredDate}</span>
          <div className="flex gap-2">
            <input
              type="date"
              name="desiredFrom"
              aria-label={t.desiredFrom}
              defaultValue={filters.desiredFrom ?? ''}
              className={selectClass}
            />
            <input
              type="date"
              name="desiredTo"
              aria-label={t.desiredTo}
              defaultValue={filters.desiredTo ?? ''}
              className={selectClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-semibold">{t.createdDate}</span>
          <div className="flex gap-2">
            <input
              type="date"
              name="createdFrom"
              aria-label={t.createdFrom}
              defaultValue={filters.createdFrom ?? ''}
              className={selectClass}
            />
            <input
              type="date"
              name="createdTo"
              aria-label={t.createdTo}
              defaultValue={filters.createdTo ?? ''}
              className={selectClass}
            />
          </div>
        </div>

        <input type="hidden" name="sort" value={filters.sort} />
        <input type="hidden" name="direction" value={filters.direction} />
        <input type="hidden" name="page" value="1" />

        <div className="flex items-end gap-2 lg:col-span-2">
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover inline-flex min-h-11 items-center rounded-lg px-5 font-semibold text-white"
          >
            {t.filter}
          </button>
          <Link
            href="/admin/requests"
            className="border-line-strong hover:bg-surface-sunken inline-flex min-h-11 items-center rounded-lg border px-5 font-semibold"
          >
            {t.reset}
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-card border-line bg-surface text-ink-muted border border-dashed p-10 text-center">
          {t.noMatches}
        </p>
      ) : (
        <div className="rounded-card border-line bg-surface overflow-x-auto border">
          <table className="w-full min-w-[68rem] border-collapse text-sm">
            <thead>
              <tr className="border-line bg-surface-sunken border-b text-left">
                <Th>{t.number}</Th>
                <SortableTh column="createdAt" filters={filters} columns={columns} />
                <Th>{t.client}</Th>
                <SortableTh column="city" filters={filters} columns={columns} />
                <Th>{t.project}</Th>
                <Th>{t.quantity}</Th>
                <Th>{t.pump}</Th>
                <SortableTh column="desiredDate" filters={filters} columns={columns} />
                <Th>{t.phone}</Th>
                <Th>{t.email}</Th>
                <SortableTh column="status" filters={filters} columns={columns} />
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-sunken">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/requests/${row.id}`}
                      className="font-display text-accent font-bold hover:underline"
                    >
                      {row.publicId}
                    </Link>
                  </td>
                  <td className="text-ink-muted px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatDateTime(row.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{row.name}</span>
                    {row.companyName ? (
                      <span className="text-ink-muted block text-xs">{row.companyName}</span>
                    ) : null}
                    <span className="text-ink-muted block text-xs">
                      {options.customerType[row.customerType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{row.city}</td>
                  <td className="px-4 py-3">{options.projectType[row.projectType]}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatVolume(row.estimatedVolumeM3, row.volumeUnknown, locale)}
                  </td>
                  <td className="px-4 py-3">{options.pumpRequired[row.pumpRequired]}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{row.desiredDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a href={`tel:${row.phone}`} className="hover:underline">
                      {row.phone}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${row.email}`} className="hover:underline">
                      {row.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link
              href={`/admin/requests${queryString(filters, { page: page - 1 })}`}
              className="border-line-strong hover:bg-surface-sunken inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold"
            >
              {t.previous}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted text-sm tabular-nums">
            {t.range((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, total), total)}
          </span>
          {page < pageCount ? (
            <Link
              href={`/admin/requests${queryString(filters, { page: page + 1 })}`}
              className="border-line-strong hover:bg-surface-sunken inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-semibold"
            >
              {t.next}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="text-ink-muted px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap uppercase"
    >
      {children}
    </th>
  );
}

function SortableTh({
  column,
  filters,
  columns,
}: {
  column: SortKey;
  filters: RequestFilters;
  columns: { key: SortKey; label: string }[];
}) {
  const label = columns.find((c) => c.key === column)?.label ?? column;
  const active = filters.sort === column;
  const nextDirection: SortDirection = active && filters.direction === 'desc' ? 'asc' : 'desc';
  const href = `/admin/requests${queryString(filters, { sort: column, direction: nextDirection, page: 1 })}`;

  return (
    <th
      scope="col"
      aria-sort={active ? (filters.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="text-ink-muted px-4 py-3 text-xs font-bold tracking-wider whitespace-nowrap uppercase"
    >
      <Link href={href} className="hover:text-ink inline-flex items-center gap-1">
        {label}
        <span aria-hidden="true">{active ? (filters.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
      </Link>
    </th>
  );
}

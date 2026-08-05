import { NextRequest } from 'next/server';
import { requireAdmin } from '@/server/auth';
import { getAnalyticsReport, type AnalyticsFilters } from '@/server/admin-queries';
import { CUSTOMER_TYPES, PROJECT_TYPES, QUOTE_STATUSES } from '@/lib/quote-options';
import type { CustomerType, ProjectType, QuoteStatus } from '@/lib/quote-options';

const DEVICE_CATEGORIES = ['mobile', 'tablet', 'desktop'] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function dateBoundary(isoDate: string, end = false): Date {
  return new Date(`${isoDate}T${end ? '23:59:59.999' : '00:00:00.000'}-04:00`);
}

function parseFilters(params: URLSearchParams): AnalyticsFilters {
  const from = params.get('from');
  const to = params.get('to');
  return {
    from: from && ISO_DATE.test(from) ? dateBoundary(from) : undefined,
    to: to && ISO_DATE.test(to) ? dateBoundary(to, true) : undefined,
    source: params.get('source')?.slice(0, 120) || undefined,
    medium: params.get('medium')?.slice(0, 120) || undefined,
    campaign: params.get('campaign')?.slice(0, 160) || undefined,
    gclidPresent: params.get('gclid') === 'yes' ? true : params.get('gclid') === 'no' ? false : undefined,
    locale: oneOf(params.get('locale'), ['fr', 'en']),
    projectType: oneOf<ProjectType>(params.get('projectType'), PROJECT_TYPES),
    city: params.get('city')?.slice(0, 120) || undefined,
    status: oneOf<QuoteStatus>(params.get('status'), QUOTE_STATUSES),
    customerType: oneOf<CustomerType>(params.get('customerType'), CUSTOMER_TYPES),
    deviceCategory: oneOf(params.get('deviceCategory'), DEVICE_CATEGORIES),
    landingPage: params.get('landingPage')?.slice(0, 512) || undefined,
  };
}

function cell(value: string | number | boolean | null | undefined): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const report = await getAnalyticsReport(parseFilters(request.nextUrl.searchParams));
  const header = [
    'request',
    'created_at',
    'customer_type',
    'project_type',
    'city',
    'quantity_m3',
    'desired_date',
    'source',
    'medium',
    'campaign',
    'landing_page',
    'gclid_indicator',
    'status',
    'response_minutes',
    'revenue_cad',
  ];
  const rows = report.requestRows.map((row) =>
    [
      row.publicId,
      row.createdAt.toISOString(),
      row.customerType,
      row.projectType,
      row.city,
      row.volumeUnknown ? 'unknown' : row.estimatedVolumeM3,
      row.desiredDate,
      row.source,
      row.medium,
      row.campaign,
      row.landingPage,
      row.hasGclid ? 'Google Ads' : '',
      row.status,
      row.responseMinutes == null ? '' : Math.round(row.responseMinutes),
      row.revenueCad,
    ].map(cell).join(','),
  );

  return new Response([header.map(cell).join(','), ...rows].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="betondispo-analytics.csv"',
    },
  });
}

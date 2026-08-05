import 'server-only';

import { and, asc, count, desc, eq, gte, ilike, lte, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/db/client';
import {
  googleAdsDailyPerformance,
  googleAdsOfflineConversions,
  googleAdsSyncRuns,
  quoteRequestEvents,
  quoteRequests,
  supplierAssignments,
  suppliers,
  type NewQuoteRequest,
  type QuoteRequest,
  type QuoteRequestEvent,
} from '@/db/schema';
import { QUALIFIED_STATUSES, type CustomerType, type QuoteStatus } from '@/lib/quote-options';
import { enqueueOfflineConversionForQuote } from '@/lib/google-ads/conversions';

export const PAGE_SIZE = 50;

export const SORTABLE = {
  createdAt: quoteRequests.createdAt,
  desiredDate: quoteRequests.desiredDate,
  city: quoteRequests.city,
  status: quoteRequests.status,
} as const;

export type SortKey = keyof typeof SORTABLE;
export type SortDirection = 'asc' | 'desc';

export type RequestFilters = {
  status?: QuoteStatus;
  city?: string;
  customerType?: CustomerType;
  /** Filters on `desired_date` — "which requests need concrete this week". */
  desiredFrom?: string;
  desiredTo?: string;
  /** Filters on `created_at` — "which requests arrived this week". */
  createdFrom?: string;
  createdTo?: string;
  sort?: SortKey;
  direction?: SortDirection;
  page?: number;
};

function buildWhere(filters: RequestFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.status) clauses.push(eq(quoteRequests.status, filters.status));
  if (filters.customerType) clauses.push(eq(quoteRequests.customerType, filters.customerType));
  // Case-insensitive prefix match: the operator types "bros", not "Brossard".
  if (filters.city) clauses.push(ilike(quoteRequests.city, `${filters.city}%`));
  if (filters.desiredFrom) clauses.push(gte(quoteRequests.desiredDate, filters.desiredFrom));
  if (filters.desiredTo) clauses.push(lte(quoteRequests.desiredDate, filters.desiredTo));
  if (filters.createdFrom) {
    clauses.push(gte(quoteRequests.createdAt, new Date(`${filters.createdFrom}T00:00:00`)));
  }
  if (filters.createdTo) {
    clauses.push(lte(quoteRequests.createdAt, new Date(`${filters.createdTo}T23:59:59.999`)));
  }

  if (clauses.length === 0) return undefined;
  return and(...clauses);
}

export type RequestListRow = Pick<
  QuoteRequest,
  | 'id'
  | 'publicId'
  | 'createdAt'
  | 'name'
  | 'companyName'
  | 'customerType'
  | 'city'
  | 'projectType'
  | 'estimatedVolumeM3'
  | 'volumeUnknown'
  | 'desiredDate'
  | 'phone'
  | 'email'
  | 'status'
  | 'pumpRequired'
>;

export async function listQuoteRequests(filters: RequestFilters): Promise<{
  rows: RequestListRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const db = await getDb();
  const where = buildWhere(filters);

  const sortColumn = SORTABLE[filters.sort ?? 'createdAt'];
  const orderBy = filters.direction === 'asc' ? asc(sortColumn) : desc(sortColumn);
  const page = Math.max(1, filters.page ?? 1);

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: quoteRequests.id,
        publicId: quoteRequests.publicId,
        createdAt: quoteRequests.createdAt,
        name: quoteRequests.name,
        companyName: quoteRequests.companyName,
        customerType: quoteRequests.customerType,
        city: quoteRequests.city,
        projectType: quoteRequests.projectType,
        estimatedVolumeM3: quoteRequests.estimatedVolumeM3,
        volumeUnknown: quoteRequests.volumeUnknown,
        desiredDate: quoteRequests.desiredDate,
        phone: quoteRequests.phone,
        email: quoteRequests.email,
        status: quoteRequests.status,
        pumpRequired: quoteRequests.pumpRequired,
      })
      .from(quoteRequests)
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(quoteRequests).where(where),
  ]);

  const total = totals[0]?.value ?? 0;
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getQuoteRequest(id: string): Promise<QuoteRequest | null> {
  const db = await getDb();
  const [row] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  return row ?? null;
}

export async function listQuoteRequestEvents(id: string): Promise<QuoteRequestEvent[]> {
  const db = await getDb();
  return db
    .select()
    .from(quoteRequestEvents)
    .where(eq(quoteRequestEvents.quoteRequestId, id))
    .orderBy(desc(quoteRequestEvents.createdAt));
}

export async function updateQuoteRequest(
  id: string,
  patch: {
    status?: QuoteStatus;
    internalNotes?: string | null;
    lostReason?: string | null;
    estimatedJobValueCad?: string | null;
    finalJobValueCad?: string | null;
    betondispoRevenueCad?: string | null;
    supplierSelected?: string | null;
    serviceDate?: string | null;
  },
): Promise<void> {
  const db = await getDb();
  const [before] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  if (!before) return;

  const now = new Date();
  const timestampPatch: Partial<NewQuoteRequest> = {};

  if (patch.status && patch.status !== before.status) {
    if (
      !before.firstContactAt &&
      ['CONTACTED', 'QUALIFIED', 'QUOTING', 'OFFER_SENT', 'WON', 'LOST'].includes(patch.status)
    ) {
      timestampPatch.firstContactAt = now;
    }
    if (
      !before.firstResponseAt &&
      ['CONTACTED', 'QUALIFIED', 'QUOTING', 'OFFER_SENT', 'WON', 'LOST'].includes(patch.status)
    ) {
      timestampPatch.firstResponseAt = now;
    }
    if (patch.status === 'WON') {
      timestampPatch.wonAt = before.wonAt ?? now;
      timestampPatch.resolvedAt = before.resolvedAt ?? now;
      if (before.qualificationStatus === 'PENDING') {
        timestampPatch.qualificationStatus = 'QUALIFIED';
        timestampPatch.qualifiedAt = before.qualifiedAt ?? now;
        timestampPatch.qualifiedBy = before.qualifiedBy ?? 'admin';
      }
    }
    if (patch.status === 'LOST' || patch.status === 'INVALID') {
      timestampPatch.lostAt = before.lostAt ?? now;
      timestampPatch.resolvedAt = before.resolvedAt ?? now;
      if (patch.status === 'INVALID' && before.qualificationStatus === 'PENDING') {
        timestampPatch.qualificationStatus = 'DISQUALIFIED';
        timestampPatch.disqualificationReason = before.disqualificationReason ?? 'other';
      }
    }
    if (patch.status === 'QUALIFIED' && before.qualificationStatus !== 'QUALIFIED') {
      timestampPatch.qualificationStatus = 'QUALIFIED';
      timestampPatch.qualifiedAt = before.qualifiedAt ?? now;
      timestampPatch.qualifiedBy = before.qualifiedBy ?? 'admin';
    }
  }

  const [after] = await db
    .update(quoteRequests)
    .set({ ...patch, ...timestampPatch, updatedAt: now })
    .where(eq(quoteRequests.id, id))
    .returning();

  if (!after) return;

  const events: {
    type: string;
    message: string;
    metadata?: Record<string, unknown>;
  }[] = [];

  if (patch.status && patch.status !== before.status) {
    events.push({
      type: 'status_changed',
      message: `Status changed from ${before.status} to ${patch.status}.`,
      metadata: { from: before.status, to: patch.status },
    });
  }

  if (
    after.qualificationStatus === 'QUALIFIED' &&
    before.qualificationStatus !== 'QUALIFIED'
  ) {
    events.push({
      type: 'lead_qualified',
      message: 'Lead marked qualified.',
      metadata: { qualificationStatus: after.qualificationStatus },
    });
    try {
      await enqueueOfflineConversionForQuote(after, 'QUALIFIED_LEAD');
    } catch (error) {
      console.warn('google_ads.conversion.queue_failed', {
        quoteRequestId: id,
        requestNumber: after.publicId,
        stage: 'QUALIFIED_LEAD',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  if (after.status === 'WON' && before.status !== 'WON') {
    try {
      await enqueueOfflineConversionForQuote(after, 'WON_JOB');
    } catch (error) {
      console.warn('google_ads.conversion.queue_failed', {
        quoteRequestId: id,
        requestNumber: after.publicId,
        stage: 'WON_JOB',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  if (patch.lostReason !== undefined && patch.lostReason !== before.lostReason) {
    events.push({
      type: patch.lostReason ? 'lost_reason_updated' : 'lost_reason_cleared',
      message: patch.lostReason ? 'Lost reason updated.' : 'Lost reason cleared.',
      metadata: { hasLostReason: Boolean(patch.lostReason) },
    });
  }

  if (patch.internalNotes !== undefined && patch.internalNotes !== before.internalNotes) {
    events.push({
      type: patch.internalNotes ? 'internal_notes_updated' : 'internal_notes_cleared',
      message: patch.internalNotes ? 'Internal notes updated.' : 'Internal notes cleared.',
      metadata: { hasInternalNotes: Boolean(patch.internalNotes) },
    });
  }

  if (
    (patch.estimatedJobValueCad !== undefined &&
      patch.estimatedJobValueCad !== before.estimatedJobValueCad) ||
    (patch.finalJobValueCad !== undefined && patch.finalJobValueCad !== before.finalJobValueCad) ||
    (patch.betondispoRevenueCad !== undefined &&
      patch.betondispoRevenueCad !== before.betondispoRevenueCad) ||
    (patch.supplierSelected !== undefined && patch.supplierSelected !== before.supplierSelected) ||
    (patch.serviceDate !== undefined && patch.serviceDate !== before.serviceDate)
  ) {
    events.push({
      type: 'business_outcome_updated',
      message: 'Business outcome fields updated.',
      metadata: {
        hasEstimatedValue: Boolean(patch.estimatedJobValueCad),
        hasFinalValue: Boolean(patch.finalJobValueCad),
        hasRevenue: Boolean(patch.betondispoRevenueCad),
        hasSupplier: Boolean(patch.supplierSelected),
        hasServiceDate: Boolean(patch.serviceDate),
      },
    });
  }

  if (events.length === 0) return;

  try {
    await db.insert(quoteRequestEvents).values(
      events.map((event) => ({
        quoteRequestId: id,
        actor: 'admin',
        type: event.type,
        message: event.message,
        metadata: event.metadata,
      })),
    );
  } catch (error) {
    console.warn('[admin] failed to record quote request event', {
      quoteRequestId: id,
      eventCount: events.length,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Distinct cities, for the filter dropdown. */
export async function listCities(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ city: quoteRequests.city })
    .from(quoteRequests)
    .orderBy(asc(quoteRequests.city));
  return rows.map((row) => row.city);
}

export type DashboardStats = {
  last7: number;
  last30: number;
  total: number;
  qualified: number;
  won: number;
  lost: number;
  contractors: number;
  homeowners: number;
  /** Share of all requests that reached WON, as a fraction. */
  wonRate: number;
  /** Share of requests an operator judged workable, as a fraction. */
  qualifiedRate: number;
  topCities: { city: string; count: number }[];
};

/**
 * The Phase-1 scoreboard.
 *
 * The question this answers is whether demand is growing, which is why the two
 * headline numbers are request counts over rolling windows rather than traffic.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();

  const qualifiedList = sql.raw(QUALIFIED_STATUSES.map((s) => `'${s}'`).join(', '));

  const [[totals], topCities] = await Promise.all([
    db
      .select({
        last7:
          sql<number>`count(*) filter (where ${quoteRequests.createdAt} >= now() - interval '7 days')`.mapWith(
            Number,
          ),
        last30:
          sql<number>`count(*) filter (where ${quoteRequests.createdAt} >= now() - interval '30 days')`.mapWith(
            Number,
          ),
        total: sql<number>`count(*)`.mapWith(Number),
        qualified:
          sql<number>`count(*) filter (where ${quoteRequests.status} in (${qualifiedList}))`.mapWith(
            Number,
          ),
        won: sql<number>`count(*) filter (where ${quoteRequests.status} = 'WON')`.mapWith(Number),
        lost: sql<number>`count(*) filter (where ${quoteRequests.status} = 'LOST')`.mapWith(Number),
        contractors:
          sql<number>`count(*) filter (where ${quoteRequests.customerType} = 'BUSINESS')`.mapWith(
            Number,
          ),
        homeowners:
          sql<number>`count(*) filter (where ${quoteRequests.customerType} = 'INDIVIDUAL')`.mapWith(
            Number,
          ),
      })
      .from(quoteRequests),
    db
      .select({ city: quoteRequests.city, count: count() })
      .from(quoteRequests)
      .groupBy(quoteRequests.city)
      .orderBy(desc(count()), asc(quoteRequests.city))
      .limit(6),
  ]);

  const base = totals ?? {
    last7: 0,
    last30: 0,
    total: 0,
    qualified: 0,
    won: 0,
    lost: 0,
    contractors: 0,
    homeowners: 0,
  };

  return {
    ...base,
    wonRate: base.total > 0 ? base.won / base.total : 0,
    qualifiedRate: base.total > 0 ? base.qualified / base.total : 0,
    topCities,
  };
}

export type AnalyticsFilters = {
  from?: Date;
  to?: Date;
  source?: string;
  medium?: string;
  campaign?: string;
  gclidPresent?: boolean;
  locale?: 'fr' | 'en';
  projectType?: string;
  city?: string;
  status?: QuoteStatus;
  customerType?: CustomerType;
  deviceCategory?: string;
  landingPage?: string;
};

export type AnalyticsGroupRow = {
  label: string;
  leads: number;
  contacted: number;
  won: number;
  volumeM3: number;
  revenueCad: number;
};

export type AnalyticsLeadRow = {
  id: string;
  publicId: string;
  createdAt: Date;
  customerType: CustomerType;
  projectType: string;
  city: string;
  estimatedVolumeM3: string | null;
  volumeUnknown: boolean;
  desiredDate: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landingPage: string | null;
  hasGclid: boolean;
  status: QuoteStatus;
  responseMinutes: number | null;
  revenueCad: string | null;
};

export type AdvertisingCampaignRow = {
  campaignId: string;
  campaignName: string;
  campaignStatus: string | null;
  campaignType: string | null;
  spendCad: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  averageCpcCad: number | null;
  googleReportedConversions: number;
  googleReportedConversionValue: number;
};

export type AdvertisingTimeRow = {
  date: string;
  spendCad: number;
  clicks: number;
  googleReportedConversions: number;
};

export type AnalyticsReport = {
  kpis: {
    total: number;
    newLeads: number;
    contacted: number;
    quoted: number;
    won: number;
    lost: number;
    open: number;
    winRate: number;
    totalVolumeM3: number;
    averageResponseMinutes: number | null;
    medianResponseMinutes: number | null;
    respondedWithin15: number | null;
    respondedWithin60: number | null;
    respondedWithin24h: number | null;
    estimatedJobValueCad: number;
    finalJobValueCad: number;
    betondispoRevenueCad: number;
    averageLeadValueCad: number | null;
  };
  advertising: {
    spendCad: number;
    impressions: number;
    clicks: number;
    ctr: number | null;
    averageCpcCad: number | null;
    gclidQuotes: number;
    gclidQualifiedLeads: number;
    gclidWonJobs: number;
    gclidRevenueCad: number;
    costPerQuoteCad: number | null;
    costPerQualifiedLeadCad: number | null;
    costPerWonJobCad: number | null;
    betondispoRevenueRoas: number | null;
    campaigns: AdvertisingCampaignRow[];
    overTime: AdvertisingTimeRow[];
  };
  funnel: { stage: string; count: number; rateFromPrevious: number | null; rateFromSubmitted: number }[];
  quotesOverTime: { date: string; quotes: number; won: number }[];
  byStatus: AnalyticsGroupRow[];
  bySource: AnalyticsGroupRow[];
  byCampaign: AnalyticsGroupRow[];
  byLandingPage: AnalyticsGroupRow[];
  byQuoteEntryPage: AnalyticsGroupRow[];
  byProjectType: AnalyticsGroupRow[];
  byCity: AnalyticsGroupRow[];
  byDevice: AnalyticsGroupRow[];
  byLocale: AnalyticsGroupRow[];
  gclidSplit: AnalyticsGroupRow[];
  googleAdsLeads: AnalyticsLeadRow[];
  requestRows: AnalyticsLeadRow[];
};

function analyticsWhere(filters: AnalyticsFilters): SQL | undefined {
  const clauses: SQL[] = [];
  const source = sql<string>`coalesce(${quoteRequests.firstTouchSource}, ${quoteRequests.utmSource})`;
  const medium = sql<string>`coalesce(${quoteRequests.firstTouchMedium}, ${quoteRequests.utmMedium})`;
  const campaign = sql<string>`coalesce(${quoteRequests.firstTouchCampaign}, ${quoteRequests.utmCampaign})`;
  const landing = sql<string>`coalesce(${quoteRequests.firstTouchLandingPage}, ${quoteRequests.landingPage})`;

  if (filters.from) clauses.push(gte(quoteRequests.createdAt, filters.from));
  if (filters.to) clauses.push(lte(quoteRequests.createdAt, filters.to));
  if (filters.source) clauses.push(ilike(source, `${filters.source}%`));
  if (filters.medium) clauses.push(ilike(medium, `${filters.medium}%`));
  if (filters.campaign) clauses.push(ilike(campaign, `${filters.campaign}%`));
  if (filters.gclidPresent === true) clauses.push(sql`${quoteRequests.gclid} is not null`);
  if (filters.gclidPresent === false) clauses.push(sql`${quoteRequests.gclid} is null`);
  if (filters.locale) clauses.push(eq(quoteRequests.locale, filters.locale));
  if (filters.projectType) clauses.push(eq(quoteRequests.projectType, filters.projectType as never));
  if (filters.city) clauses.push(ilike(quoteRequests.city, `${filters.city}%`));
  if (filters.status) clauses.push(eq(quoteRequests.status, filters.status));
  if (filters.customerType) clauses.push(eq(quoteRequests.customerType, filters.customerType));
  if (filters.deviceCategory) clauses.push(eq(quoteRequests.deviceCategory, filters.deviceCategory));
  if (filters.landingPage) clauses.push(ilike(landing, `${filters.landingPage}%`));

  return clauses.length ? and(...clauses) : undefined;
}

const contactedStatuses = sql.raw(
  ['CONTACTED', 'QUALIFIED', 'QUOTING', 'OFFER_SENT', 'WON', 'LOST'].map((s) => `'${s}'`).join(', '),
);

function groupSelect(label: SQL<string>) {
  return {
    label,
    leads: sql<number>`count(*)`.mapWith(Number),
    contacted:
      sql<number>`count(*) filter (where ${quoteRequests.status} in (${contactedStatuses}))`.mapWith(
        Number,
      ),
    won: sql<number>`count(*) filter (where ${quoteRequests.status} = 'WON')`.mapWith(Number),
    volumeM3:
      sql<number>`coalesce(sum(${quoteRequests.estimatedVolumeM3}::numeric) filter (where ${quoteRequests.volumeUnknown} = false), 0)`.mapWith(
        Number,
      ),
    revenueCad:
      sql<number>`coalesce(sum(${quoteRequests.finalJobValueCad}::numeric), 0)`.mapWith(Number),
  };
}

async function groupedAnalytics(
  label: SQL<string>,
  filters: AnalyticsFilters,
  limit = 10,
): Promise<AnalyticsGroupRow[]> {
  const db = await getDb();
  const where = analyticsWhere(filters);
  const rows = await db
    .select(groupSelect(label))
    .from(quoteRequests)
    .where(where)
    .groupBy(label)
    .orderBy(desc(count()))
    .limit(limit);
  return rows.map((row) => ({ ...row, label: row.label || 'Unknown' }));
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function isoDateInToronto(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '01';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function adsWhere(filters: AnalyticsFilters): SQL | undefined {
  const clauses: SQL[] = [eq(googleAdsDailyPerformance.granularity, 'CAMPAIGN')];
  if (filters.from) clauses.push(gte(googleAdsDailyPerformance.reportDate, isoDateInToronto(filters.from)));
  if (filters.to) clauses.push(lte(googleAdsDailyPerformance.reportDate, isoDateInToronto(filters.to)));
  return and(...clauses);
}

export async function getAnalyticsReport(filters: AnalyticsFilters): Promise<AnalyticsReport> {
  const db = await getDb();
  const where = analyticsWhere(filters);
  const source = sql<string>`coalesce(${quoteRequests.firstTouchSource}, ${quoteRequests.utmSource}, 'Unknown')`;
  const medium = sql<string>`coalesce(${quoteRequests.firstTouchMedium}, ${quoteRequests.utmMedium}, 'Unknown')`;
  const campaign = sql<string>`coalesce(${quoteRequests.firstTouchCampaign}, ${quoteRequests.utmCampaign}, 'Unknown')`;
  const landing = sql<string>`coalesce(${quoteRequests.firstTouchLandingPage}, ${quoteRequests.landingPage}, 'Unknown')`;
  const responseMinutes = sql<number>`extract(epoch from (${quoteRequests.firstResponseAt} - ${quoteRequests.createdAt})) / 60`;

  const [kpiRow] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      newLeads: sql<number>`count(*) filter (where ${quoteRequests.status} = 'NEW')`.mapWith(Number),
      contacted:
        sql<number>`count(*) filter (where ${quoteRequests.status} in (${contactedStatuses}))`.mapWith(
          Number,
        ),
      quoted:
        sql<number>`count(*) filter (where ${quoteRequests.status} in ('OFFER_SENT', 'WON'))`.mapWith(
          Number,
        ),
      won: sql<number>`count(*) filter (where ${quoteRequests.status} = 'WON')`.mapWith(Number),
      lost: sql<number>`count(*) filter (where ${quoteRequests.status} in ('LOST', 'INVALID'))`.mapWith(Number),
      open:
        sql<number>`count(*) filter (where ${quoteRequests.status} not in ('WON', 'LOST', 'INVALID'))`.mapWith(
          Number,
        ),
      totalVolumeM3:
        sql<number>`coalesce(sum(${quoteRequests.estimatedVolumeM3}::numeric) filter (where ${quoteRequests.volumeUnknown} = false), 0)`.mapWith(
          Number,
        ),
      averageResponseMinutes: sql<number | null>`avg(${responseMinutes})`.mapWith((v) =>
        v == null ? null : Number(v),
      ),
      medianResponseMinutes:
        sql<number | null>`percentile_cont(0.5) within group (order by ${responseMinutes}) filter (where ${quoteRequests.firstResponseAt} is not null)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      respondedWithin15:
        sql<number | null>`avg(case when ${quoteRequests.firstResponseAt} is null then null when ${responseMinutes} <= 15 then 1 else 0 end)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      respondedWithin60:
        sql<number | null>`avg(case when ${quoteRequests.firstResponseAt} is null then null when ${responseMinutes} <= 60 then 1 else 0 end)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      respondedWithin24h:
        sql<number | null>`avg(case when ${quoteRequests.firstResponseAt} is null then null when ${responseMinutes} <= 1440 then 1 else 0 end)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      estimatedJobValueCad:
        sql<number>`coalesce(sum(${quoteRequests.estimatedJobValueCad}::numeric), 0)`.mapWith(Number),
      finalJobValueCad:
        sql<number>`coalesce(sum(${quoteRequests.finalJobValueCad}::numeric), 0)`.mapWith(Number),
      betondispoRevenueCad:
        sql<number>`coalesce(sum(${quoteRequests.betondispoRevenueCad}::numeric), 0)`.mapWith(Number),
    })
    .from(quoteRequests)
    .where(where);

  const requestRowsPromise = db
    .select({
      id: quoteRequests.id,
      publicId: quoteRequests.publicId,
      createdAt: quoteRequests.createdAt,
      customerType: quoteRequests.customerType,
      projectType: quoteRequests.projectType,
      city: quoteRequests.city,
      estimatedVolumeM3: quoteRequests.estimatedVolumeM3,
      volumeUnknown: quoteRequests.volumeUnknown,
      desiredDate: quoteRequests.desiredDate,
      source,
      medium,
      campaign,
      landingPage: landing,
      hasGclid: sql<boolean>`${quoteRequests.gclid} is not null`.mapWith(Boolean),
      status: quoteRequests.status,
      responseMinutes: sql<number | null>`${responseMinutes}`.mapWith((v) =>
        v == null ? null : Number(v),
      ),
      revenueCad: quoteRequests.finalJobValueCad,
    })
    .from(quoteRequests)
    .where(where)
    .orderBy(desc(quoteRequests.createdAt))
    .limit(50);

  const adsDateWhere = adsWhere(filters);
  const googleAdsLeadWhere = and(...[where, sql`${quoteRequests.gclid} is not null`].filter(Boolean) as SQL[]);

  const [
    [adsTotals],
    [googleAdsInternalTotals],
    adCampaigns,
    adsOverTime,
    quotesOverTime,
    byStatus,
    bySource,
    byCampaign,
    byLandingPage,
    byQuoteEntryPage,
    byProjectType,
    byCity,
    byDevice,
    byLocale,
    gclidSplit,
    googleAdsLeads,
    requestRows,
  ] = await Promise.all([
    db
      .select({
        spendCad: sql<number>`coalesce(sum(${googleAdsDailyPerformance.costMicros}) / 1000000.0, 0)`.mapWith(Number),
        impressions: sql<number>`coalesce(sum(${googleAdsDailyPerformance.impressions}), 0)`.mapWith(Number),
        clicks: sql<number>`coalesce(sum(${googleAdsDailyPerformance.clicks}), 0)`.mapWith(Number),
        googleReportedConversions:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.conversions}::numeric), 0)`.mapWith(Number),
        googleReportedConversionValue:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.conversionValue}::numeric), 0)`.mapWith(Number),
      })
      .from(googleAdsDailyPerformance)
      .where(adsDateWhere),
    db
      .select({
        gclidQuotes: sql<number>`count(*) filter (where ${quoteRequests.gclid} is not null)`.mapWith(Number),
        gclidQualifiedLeads:
          sql<number>`count(*) filter (where ${quoteRequests.gclid} is not null and ${quoteRequests.qualificationStatus} = 'QUALIFIED')`.mapWith(
            Number,
          ),
        gclidWonJobs:
          sql<number>`count(*) filter (where ${quoteRequests.gclid} is not null and ${quoteRequests.status} = 'WON')`.mapWith(
            Number,
          ),
        gclidRevenueCad:
          sql<number>`coalesce(sum(${quoteRequests.betondispoRevenueCad}::numeric) filter (where ${quoteRequests.gclid} is not null), 0)`.mapWith(
            Number,
          ),
      })
      .from(quoteRequests)
      .where(where),
    db
      .select({
        campaignId: googleAdsDailyPerformance.campaignId,
        campaignName: sql<string>`max(${googleAdsDailyPerformance.campaignName})`,
        campaignStatus: sql<string | null>`max(${googleAdsDailyPerformance.campaignStatus})`,
        campaignType: sql<string | null>`max(${googleAdsDailyPerformance.campaignType})`,
        spendCad:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.costMicros}) / 1000000.0, 0)`.mapWith(
            Number,
          ),
        impressions: sql<number>`coalesce(sum(${googleAdsDailyPerformance.impressions}), 0)`.mapWith(Number),
        clicks: sql<number>`coalesce(sum(${googleAdsDailyPerformance.clicks}), 0)`.mapWith(Number),
        googleReportedConversions:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.conversions}::numeric), 0)`.mapWith(Number),
        googleReportedConversionValue:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.conversionValue}::numeric), 0)`.mapWith(Number),
      })
      .from(googleAdsDailyPerformance)
      .where(adsDateWhere)
      .groupBy(googleAdsDailyPerformance.campaignId)
      .orderBy(desc(sql`sum(${googleAdsDailyPerformance.costMicros})`))
      .limit(25),
    db
      .select({
        date: googleAdsDailyPerformance.reportDate,
        spendCad:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.costMicros}) / 1000000.0, 0)`.mapWith(
            Number,
          ),
        clicks: sql<number>`coalesce(sum(${googleAdsDailyPerformance.clicks}), 0)`.mapWith(Number),
        googleReportedConversions:
          sql<number>`coalesce(sum(${googleAdsDailyPerformance.conversions}::numeric), 0)`.mapWith(Number),
      })
      .from(googleAdsDailyPerformance)
      .where(adsDateWhere)
      .groupBy(googleAdsDailyPerformance.reportDate)
      .orderBy(googleAdsDailyPerformance.reportDate),
    db
      .select({
        date: sql<string>`to_char(${quoteRequests.createdAt} at time zone 'America/Toronto', 'YYYY-MM-DD')`,
        quotes: sql<number>`count(*)`.mapWith(Number),
        won: sql<number>`count(*) filter (where ${quoteRequests.status} = 'WON')`.mapWith(Number),
      })
      .from(quoteRequests)
      .where(where)
      .groupBy(sql`to_char(${quoteRequests.createdAt} at time zone 'America/Toronto', 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${quoteRequests.createdAt} at time zone 'America/Toronto', 'YYYY-MM-DD')`),
    groupedAnalytics(sql<string>`${quoteRequests.status}::text`, filters),
    groupedAnalytics(sql<string>`coalesce(${source} || ' / ' || ${medium}, 'Unknown')`, filters),
    groupedAnalytics(campaign, filters),
    groupedAnalytics(landing, filters),
    groupedAnalytics(sql<string>`coalesce(${quoteRequests.quoteEntryPage}, 'Unknown')`, filters),
    groupedAnalytics(sql<string>`${quoteRequests.projectType}::text`, filters),
    groupedAnalytics(sql<string>`${quoteRequests.city}`, filters),
    groupedAnalytics(sql<string>`coalesce(${quoteRequests.deviceCategory}, 'Unknown')`, filters),
    groupedAnalytics(sql<string>`${quoteRequests.locale}::text`, filters),
    groupedAnalytics(
      sql<string>`case when ${quoteRequests.gclid} is not null then 'Google Ads click identified' else 'No GCLID' end`,
      filters,
      2,
    ),
    db
      .select({
        id: quoteRequests.id,
        publicId: quoteRequests.publicId,
        createdAt: quoteRequests.createdAt,
        customerType: quoteRequests.customerType,
        projectType: quoteRequests.projectType,
        city: quoteRequests.city,
        estimatedVolumeM3: quoteRequests.estimatedVolumeM3,
        volumeUnknown: quoteRequests.volumeUnknown,
        desiredDate: quoteRequests.desiredDate,
        source,
        medium,
        campaign,
        landingPage: landing,
        hasGclid: sql<boolean>`true`.mapWith(Boolean),
        status: quoteRequests.status,
        responseMinutes: sql<number | null>`${responseMinutes}`.mapWith((v) =>
          v == null ? null : Number(v),
        ),
        revenueCad: quoteRequests.finalJobValueCad,
      })
      .from(quoteRequests)
      .where(googleAdsLeadWhere)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(25),
    requestRowsPromise,
  ]);

  const kpis = kpiRow ?? {
    total: 0,
    newLeads: 0,
    contacted: 0,
    quoted: 0,
    won: 0,
    lost: 0,
    open: 0,
    totalVolumeM3: 0,
    averageResponseMinutes: null,
    medianResponseMinutes: null,
    respondedWithin15: null,
    respondedWithin60: null,
    respondedWithin24h: null,
    estimatedJobValueCad: 0,
    finalJobValueCad: 0,
    betondispoRevenueCad: 0,
  };

  const submitted = kpis.total;
  const ads = adsTotals ?? {
    spendCad: 0,
    impressions: 0,
    clicks: 0,
    googleReportedConversions: 0,
    googleReportedConversionValue: 0,
  };
  const adsInternal = googleAdsInternalTotals ?? {
    gclidQuotes: 0,
    gclidQualifiedLeads: 0,
    gclidWonJobs: 0,
    gclidRevenueCad: 0,
  };
  const funnelCounts = [
    { stage: 'Submitted', count: submitted },
    { stage: 'Contacted', count: kpis.contacted },
    { stage: 'Quoted', count: kpis.quoted },
    { stage: 'Won', count: kpis.won },
  ];

  return {
    kpis: {
      ...kpis,
      winRate: percent(kpis.won, kpis.total),
      averageLeadValueCad: kpis.won > 0 ? kpis.finalJobValueCad / kpis.won : null,
    },
    advertising: {
      spendCad: ads.spendCad,
      impressions: ads.impressions,
      clicks: ads.clicks,
      ctr: ratio(ads.clicks, ads.impressions),
      averageCpcCad: ratio(ads.spendCad, ads.clicks),
      gclidQuotes: adsInternal.gclidQuotes,
      gclidQualifiedLeads: adsInternal.gclidQualifiedLeads,
      gclidWonJobs: adsInternal.gclidWonJobs,
      gclidRevenueCad: adsInternal.gclidRevenueCad,
      costPerQuoteCad: ratio(ads.spendCad, adsInternal.gclidQuotes),
      costPerQualifiedLeadCad: ratio(ads.spendCad, adsInternal.gclidQualifiedLeads),
      costPerWonJobCad: ratio(ads.spendCad, adsInternal.gclidWonJobs),
      betondispoRevenueRoas: ratio(adsInternal.gclidRevenueCad, ads.spendCad),
      campaigns: adCampaigns.map((row) => ({
        ...row,
        ctr: ratio(row.clicks, row.impressions),
        averageCpcCad: ratio(row.spendCad, row.clicks),
      })),
      overTime: adsOverTime,
    },
    funnel: funnelCounts.map((stage, index) => ({
      ...stage,
      rateFromPrevious:
        index === 0 ? null : percent(stage.count, funnelCounts[index - 1]?.count ?? 0),
      rateFromSubmitted: percent(stage.count, submitted),
    })),
    quotesOverTime,
    byStatus,
    bySource,
    byCampaign,
    byLandingPage,
    byQuoteEntryPage,
    byProjectType,
    byCity,
    byDevice,
    byLocale,
    gclidSplit,
    googleAdsLeads,
    requestRows,
  };
}

export type GoogleAdsIntegrationDashboard = {
  lastSync: {
    startedAt: Date;
    completedAt: Date | null;
    status: string;
    startDate: string;
    endDate: string;
    rowsReceived: number;
    rowsUpserted: number;
    errorCode: string | null;
  } | null;
  queue: { status: string; count: number }[];
  recentFailures: {
    id: string;
    requestNumber: string;
    conversionStage: string;
    attemptCount: number;
    googleErrorCode: string | null;
    sanitizedError: string | null;
    createdAt: Date;
  }[];
};

export async function getGoogleAdsIntegrationDashboard(): Promise<GoogleAdsIntegrationDashboard> {
  const db = await getDb();
  const [lastSync, queue, recentFailures] = await Promise.all([
    db
      .select({
        startedAt: googleAdsSyncRuns.startedAt,
        completedAt: googleAdsSyncRuns.completedAt,
        status: googleAdsSyncRuns.status,
        startDate: googleAdsSyncRuns.startDate,
        endDate: googleAdsSyncRuns.endDate,
        rowsReceived: googleAdsSyncRuns.rowsReceived,
        rowsUpserted: googleAdsSyncRuns.rowsUpserted,
        errorCode: googleAdsSyncRuns.errorCode,
      })
      .from(googleAdsSyncRuns)
      .orderBy(desc(googleAdsSyncRuns.startedAt))
      .limit(1),
    db
      .select({
        status: sql<string>`${googleAdsOfflineConversions.uploadStatus}::text`,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(googleAdsOfflineConversions)
      .groupBy(googleAdsOfflineConversions.uploadStatus),
    db
      .select({
        id: googleAdsOfflineConversions.id,
        requestNumber: googleAdsOfflineConversions.requestNumber,
        conversionStage: sql<string>`${googleAdsOfflineConversions.conversionStage}::text`,
        attemptCount: googleAdsOfflineConversions.attemptCount,
        googleErrorCode: googleAdsOfflineConversions.googleErrorCode,
        sanitizedError: googleAdsOfflineConversions.sanitizedError,
        createdAt: googleAdsOfflineConversions.createdAt,
      })
      .from(googleAdsOfflineConversions)
      .where(
        sql`${googleAdsOfflineConversions.uploadStatus} in ('RETRY', 'PERMANENTLY_FAILED', 'SKIPPED')`,
      )
      .orderBy(desc(googleAdsOfflineConversions.createdAt))
      .limit(10),
  ]);

  return {
    lastSync: lastSync[0] ?? null,
    queue,
    recentFailures,
  };
}

export type SupplierAnalyticsRow = {
  id: string;
  name: string;
  status: string;
  leadsSent: number;
  viewed: number;
  responded: number;
  responseRate: number | null;
  medianResponseMinutes: number | null;
  quotesSupplied: number;
  acceptedJobs: number;
  wonJobs: number;
  declined: number;
  declineRate: number | null;
  winRate: number | null;
  totalJobValueCad: number;
  betondispoRevenueCad: number;
};

export async function getSupplierAnalytics(): Promise<SupplierAnalyticsRow[]> {
  const db = await getDb();
  return db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      status: sql<string>`${suppliers.status}::text`,
      leadsSent:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.sentAt} is not null)`.mapWith(
          Number,
        ),
      viewed:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.viewedAt} is not null)`.mapWith(
          Number,
        ),
      responded:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.respondedAt} is not null)`.mapWith(
          Number,
        ),
      responseRate:
        sql<number | null>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.respondedAt} is not null)::numeric / nullif(count(${supplierAssignments.id}) filter (where ${supplierAssignments.sentAt} is not null), 0)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      medianResponseMinutes:
        sql<number | null>`percentile_cont(0.5) within group (order by extract(epoch from (${supplierAssignments.respondedAt} - ${supplierAssignments.sentAt})) / 60) filter (where ${supplierAssignments.sentAt} is not null and ${supplierAssignments.respondedAt} is not null)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      quotesSupplied:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} in ('QUOTED', 'ACCEPTED', 'WON'))`.mapWith(
          Number,
        ),
      acceptedJobs:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} in ('ACCEPTED', 'WON'))`.mapWith(
          Number,
        ),
      wonJobs:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} = 'WON')`.mapWith(
          Number,
        ),
      declined:
        sql<number>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} = 'DECLINED')`.mapWith(
          Number,
        ),
      declineRate:
        sql<number | null>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} = 'DECLINED')::numeric / nullif(count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} in ('DECLINED', 'LOST', 'WON')), 0)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      winRate:
        sql<number | null>`count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} = 'WON')::numeric / nullif(count(${supplierAssignments.id}) filter (where ${supplierAssignments.responseStatus} in ('DECLINED', 'LOST', 'WON')), 0)`.mapWith(
          (v) => (v == null ? null : Number(v)),
        ),
      totalJobValueCad:
        sql<number>`coalesce(sum(${quoteRequests.finalJobValueCad}::numeric) filter (where ${supplierAssignments.responseStatus} = 'WON'), 0)`.mapWith(
          Number,
        ),
      betondispoRevenueCad:
        sql<number>`coalesce(sum(${quoteRequests.betondispoRevenueCad}::numeric) filter (where ${supplierAssignments.responseStatus} = 'WON'), 0)`.mapWith(
          Number,
        ),
    })
    .from(suppliers)
    .leftJoin(supplierAssignments, eq(supplierAssignments.supplierId, suppliers.id))
    .leftJoin(quoteRequests, eq(quoteRequests.id, supplierAssignments.quoteRequestId))
    .groupBy(suppliers.id)
    .orderBy(desc(sql`count(${supplierAssignments.id})`), asc(suppliers.name));
}

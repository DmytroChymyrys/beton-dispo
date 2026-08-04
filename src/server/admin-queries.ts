import 'server-only';

import { and, asc, count, desc, eq, gte, ilike, lte, sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quoteRequestEvents, quoteRequests, type QuoteRequest, type QuoteRequestEvent } from '@/db/schema';
import { QUALIFIED_STATUSES, type CustomerType, type QuoteStatus } from '@/lib/quote-options';

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
  patch: { status?: QuoteStatus; internalNotes?: string | null; lostReason?: string | null },
): Promise<void> {
  const db = await getDb();
  const [before] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  if (!before) return;

  const [after] = await db
    .update(quoteRequests)
    .set({ ...patch, updatedAt: new Date() })
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

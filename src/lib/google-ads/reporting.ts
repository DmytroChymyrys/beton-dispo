import 'server-only';

import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { googleAdsDailyPerformance, googleAdsSyncRuns } from '@/db/schema';
import { getGoogleAdsConfigOrThrow } from './config';
import { googleAdsSearchStream } from './client';
import { sanitizeGoogleAdsError } from './errors';
import { mapGoogleAdsPerformanceRow } from './mappers';
import type { GoogleAdsGranularity, GoogleAdsPerformanceRow, GoogleAdsSyncSummary } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(value: string, label: string): string {
  if (!ISO_DATE.test(value)) throw new Error(`${label} must be YYYY-MM-DD`);
  return value;
}

function reportingQuery(startDate: string, endDate: string, granularity: GoogleAdsGranularity): string {
  const adGroupFields =
    granularity === 'AD_GROUP'
      ? `
        ad_group.id,
        ad_group.name,`
      : '';

  return `
    SELECT
      segments.date,
      customer.id,
      customer.currency_code,
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      ${adGroupFields}
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.all_conversions,
      metrics.all_conversions_value,
      metrics.interactions
    FROM ${granularity === 'AD_GROUP' ? 'ad_group' : 'campaign'}
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `;
}

async function upsertPerformanceRows(rows: GoogleAdsPerformanceRow[]): Promise<number> {
  const db = await getDb();
  let upserted = 0;
  const now = new Date();

  for (const row of rows) {
    await db
      .insert(googleAdsDailyPerformance)
      .values({
        customerId: row.customerId,
        reportDate: row.date,
        granularity: row.granularity,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        campaignStatus: row.campaignStatus,
        campaignType: row.campaignType,
        adGroupId: row.adGroupId,
        adGroupName: row.adGroupName,
        currencyCode: row.currencyCode,
        impressions: row.impressions,
        clicks: row.clicks,
        costMicros: row.costMicros,
        conversions: row.conversions,
        conversionValue: row.conversionValue,
        allConversions: row.allConversions,
        allConversionValue: row.allConversionValue,
        interactions: row.interactions,
        syncedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: googleAdsDailyPerformance.performanceKey,
        set: {
          campaignName: row.campaignName,
          campaignStatus: row.campaignStatus,
          campaignType: row.campaignType,
          adGroupName: row.adGroupName,
          currencyCode: row.currencyCode,
          impressions: row.impressions,
          clicks: row.clicks,
          costMicros: row.costMicros,
          conversions: row.conversions,
          conversionValue: row.conversionValue,
          allConversions: row.allConversions,
          allConversionValue: row.allConversionValue,
          interactions: row.interactions,
          syncedAt: now,
          updatedAt: now,
        },
      });
    upserted += 1;
  }

  return upserted;
}

export async function syncGoogleAdsPerformance({
  startDate,
  endDate,
  granularity = 'CAMPAIGN',
  initiatedBy = 'admin',
}: {
  startDate: string;
  endDate: string;
  granularity?: GoogleAdsGranularity;
  initiatedBy?: string;
}): Promise<GoogleAdsSyncSummary> {
  const safeStart = assertDate(startDate, 'startDate');
  const safeEnd = assertDate(endDate, 'endDate');
  const db = await getDb();
  let runId: string | null = null;

  try {
    getGoogleAdsConfigOrThrow();
    const [run] = await db
      .insert(googleAdsSyncRuns)
      .values({
        startDate: safeStart,
        endDate: safeEnd,
        status: 'RUNNING',
        initiatedBy,
      })
      .returning();
    runId = run?.id ?? null;

    console.info('google_ads.reporting.sync_started', {
      runId,
      startDate: safeStart,
      endDate: safeEnd,
      granularity,
    });

    const response = await googleAdsSearchStream(reportingQuery(safeStart, safeEnd, granularity));
    const rows = response.results
      .map((row) => mapGoogleAdsPerformanceRow(row, granularity))
      .filter((row): row is GoogleAdsPerformanceRow => Boolean(row));
    const rowsUpserted = await upsertPerformanceRows(rows);

    if (runId) {
      await db
        .update(googleAdsSyncRuns)
        .set({
          completedAt: new Date(),
          status: 'SUCCEEDED',
          rowsReceived: rows.length,
          rowsUpserted,
          apiCalls: response.apiCalls,
        })
        .where(eq(googleAdsSyncRuns.id, runId));
    }

    console.info('google_ads.reporting.sync_completed', {
      runId,
      rowsReceived: rows.length,
      rowsUpserted,
      apiCalls: response.apiCalls,
    });

    return {
      configured: true,
      runId,
      startDate: safeStart,
      endDate: safeEnd,
      granularity,
      rowsReceived: rows.length,
      rowsUpserted,
      apiCalls: response.apiCalls,
      status: 'SUCCEEDED',
      errorCode: null,
      sanitizedError: null,
    };
  } catch (error) {
    const safe = sanitizeGoogleAdsError(error);
    if (runId) {
      await db
        .update(googleAdsSyncRuns)
        .set({
          completedAt: new Date(),
          status: 'FAILED',
          errorCode: safe.code,
          sanitizedError: safe.message,
        })
        .where(eq(googleAdsSyncRuns.id, runId));
    }

    console.warn('google_ads.reporting.sync_failed', {
      runId,
      startDate: safeStart,
      endDate: safeEnd,
      granularity,
      errorCode: safe.code,
    });

    return {
      configured: safe.code !== 'not_configured',
      runId,
      startDate: safeStart,
      endDate: safeEnd,
      granularity,
      rowsReceived: 0,
      rowsUpserted: 0,
      apiCalls: 0,
      status: 'FAILED',
      errorCode: safe.code,
      sanitizedError: safe.message,
    };
  }
}

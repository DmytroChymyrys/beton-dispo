import 'server-only';

import { and, asc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { googleAdsOfflineConversions } from '@/db/schema';
import { getGoogleAdsConfigOrThrow, getGoogleAdsPublicConfig } from './config';
import { googleAdsUploadClickConversions } from './client';
import { sanitizeGoogleAdsError } from './errors';
import type {
  OfflineConversionQueueResult,
  OfflineConversionSourceQuote,
  OfflineConversionStage,
} from './types';

type ProcessSummary = {
  mode: 'disabled' | 'dry_run' | 'enabled';
  selected: number;
  uploaded: number;
  skipped: number;
  failed: number;
};

function stageSuffix(stage: OfflineConversionStage): 'QUALIFIED' | 'WON' {
  return stage === 'QUALIFIED_LEAD' ? 'QUALIFIED' : 'WON';
}

function conversionActionId(stage: OfflineConversionStage): string | null {
  const config = getGoogleAdsConfigOrThrow();
  return stage === 'QUALIFIED_LEAD' ? config.qualifiedLeadActionId : config.wonJobActionId;
}

function conversionValue(quote: OfflineConversionSourceQuote, stage: OfflineConversionStage): {
  value: string;
  strategy: string;
} {
  const config = getGoogleAdsConfigOrThrow();
  if (stage === 'QUALIFIED_LEAD') {
    return { value: config.qualifiedLeadValueCad, strategy: 'fixed_qualified_lead_value' };
  }

  if (quote.betondispoRevenueCad && Number(quote.betondispoRevenueCad) > 0) {
    return { value: Number(quote.betondispoRevenueCad).toFixed(2), strategy: 'betondispo_revenue' };
  }

  return { value: config.wonJobFixedValueCad, strategy: 'fixed_won_job_value' };
}

function businessTime(quote: OfflineConversionSourceQuote, stage: OfflineConversionStage): Date {
  if (stage === 'QUALIFIED_LEAD') return quote.qualifiedAt ?? new Date();
  return quote.wonAt ?? new Date();
}

function googleDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '+00:00');
}

export async function enqueueOfflineConversionForQuote(
  quote: OfflineConversionSourceQuote,
  stage: OfflineConversionStage,
): Promise<OfflineConversionQueueResult> {
  const publicConfig = getGoogleAdsPublicConfig();
  if (publicConfig.offlineUploadMode === 'disabled') {
    return { queued: false, skipped: true, reason: 'offline_upload_disabled', orderId: null };
  }

  const actionId = conversionActionId(stage);
  const orderId = `${quote.publicId}-${stageSuffix(stage)}`;
  if (!actionId) {
    return { queued: false, skipped: true, reason: 'conversion_action_not_configured', orderId };
  }

  if (!quote.gclid) {
    const db = await getDb();
    await db
      .insert(googleAdsOfflineConversions)
      .values({
        quoteRequestId: quote.id,
        requestNumber: quote.publicId,
        conversionStage: stage,
        conversionActionId: actionId,
        conversionActionResourceName: publicConfig.customerId
          ? `customers/${publicConfig.customerId}/conversionActions/${actionId}`
          : null,
        orderId,
        conversionDateTime: businessTime(quote, stage),
        conversionValue: '0.00',
        valueStrategy: 'skipped_missing_click_identifier',
        consentAdUserData: quote.adUserDataConsent,
        consentAdPersonalization: quote.adPersonalizationConsent,
        uploadStatus: 'SKIPPED',
        sanitizedError: 'missing_click_identifier',
      })
      .onConflictDoNothing();
    return { queued: false, skipped: true, reason: 'missing_click_identifier', orderId };
  }

  const { value, strategy } = conversionValue(quote, stage);
  const db = await getDb();
  await db
    .insert(googleAdsOfflineConversions)
    .values({
      quoteRequestId: quote.id,
      requestNumber: quote.publicId,
      conversionStage: stage,
      conversionActionId: actionId,
      conversionActionResourceName: `customers/${publicConfig.customerId}/conversionActions/${actionId}`,
      gclid: quote.gclid,
      orderId,
      conversionDateTime: businessTime(quote, stage),
      conversionValue: value,
      currencyCode: 'CAD',
      valueStrategy: strategy,
      consentAdUserData: quote.adUserDataConsent,
      consentAdPersonalization: quote.adPersonalizationConsent,
      uploadStatus: 'PENDING',
    })
    .onConflictDoNothing();

  console.info('google_ads.conversion.queued', {
    quoteRequestId: quote.id,
    requestNumber: quote.publicId,
    stage,
    orderId,
  });

  return { queued: true, skipped: false, reason: null, orderId };
}

function buildClickConversion(row: typeof googleAdsOfflineConversions.$inferSelect) {
  const conversion: Record<string, unknown> = {
    conversionAction: row.conversionActionResourceName,
    conversionDateTime: googleDateTime(row.conversionDateTime),
    conversionValue: Number(row.conversionValue),
    currencyCode: row.currencyCode,
    orderId: row.orderId,
  };
  if (row.gclid) conversion.gclid = row.gclid;
  if (row.gbraid) conversion.gbraid = row.gbraid;
  if (row.wbraid) conversion.wbraid = row.wbraid;

  const consent: Record<string, 'GRANTED' | 'DENIED'> = {};
  if (row.consentAdUserData === 'GRANTED' || row.consentAdUserData === 'DENIED') {
    consent.adUserData = row.consentAdUserData;
  }
  if (
    row.consentAdPersonalization === 'GRANTED' ||
    row.consentAdPersonalization === 'DENIED'
  ) {
    consent.adPersonalization = row.consentAdPersonalization;
  }
  if (Object.keys(consent).length) conversion.consent = consent;
  return conversion;
}

function retryAt(attempt: number): Date {
  const minutes = [15, 60, 360, 1440][Math.max(0, Math.min(attempt - 1, 3))] ?? 1440;
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function processOfflineConversions(limit = 50): Promise<ProcessSummary> {
  const publicConfig = getGoogleAdsPublicConfig();
  if (publicConfig.offlineUploadMode === 'disabled') {
    return { mode: 'disabled', selected: 0, uploaded: 0, skipped: 0, failed: 0 };
  }

  const db = await getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(googleAdsOfflineConversions)
    .where(
      and(
        inArray(googleAdsOfflineConversions.uploadStatus, ['PENDING', 'RETRY']),
        or(isNull(googleAdsOfflineConversions.nextAttemptAt), lte(googleAdsOfflineConversions.nextAttemptAt, now)),
      ),
    )
    .orderBy(asc(googleAdsOfflineConversions.createdAt))
    .limit(Math.max(1, Math.min(limit, 500)));

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const attemptCount = row.attemptCount + 1;
    await db
      .update(googleAdsOfflineConversions)
      .set({
        uploadStatus: 'PROCESSING',
        attemptCount,
        lastAttemptAt: now,
        updatedAt: now,
      })
      .where(eq(googleAdsOfflineConversions.id, row.id));

    try {
      if (!row.gclid && !row.gbraid && !row.wbraid) {
        await db
          .update(googleAdsOfflineConversions)
          .set({
            uploadStatus: 'SKIPPED',
            sanitizedError: 'missing_click_identifier',
            updatedAt: new Date(),
          })
          .where(eq(googleAdsOfflineConversions.id, row.id));
        skipped += 1;
        continue;
      }

      if (publicConfig.offlineUploadMode === 'dry_run') {
        buildClickConversion(row);
        await db
          .update(googleAdsOfflineConversions)
          .set({
            uploadStatus: 'SKIPPED',
            sanitizedError: 'dry_run_validated_no_upload',
            googleJobId: 'dry_run',
            updatedAt: new Date(),
          })
          .where(eq(googleAdsOfflineConversions.id, row.id));
        skipped += 1;
        continue;
      }

      const upload = await googleAdsUploadClickConversions([buildClickConversion(row)], false);
      await db
        .update(googleAdsOfflineConversions)
        .set({
          uploadStatus: upload.partialFailure ? 'PERMANENTLY_FAILED' : 'UPLOADED',
          googleJobId: upload.requestId,
          googleErrorCode: upload.partialFailure ? 'partial_failure' : null,
          sanitizedError: upload.partialFailure ? 'Google Ads returned a partial failure.' : null,
          uploadedAt: upload.partialFailure ? null : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(googleAdsOfflineConversions.id, row.id));
      if (upload.partialFailure) failed += 1;
      else uploaded += 1;
    } catch (error) {
      const safe = sanitizeGoogleAdsError(error);
      const permanent = attemptCount >= 5;
      await db
        .update(googleAdsOfflineConversions)
        .set({
          uploadStatus: permanent ? 'PERMANENTLY_FAILED' : 'RETRY',
          googleErrorCode: safe.code,
          sanitizedError: safe.message,
          nextAttemptAt: permanent ? null : retryAt(attemptCount),
          updatedAt: new Date(),
        })
        .where(eq(googleAdsOfflineConversions.id, row.id));
      failed += 1;
      console.warn('google_ads.conversion.failed', {
        quoteRequestId: row.quoteRequestId,
        requestNumber: row.requestNumber,
        stage: row.conversionStage,
        orderId: row.orderId,
        attemptCount,
        errorCode: safe.code,
      });
    }
  }

  return {
    mode: publicConfig.offlineUploadMode,
    selected: rows.length,
    uploaded,
    skipped,
    failed,
  };
}

export async function queueCounts() {
  const db = await getDb();
  const rows = await db
    .select({
      status: googleAdsOfflineConversions.uploadStatus,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(googleAdsOfflineConversions)
    .groupBy(googleAdsOfflineConversions.uploadStatus);
  return rows;
}

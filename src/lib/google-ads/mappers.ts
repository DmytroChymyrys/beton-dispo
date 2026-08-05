import 'server-only';

import type { GoogleAdsGranularity, GoogleAdsPerformanceRow } from './types';

type GoogleAdsApiPerformanceResult = {
  customer?: { id?: string; currencyCode?: string };
  segments?: { date?: string };
  campaign?: {
    id?: string;
    name?: string;
    status?: string;
    advertisingChannelType?: string;
  };
  adGroup?: { id?: string; name?: string };
  metrics?: {
    impressions?: string;
    clicks?: string;
    costMicros?: string;
    conversions?: number | string;
    conversionsValue?: number | string;
    allConversions?: number | string;
    allConversionsValue?: number | string;
    interactions?: string;
  };
};

function int(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return 0;
}

function decimal(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) return value;
  return '0';
}

export function mapGoogleAdsPerformanceRow(
  raw: unknown,
  granularity: GoogleAdsGranularity,
): GoogleAdsPerformanceRow | null {
  const row = raw as GoogleAdsApiPerformanceResult;
  if (!row.customer?.id || !row.segments?.date || !row.campaign?.id) return null;

  return {
    customerId: row.customer.id,
    date: row.segments.date,
    granularity,
    campaignId: row.campaign.id,
    campaignName: row.campaign.name ?? `Campaign ${row.campaign.id}`,
    campaignStatus: row.campaign.status ?? null,
    campaignType: row.campaign.advertisingChannelType ?? null,
    adGroupId: granularity === 'AD_GROUP' ? row.adGroup?.id ?? null : null,
    adGroupName: granularity === 'AD_GROUP' ? row.adGroup?.name ?? null : null,
    currencyCode: row.customer.currencyCode ?? 'CAD',
    impressions: int(row.metrics?.impressions),
    clicks: int(row.metrics?.clicks),
    costMicros: int(row.metrics?.costMicros),
    conversions: decimal(row.metrics?.conversions),
    conversionValue: decimal(row.metrics?.conversionsValue),
    allConversions: decimal(row.metrics?.allConversions),
    allConversionValue: decimal(row.metrics?.allConversionsValue),
    interactions: row.metrics?.interactions == null ? null : int(row.metrics.interactions),
  };
}

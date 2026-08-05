import type { QuoteRequest } from '@/db/schema';

export type GoogleAdsGranularity = 'CAMPAIGN' | 'AD_GROUP';
export type GoogleAdsOfflineUploadMode = 'disabled' | 'dry_run' | 'enabled';
export type OfflineConversionStage = 'QUALIFIED_LEAD' | 'WON_JOB';

export type GoogleAdsPublicConfig = {
  configured: boolean;
  missing: string[];
  customerId: string | null;
  loginCustomerId: string | null;
  apiVersion: string;
  offlineUploadMode: GoogleAdsOfflineUploadMode;
  qualifiedLeadActionConfigured: boolean;
  wonJobActionConfigured: boolean;
};

export type GoogleAdsPrivateConfig = GoogleAdsPublicConfig & {
  configured: true;
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId: string | null;
  qualifiedLeadActionId: string | null;
  wonJobActionId: string | null;
  qualifiedLeadValueCad: string;
  wonJobFixedValueCad: string;
};

export type GoogleAdsConnectionResult = {
  connected: boolean;
  configured: boolean;
  customerId: string | null;
  descriptiveName: string | null;
  currencyCode: string | null;
  timeZone: string | null;
  offlineUploadMode: GoogleAdsOfflineUploadMode;
  errorCode: string | null;
  errorMessage: string | null;
};

export type GoogleAdsPerformanceRow = {
  customerId: string;
  date: string;
  granularity: GoogleAdsGranularity;
  campaignId: string;
  campaignName: string;
  campaignStatus: string | null;
  campaignType: string | null;
  adGroupId: string | null;
  adGroupName: string | null;
  currencyCode: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: string;
  conversionValue: string;
  allConversions: string;
  allConversionValue: string;
  interactions: number | null;
};

export type GoogleAdsSyncSummary = {
  configured: boolean;
  runId: string | null;
  startDate: string;
  endDate: string;
  granularity: GoogleAdsGranularity;
  rowsReceived: number;
  rowsUpserted: number;
  apiCalls: number;
  status: 'SUCCEEDED' | 'FAILED';
  errorCode: string | null;
  sanitizedError: string | null;
};

export type OfflineConversionQueueResult = {
  queued: boolean;
  skipped: boolean;
  reason: string | null;
  orderId: string | null;
};

export type OfflineConversionSourceQuote = Pick<
  QuoteRequest,
  | 'id'
  | 'publicId'
  | 'gclid'
  | 'qualifiedAt'
  | 'wonAt'
  | 'adUserDataConsent'
  | 'adPersonalizationConsent'
  | 'betondispoRevenueCad'
  | 'finalJobValueCad'
>;

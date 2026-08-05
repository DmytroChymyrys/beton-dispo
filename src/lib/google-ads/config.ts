import 'server-only';

import { z } from 'zod';
import type {
  GoogleAdsOfflineUploadMode,
  GoogleAdsPrivateConfig,
  GoogleAdsPublicConfig,
} from './types';
import { GoogleAdsConfigurationError } from './errors';

const modeSchema = z.enum(['disabled', 'dry_run', 'enabled']).default('disabled');

function cleanId(value: string | undefined): string | null {
  const normalized = value?.replaceAll('-', '').trim();
  return normalized && /^\d+$/.test(normalized) ? normalized : null;
}

function money(value: string | undefined, fallback: string): string {
  const normalized = value?.trim().replace(',', '.');
  return normalized && /^\d{1,10}(\.\d{1,2})?$/.test(normalized) ? normalized : fallback;
}

export function getGoogleAdsPublicConfig(): GoogleAdsPublicConfig {
  const customerId = cleanId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId = cleanId(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  const apiVersion = process.env.GOOGLE_ADS_API_VERSION?.trim() || 'v25';
  const offlineUploadMode = modeSchema.catch('disabled').parse(
    process.env.GOOGLE_ADS_OFFLINE_UPLOAD_MODE,
  ) as GoogleAdsOfflineUploadMode;

  const missing = [
    ['GOOGLE_ADS_DEVELOPER_TOKEN', process.env.GOOGLE_ADS_DEVELOPER_TOKEN],
    ['GOOGLE_ADS_CLIENT_ID', process.env.GOOGLE_ADS_CLIENT_ID],
    ['GOOGLE_ADS_CLIENT_SECRET', process.env.GOOGLE_ADS_CLIENT_SECRET],
    ['GOOGLE_ADS_REFRESH_TOKEN', process.env.GOOGLE_ADS_REFRESH_TOKEN],
    ['GOOGLE_ADS_CUSTOMER_ID', customerId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => String(name));

  return {
    configured: missing.length === 0,
    missing,
    customerId,
    loginCustomerId,
    apiVersion,
    offlineUploadMode,
    qualifiedLeadActionConfigured: Boolean(cleanId(process.env.GOOGLE_ADS_QUALIFIED_LEAD_ACTION_ID)),
    wonJobActionConfigured: Boolean(cleanId(process.env.GOOGLE_ADS_WON_JOB_ACTION_ID)),
  };
}

export function getGoogleAdsConfigOrThrow(): GoogleAdsPrivateConfig {
  const publicConfig = getGoogleAdsPublicConfig();
  if (!publicConfig.configured || !publicConfig.customerId) {
    throw new GoogleAdsConfigurationError(publicConfig.missing);
  }

  return {
    ...publicConfig,
    configured: true,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    customerId: publicConfig.customerId,
    qualifiedLeadActionId: cleanId(process.env.GOOGLE_ADS_QUALIFIED_LEAD_ACTION_ID),
    wonJobActionId: cleanId(process.env.GOOGLE_ADS_WON_JOB_ACTION_ID),
    qualifiedLeadValueCad: money(process.env.GOOGLE_ADS_QUALIFIED_LEAD_VALUE_CAD, '25.00'),
    wonJobFixedValueCad: money(process.env.GOOGLE_ADS_WON_JOB_FIXED_VALUE_CAD, '100.00'),
  };
}

import 'server-only';

import { getGoogleAdsConfigOrThrow, getGoogleAdsPublicConfig } from './config';
import { GoogleAdsApiError, googleAdsApiErrorFromBody, sanitizeGoogleAdsError } from './errors';
import type { GoogleAdsConnectionResult, GoogleAdsPrivateConfig } from './types';

type GoogleAdsSearchStreamChunk = {
  results?: unknown[];
};

type GoogleAdsErrorBody = Parameters<typeof googleAdsApiErrorFromBody>[0];

async function refreshAccessToken(config: GoogleAdsPrivateConfig): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as { access_token?: string; error?: string } | null;
  if (!response.ok || !body?.access_token) {
    throw new GoogleAdsApiError(body?.error ?? 'oauth_refresh_failed', 'Unable to refresh Google Ads access token.');
  }
  return body.access_token;
}

export async function googleAdsSearchStream(query: string): Promise<{
  results: unknown[];
  apiCalls: number;
}> {
  const config = getGoogleAdsConfigOrThrow();
  const accessToken = await refreshAccessToken(config);
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'content-type': 'application/json',
  };
  if (config.loginCustomerId) headers['login-customer-id'] = config.loginCustomerId;

  const response = await fetch(
    `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
      cache: 'no-store',
    },
  );

  const body = (await response.json().catch(() => null)) as
    | GoogleAdsSearchStreamChunk[]
    | GoogleAdsErrorBody
    | null;
  if (!response.ok) {
    throw googleAdsApiErrorFromBody(
      Array.isArray(body) ? null : body,
      `http_${response.status}`,
      'Google Ads API request failed.',
    );
  }

  const chunks = Array.isArray(body) ? body : [];
  return {
    results: chunks.flatMap((chunk) => chunk.results ?? []),
    apiCalls: 1,
  };
}

export async function testGoogleAdsConnection(): Promise<GoogleAdsConnectionResult> {
  const publicConfig = getGoogleAdsPublicConfig();
  if (!publicConfig.configured) {
    return {
      connected: false,
      configured: false,
      customerId: publicConfig.customerId,
      descriptiveName: null,
      currencyCode: null,
      timeZone: null,
      offlineUploadMode: publicConfig.offlineUploadMode,
      errorCode: 'not_configured',
      errorMessage: 'Google Ads integration is not configured.',
    };
  }

  try {
    const response = await googleAdsSearchStream(`
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone
      FROM customer
      LIMIT 1
    `);
    const row = response.results[0] as
      | {
          customer?: {
            id?: string;
            descriptiveName?: string;
            currencyCode?: string;
            timeZone?: string;
          };
        }
      | undefined;

    return {
      connected: true,
      configured: true,
      customerId: row?.customer?.id ?? publicConfig.customerId,
      descriptiveName: row?.customer?.descriptiveName ?? null,
      currencyCode: row?.customer?.currencyCode ?? null,
      timeZone: row?.customer?.timeZone ?? null,
      offlineUploadMode: publicConfig.offlineUploadMode,
      errorCode: null,
      errorMessage: null,
    };
  } catch (error) {
    const safe = sanitizeGoogleAdsError(error);
    return {
      connected: false,
      configured: true,
      customerId: publicConfig.customerId,
      descriptiveName: null,
      currencyCode: null,
      timeZone: null,
      offlineUploadMode: publicConfig.offlineUploadMode,
      errorCode: safe.code,
      errorMessage: safe.message,
    };
  }
}

export async function googleAdsUploadClickConversions(
  conversions: unknown[],
  validateOnly: boolean,
): Promise<{ requestId: string | null; partialFailure: unknown | null }> {
  const config = getGoogleAdsConfigOrThrow();
  const accessToken = await refreshAccessToken(config);
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    'content-type': 'application/json',
  };
  if (config.loginCustomerId) headers['login-customer-id'] = config.loginCustomerId;

  const response = await fetch(
    `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}:uploadClickConversions`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        conversions,
        partialFailure: true,
        validateOnly,
      }),
      cache: 'no-store',
    },
  );
  const body = (await response.json().catch(() => null)) as
    | ({ requestId?: string; partialFailureError?: unknown } & NonNullable<GoogleAdsErrorBody>)
    | null;

  if (!response.ok) {
    throw googleAdsApiErrorFromBody(
      body,
      `http_${response.status}`,
      'Google Ads conversion upload failed.',
    );
  }

  return {
    requestId: body?.requestId ?? null,
    partialFailure: body?.partialFailureError ?? null,
  };
}

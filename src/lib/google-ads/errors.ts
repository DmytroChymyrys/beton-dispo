import 'server-only';

export class GoogleAdsConfigurationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Google Ads integration is not configured: ${missing.join(', ')}`);
    this.name = 'GoogleAdsConfigurationError';
  }
}

export class GoogleAdsApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GoogleAdsApiError';
  }
}

export function sanitizeGoogleAdsError(error: unknown): { code: string; message: string } {
  if (error instanceof GoogleAdsConfigurationError) {
    return { code: 'not_configured', message: 'Google Ads integration is not configured.' };
  }
  if (error instanceof GoogleAdsApiError) {
    return { code: error.code, message: error.message.slice(0, 500) };
  }
  if (error instanceof Error) {
    return { code: 'google_ads_error', message: error.message.slice(0, 500) };
  }
  return { code: 'google_ads_error', message: 'Unknown Google Ads error.' };
}

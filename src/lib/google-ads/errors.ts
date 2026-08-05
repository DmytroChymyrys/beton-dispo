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

type GoogleAdsErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      errors?: Array<{
        message?: string;
        errorCode?: Record<string, string>;
      }>;
    }>;
  };
};

function googleAdsFailureCode(body: GoogleAdsErrorBody | null, fallback: string): string {
  const detailError = body?.error?.details
    ?.flatMap((detail) => detail.errors ?? [])
    .find((error) => error.errorCode);
  const code = detailError?.errorCode ? Object.values(detailError.errorCode)[0] : null;
  return code ?? body?.error?.status ?? fallback;
}

function googleAdsFailureMessage(body: GoogleAdsErrorBody | null, fallback: string): string {
  const detailError = body?.error?.details
    ?.flatMap((detail) => detail.errors ?? [])
    .find((error) => error.message);
  return detailError?.message ?? body?.error?.message ?? fallback;
}

export function googleAdsApiErrorFromBody(
  body: GoogleAdsErrorBody | null,
  fallbackCode: string,
  fallbackMessage: string,
): GoogleAdsApiError {
  return new GoogleAdsApiError(
    googleAdsFailureCode(body, fallbackCode),
    googleAdsFailureMessage(body, fallbackMessage),
  );
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

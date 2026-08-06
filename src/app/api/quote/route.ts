import { NextResponse } from 'next/server';
import { fieldErrors, quoteSubmission } from '@/lib/quote-schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { createQuoteRequest } from '@/server/quote-service';
import { sendQuoteNotification } from '@/server/notifications';
import { hashForAbuse, verifyQuoteFormToken } from '@/server/abuse';
import { revalidateProjectIntelligencePublication } from '@/server/project-intelligence-revalidation';

export const runtime = 'nodejs';

type SubmitQuoteResult =
  | { ok: true; publicId: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

const RATE_LIMIT = {
  limit: positiveInt(process.env.QUOTE_RATE_LIMIT, 5),
  windowMs: positiveInt(process.env.QUOTE_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
};

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip || null;
}

function sourceIpHash(request: Request): string | null {
  const ip = clientIp(request);
  if (!ip) return null;
  return hashForAbuse(ip);
}

function logRejected(
  reason: string,
  details: {
    sourceIpHash?: string | null;
    locale?: string;
    projectType?: string;
    fieldCount?: number;
    status?: number;
  } = {},
) {
  console.warn('[quote] rejected submission', {
    reason,
    sourceIpHashPrefix: details.sourceIpHash?.slice(0, 12) ?? null,
    locale: details.locale,
    projectType: details.projectType,
    fieldCount: details.fieldCount,
    status: details.status ?? 400,
  });
}

function json(body: SubmitQuoteResult, status: number = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const ipHash = sourceIpHash(request);
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    logRejected('invalid_json', { sourceIpHash: ipHash });
    return json({ ok: false, formError: 'server' }, 400);
  }

  const parsed = quoteSubmission.safeParse(input);

  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    const hasUnknownFields = parsed.error.issues.some(
      (issue) => issue.code === 'unrecognized_keys',
    );
    const reason = errors.websiteUrl
      ? 'honeypot'
      : hasUnknownFields
        ? 'unknown_fields'
        : 'validation';

    logRejected(reason, {
      sourceIpHash: ipHash,
      fieldCount: parsed.error.issues.length,
    });

    if (errors.websiteUrl) return json({ ok: false, formError: 'spam' }, 400);
    if (hasUnknownFields) return json({ ok: false, formError: 'server' }, 400);
    return json({ ok: false, fieldErrors: errors }, 400);
  }

  const token = verifyQuoteFormToken({
    issuedAt: parsed.data.formIssuedAt,
    token: parsed.data.formToken,
  });
  if (!token.ok) {
    logRejected(`form_token_${token.reason}`, {
      sourceIpHash: ipHash,
      locale: parsed.data.locale,
      projectType: parsed.data.projectType,
    });
    return json({ ok: false, formError: 'spam' }, 400);
  }

  const rateKey = ipHash ? `quote:${ipHash}` : 'quote:unknown';
  const limit = checkRateLimit(rateKey, RATE_LIMIT);
  if (!limit.ok) {
    logRejected('rate_limited', {
      sourceIpHash: ipHash,
      locale: parsed.data.locale,
      projectType: parsed.data.projectType,
      status: 429,
    });
    return json({ ok: false, formError: 'rateLimited' }, 429);
  }

  let result;
  try {
    result = await createQuoteRequest(parsed.data, {
      sourceIpHash: ipHash,
      abuseStatus: 'clean',
    });
  } catch (error) {
    console.error('[quote] failed to persist request', {
      sourceIpHashPrefix: ipHash?.slice(0, 12) ?? null,
      locale: parsed.data.locale,
      projectType: parsed.data.projectType,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return json({ ok: false, formError: 'server' }, 500);
  }

  if (result.duplicate) {
    logRejected('duplicate', {
      sourceIpHash: ipHash,
      locale: parsed.data.locale,
      projectType: parsed.data.projectType,
      status: 200,
    });
    return json({ ok: true, publicId: result.row.publicId });
  }

  revalidateProjectIntelligencePublication({
    city: result.row.city,
    projectType: result.row.projectType,
    createdAt: result.row.createdAt,
  });

  await sendQuoteNotification(result.row);

  return json({ ok: true, publicId: result.row.publicId });
}

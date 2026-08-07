import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  supplierApplicationFieldErrors,
  supplierApplicationSubmission,
} from '@/lib/supplier-application-schema';
import { hashForAbuse, verifySupplierApplicationFormToken } from '@/server/abuse';
import { sendSupplierApplicationNotification } from '@/server/notifications';
import { createSupplierApplication } from '@/server/supplier-application-service';

export const runtime = 'nodejs';

type SubmitSupplierApplicationResult =
  | { ok: true; publicId: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

const RATE_LIMIT = {
  limit: positiveInt(process.env.SUPPLIER_APPLICATION_RATE_LIMIT, 4),
  windowMs: positiveInt(process.env.SUPPLIER_APPLICATION_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
};

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip || null;
}

function sourceIpHash(request: Request): string | null {
  const ip = clientIp(request);
  return ip ? hashForAbuse(ip) : null;
}

function json(body: SubmitSupplierApplicationResult, status: number = 200) {
  return NextResponse.json(body, { status });
}

function logRejected(
  reason: string,
  details: {
    sourceIpHash?: string | null;
    locale?: string;
    serviceCount?: number;
    fieldCount?: number;
    status?: number;
  } = {},
) {
  console.warn('[supplier_application] rejected submission', {
    reason,
    sourceIpHashPrefix: details.sourceIpHash?.slice(0, 12) ?? null,
    locale: details.locale,
    serviceCount: details.serviceCount,
    fieldCount: details.fieldCount,
    status: details.status ?? 400,
  });
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

  const parsed = supplierApplicationSubmission.safeParse(input);
  if (!parsed.success) {
    const errors = supplierApplicationFieldErrors(parsed.error);
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

  const token = verifySupplierApplicationFormToken({
    issuedAt: parsed.data.formIssuedAt,
    token: parsed.data.formToken,
  });
  if (!token.ok) {
    logRejected(`form_token_${token.reason}`, {
      sourceIpHash: ipHash,
      locale: parsed.data.locale,
      serviceCount: parsed.data.services.length,
    });
    return json({ ok: false, formError: 'spam' }, 400);
  }

  const limit = checkRateLimit(
    ipHash ? `supplier_application:${ipHash}` : 'supplier_application:unknown',
    RATE_LIMIT,
  );
  if (!limit.ok) {
    logRejected('rate_limited', {
      sourceIpHash: ipHash,
      locale: parsed.data.locale,
      serviceCount: parsed.data.services.length,
      status: 429,
    });
    return json({ ok: false, formError: 'rateLimited' }, 429);
  }

  let result;
  try {
    result = await createSupplierApplication(parsed.data, {
      sourceIpHash: ipHash,
      abuseStatus: 'clean',
    });
  } catch (error) {
    console.error('[supplier_application] failed to persist application', {
      sourceIpHashPrefix: ipHash?.slice(0, 12) ?? null,
      locale: parsed.data.locale,
      serviceCount: parsed.data.services.length,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return json({ ok: false, formError: 'server' }, 500);
  }

  if (result.duplicate) {
    logRejected('duplicate', {
      sourceIpHash: ipHash,
      locale: parsed.data.locale,
      serviceCount: parsed.data.services.length,
      status: 200,
    });
    return json({ ok: true, publicId: result.row.publicId });
  }

  await sendSupplierApplicationNotification(result.row);

  return json({ ok: true, publicId: result.row.publicId });
}

'use server';

import { headers } from 'next/headers';
import { fieldErrors, quoteSubmission } from '@/lib/quote-schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { createQuoteRequest } from '@/server/quote-service';
import { sendQuoteNotification } from '@/server/notifications';

export type SubmitQuoteResult =
  | { ok: true; publicId: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

/**
 * Five submissions per IP per ten minutes — far above any real contractor,
 * low enough to blunt casual spam without a CAPTCHA.
 *
 * Configurable because everything behind a shared egress IP looks like one
 * client: an end-to-end suite, a load test, or a contractor's office NAT would
 * otherwise trip the limit. Raise it locally and in CI, leave it at the default
 * in production.
 */
function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

const RATE_LIMIT = {
  limit: positiveInt(process.env.QUOTE_RATE_LIMIT, 5),
  windowMs: positiveInt(process.env.QUOTE_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
};

function clientKey(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown';
  return `quote:${ip}`;
}

/**
 * Receives a quote request from the browser.
 *
 * Order matters: validate, then persist, then (in the notification milestone)
 * notify. The database write is the source of truth — a lead that reached
 * Postgres is never reported as failed.
 */
export async function submitQuoteAction(input: unknown): Promise<SubmitQuoteResult> {
  const parsed = quoteSubmission.safeParse(input);

  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // A filled honeypot is a bot. Return the generic error and store nothing.
    if (errors.websiteUrl) return { ok: false, formError: 'spam' };
    return { ok: false, fieldErrors: errors };
  }

  const headerList = await headers();
  const limit = checkRateLimit(clientKey(headerList), RATE_LIMIT);
  if (!limit.ok) return { ok: false, formError: 'rateLimited' };

  let row;
  try {
    row = await createQuoteRequest(parsed.data);
  } catch (error) {
    // Log the failure, never the customer's details.
    console.error('[quote] failed to persist request', {
      city: parsed.data.city,
      projectType: parsed.data.projectType,
      error: error instanceof Error ? error.message : 'unknown error',
    });
    return { ok: false, formError: 'server' };
  }

  // The lead is saved. Notification is best-effort from here on: it is awaited
  // so the serverless invocation doesn't get frozen mid-send, but its outcome
  // can never turn a stored request into a reported failure.
  await sendQuoteNotification(row);

  return { ok: true, publicId: row.publicId };
}

import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const MIN_FORM_AGE_MS = 3000;
const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set before accepting production quote submissions.');
  }
  return 'development-only-form-token-secret-change-in-production';
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

export function issueQuoteFormToken(now: number = Date.now()) {
  const issuedAt = String(now);
  const payload = `${TOKEN_VERSION}.${issuedAt}`;
  return {
    issuedAt,
    token: `${payload}.${sign(payload)}`,
  };
}

export const issueSupplierApplicationFormToken = issueQuoteFormToken;

export type FormTokenResult =
  { ok: true } | { ok: false; reason: 'invalid' | 'too_fast' | 'stale' };

export function verifyQuoteFormToken({
  issuedAt,
  token,
  now = Date.now(),
}: {
  issuedAt: string;
  token: string;
  now?: number;
}): FormTokenResult {
  const issued = Number(issuedAt);
  if (!Number.isFinite(issued) || issued <= 0) return { ok: false, reason: 'invalid' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION || parts[1] !== issuedAt) {
    return { ok: false, reason: 'invalid' };
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  const actual = parts[2] ?? '';
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    return { ok: false, reason: 'invalid' };
  }

  const age = now - issued;
  if (age < MIN_FORM_AGE_MS) return { ok: false, reason: 'too_fast' };
  if (age > MAX_FORM_AGE_MS) return { ok: false, reason: 'stale' };
  return { ok: true };
}

export const verifySupplierApplicationFormToken = verifyQuoteFormToken;

export function hashForAbuse(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

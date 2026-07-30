import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Minimal admin authentication.
 *
 * Phase 1 has exactly one internal operator, so a shared password plus an
 * HMAC-signed session cookie is the right amount of machinery — no user table,
 * no third-party identity provider, nothing to operate. Replace this module
 * wholesale when the team needs individual accounts.
 *
 * The cookie carries only an expiry and its signature; there is nothing in it
 * an attacker could tamper with to gain access, and it is httpOnly so client
 * JavaScript can never read it.
 */

const COOKIE_NAME = 'bd_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Generate one with: openssl rand -base64 32',
    );
  }
  return secret;
}

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  return Buffer.from(bytes).toString('base64url');
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(requireSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

/** Length-independent, value-constant comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Compare hashes so differing lengths don't leak through an early return.
  let mismatch = aBytes.length ^ bBytes.length;
  const length = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < length; i += 1) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

export type Credentials = { email: string; password: string };

/**
 * Checks credentials against the configured operator account.
 * Returns false — never throws — when the admin is not configured, so an
 * unconfigured deployment simply has no way in.
 */
export function verifyCredentials({ email, password }: Credentials): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    console.error('[admin] ADMIN_EMAIL / ADMIN_PASSWORD are not configured; sign-in is disabled.');
    return false;
  }

  // Both comparisons always run: no early return that would reveal which half
  // of the credentials was wrong.
  const emailOk = timingSafeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const passwordOk = timingSafeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

export async function createSession(): Promise<void> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);
  const token = `${payload}.${await sign(payload)}`;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    expires: new Date(expiresAt),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COOKIE_NAME, path: '/admin' });
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  try {
    return timingSafeEqual(signature, await sign(payload));
  } catch {
    // AUTH_SECRET missing — treat as unauthenticated rather than crashing.
    return false;
  }
}

/**
 * Guard for admin pages *and* every admin server action.
 *
 * Actions are separate HTTP entry points: a layout check alone would not stop a
 * crafted request, so each mutation calls this too.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) redirect('/admin/login');
}

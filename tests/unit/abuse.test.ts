import { afterEach, describe, expect, it, vi } from 'vitest';
import { issueQuoteFormToken, verifyQuoteFormToken } from '@/server/abuse';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('quote form token', () => {
  it('accepts a valid token after the minimum form age', () => {
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(40));
    const issued = issueQuoteFormToken(10_000);

    expect(
      verifyQuoteFormToken({
        issuedAt: issued.issuedAt,
        token: issued.token,
        now: 14_000,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects unrealistically fast submissions', () => {
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(40));
    const issued = issueQuoteFormToken(10_000);

    expect(
      verifyQuoteFormToken({
        issuedAt: issued.issuedAt,
        token: issued.token,
        now: 11_000,
      }),
    ).toEqual({ ok: false, reason: 'too_fast' });
  });

  it('rejects tampered tokens', () => {
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(40));
    const issued = issueQuoteFormToken(10_000);

    expect(
      verifyQuoteFormToken({
        issuedAt: issued.issuedAt,
        token: issued.token.replace(/.$/, '0'),
        now: 14_000,
      }),
    ).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects stale tokens', () => {
    vi.stubEnv('AUTH_SECRET', 'x'.repeat(40));
    const issued = issueQuoteFormToken(10_000);

    expect(
      verifyQuoteFormToken({
        issuedAt: issued.issuedAt,
        token: issued.token,
        now: 10_000 + 3 * 60 * 60 * 1000,
      }),
    ).toEqual({ ok: false, reason: 'stale' });
  });
});

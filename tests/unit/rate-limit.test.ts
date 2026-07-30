import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimits } from '@/lib/rate-limit';

const OPTIONS = { limit: 3, windowMs: 60_000 };

describe('checkRateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('allows requests up to the limit', () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) {
      expect(checkRateLimit('ip-a', OPTIONS, 1_000).ok).toBe(true);
    }
  });

  it('blocks the request after the limit', () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) checkRateLimit('ip-a', OPTIONS, 1_000);
    const result = checkRateLimit('ip-a', OPTIONS, 1_000);
    expect(result.ok).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks each client independently', () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) checkRateLimit('ip-a', OPTIONS, 1_000);
    expect(checkRateLimit('ip-a', OPTIONS, 1_000).ok).toBe(false);
    expect(checkRateLimit('ip-b', OPTIONS, 1_000).ok).toBe(true);
  });

  it('lets a blocked client through again once the window has passed', () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) checkRateLimit('ip-a', OPTIONS, 1_000);
    expect(checkRateLimit('ip-a', OPTIONS, 1_000).ok).toBe(false);
    expect(checkRateLimit('ip-a', OPTIONS, 1_000 + OPTIONS.windowMs).ok).toBe(true);
  });

  it('reports how long the caller must wait', () => {
    for (let i = 0; i < OPTIONS.limit; i += 1) checkRateLimit('ip-a', OPTIONS, 1_000);
    const result = checkRateLimit('ip-a', OPTIONS, 31_000);
    expect(result.retryAfterMs).toBe(30_000);
  });
});

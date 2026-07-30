import 'server-only';

/**
 * Minimal fixed-window rate limiter.
 *
 * Deliberately in-memory: on Vercel each serverless instance keeps its own
 * counters, so this slows a single abusive client but is not a hard global
 * guarantee. That is the right trade for Phase 1 — the goal is to blunt casual
 * spam without adding infrastructure or hurting conversion with a CAPTCHA.
 * Move to a shared store (Redis/Upstash) only if spam actually becomes a
 * problem.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Bounds memory if a burst of unique keys arrives. */
const MAX_TRACKED_KEYS = 5000;

export type RateLimitResult = {
  ok: boolean;
  /** Milliseconds until the window resets. Zero when `ok`. */
  retryAfterMs: number;
};

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still full of live windows: drop the oldest so the map can't grow forever.
  if (buckets.size >= MAX_TRACKED_KEYS) {
    const oldest = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of oldest.slice(0, Math.floor(MAX_TRACKED_KEYS / 4))) {
      buckets.delete(key);
    }
  }
}

/** Test seam. */
export function resetRateLimits(): void {
  buckets.clear();
}

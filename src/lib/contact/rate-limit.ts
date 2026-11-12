/**
 * In-memory sliding-window rate limiter. Fine for a single Render instance;
 * swap for a shared store (Redis/KV) if the service is scaled horizontally.
 */
export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the oldest hit leaves the window (only when blocked). */
  retryAfter: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, times] of hits) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }

  return {
    check(key: string, now = Date.now()): RateLimitResult {
      if (hits.size > maxKeys) prune(now);
      const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (times.length >= limit) {
        hits.set(key, times);
        const oldest = times[0] ?? now;
        return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
      }
      times.push(now);
      hits.set(key, times);
      return { ok: true, retryAfter: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

/**
 * Client IP behind Render's proxy. Render appends the real client address as
 * the right-most X-Forwarded-For entry, so we count `trustedHops` from the
 * right; anything further left is client-controlled and ignored.
 */
export function clientIp(forwardedFor: string | null, fallback: string | undefined, trustedHops = 1): string {
  if (forwardedFor && trustedHops > 0) {
    const parts = forwardedFor
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const ip = parts[parts.length - trustedHops];
    if (ip && ip.length <= 64) return ip;
  }
  return fallback ?? 'unknown';
}

// Tiny in-memory TTL cache with single-flight de-duplication.
//
// Used to cache expensive, near-static reference reads (e.g. the full
// cooperative and commodity catalogs) that hit a slow shared Postgres. Live,
// mutable state (stock changes, overrides) flows through the Firestore merge
// layer in the repositories, so caching the Postgres baseline for a short TTL
// does not serve stale dynamic data.
//
// Notes:
// - The cache is per server instance (module scope). On serverless/Cloud Run
//   each instance warms independently, which is fine.
// - Single-flight: concurrent misses for the same key await one shared
//   producer promise instead of stampeding the database (this also prevents
//   request pile-ups from melting down the dev server).

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expires > Date.now()) {
    return hit.value;
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      const value = await producer();
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Manually invalidate a cache key (e.g. after a write that changes it). */
export function invalidateCache(key: string): void {
  store.delete(key);
}

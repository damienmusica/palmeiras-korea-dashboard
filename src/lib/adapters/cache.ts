// =============================================================================
// Tiny server-side in-memory cache with TTL. Good enough for an MVP single
// instance; the interface is intentionally minimal so it could be swapped for
// Redis/KV later without touching adapters.
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

function ttlMs(): number {
  const raw = Number(process.env.DATA_CACHE_TTL_SECONDS);
  const seconds = Number.isFinite(raw) && raw > 0 ? raw : 300;
  return seconds * 1000;
}

/** Read a cached value if still fresh, else undefined. */
export function cacheGet<T>(key: string, now = Date.now()): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/** Write a value with the configured TTL. */
export function cacheSet<T>(key: string, value: T, now = Date.now()): void {
  store.set(key, { value, expiresAt: now + ttlMs() });
}

/**
 * Memoize an async producer by key. On producer error, returns a stale cached
 * value if present (so a transient upstream failure doesn't blank the UI).
 */
export async function cached<T>(
  key: string,
  producer: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await producer();
  cacheSet(key, value);
  return value;
}

/** Invalidate a single cache key (scoped refresh). */
export function cacheDelete(key: string): void {
  store.delete(key);
}

/** Test/maintenance helper — clears everything. */
export function cacheClear(): void {
  store.clear();
}

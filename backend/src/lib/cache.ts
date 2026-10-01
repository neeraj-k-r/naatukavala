const store = new Map<string, { expires: number; value: unknown }>();

// Catalog reads go through the frontend on every page render: keep them warm
// for longer. All catalog mutations call clearCache() to stay instant.
const TTL_MS = 120_000;

/** Caches the result of an async query for a short TTL (public catalog reads). */
export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }
  const value = await fn();
  store.set(key, { expires: Date.now() + TTL_MS, value });
  return value;
}

/** Drops all cached entries (call after any catalog mutation). */
export function clearCache() {
  store.clear();
}
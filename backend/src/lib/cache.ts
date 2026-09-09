const store = new Map<string, { expires: number; value: unknown }>();

const TTL_MS = 30_000;

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
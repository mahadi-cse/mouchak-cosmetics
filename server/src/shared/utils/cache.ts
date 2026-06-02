import redis from '../../config/redis';

/**
 * Try to get a cached value. Returns `null` on miss or Redis error (graceful degradation).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[Cache] GET error for key "${key}":`, (err as Error).message);
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 * Silently swallows errors so Redis being down never breaks the request.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error(`[Cache] SET error for key "${key}":`, (err as Error).message);
  }
}

/**
 * Delete one or more exact keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(keys);
  } catch (err) {
    console.error('[Cache] DEL error:', (err as Error).message);
  }
}

/**
 * Delete all keys matching a glob pattern (e.g. "products:*").
 * Uses SCAN to avoid blocking Redis on large keyspaces.
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    // node-redis v4 scanIterator makes this clean
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      await redis.del(key);
    }
  } catch (err) {
    console.error(`[Cache] SCAN/DEL error for pattern "${pattern}":`, (err as Error).message);
  }
}

/** Convenience TTL constants (in seconds) */
export const TTL = {
  /** 5 minutes — frequently changing lists (products, inventory summary) */
  SHORT: 5 * 60,
  /** 10 minutes — homepage content, sliders, settings */
  MEDIUM: 10 * 60,
  /** 15 minutes — analytics aggregations */
  LONG: 15 * 60,
  /** 1 hour — rarely-changing reference data (categories) */
  VERY_LONG: 60 * 60,
} as const;

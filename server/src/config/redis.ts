import { Redis } from '@upstash/redis';

/**
 * Upstash Redis REST client.
 *
 * Uses HTTP/HTTPS instead of TCP — no persistent connection, no TLS handshake
 * overhead per invocation. This is the correct approach for serverless
 * environments like Vercel where TCP connection pooling is not available.
 *
 * Requires two environment variables:
 *   UPSTASH_REDIS_REST_URL  — e.g. https://knowing-caribou-142345.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN — the bearer token shown in Upstash console
 *
 * Falls back to a no-op mock client when the env vars are not set
 * (local development without Redis).
 */

// Minimal mock for local development when Upstash env vars are absent
const createMockClient = () => ({
  get: async (_key: string) => null,
  set: async (_key: string, _value: unknown, _opts?: unknown) => 'OK' as const,
  del: async (..._keys: string[]) => 0,
  scan: async (_cursor: number, _opts?: unknown) => ({ cursor: 0, keys: [] }),
  keys: async (_pattern: string) => [] as string[],
});

type MockClient = ReturnType<typeof createMockClient>;

let _redis: Redis | MockClient | null = null;

function getRedisClient(): Redis | MockClient {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      '[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not set. ' +
        'Using no-op mock client — caching is disabled.'
    );
    _redis = createMockClient();
    return _redis;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

export const redis = getRedisClient();
export default redis;

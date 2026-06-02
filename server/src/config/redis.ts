import { createClient, RedisClientType } from 'redis';

const globalForRedis = global as unknown as { redis: RedisClientType | undefined };

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = createClient({ url }) as RedisClientType;

  client.on('connect', () => console.log('[Redis] Connected'));
  client.on('error', (err: Error) => console.error('[Redis] Error:', err.message));
  client.on('end', () => console.warn('[Redis] Connection closed'));

  // Connect once — node-redis v4 requires explicit connect()
  client.connect().catch((err: Error) =>
    console.error('[Redis] Initial connection failed:', err.message)
  );

  return client;
}

export const redis: RedisClientType =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;

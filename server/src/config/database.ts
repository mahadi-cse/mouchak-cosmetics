import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function buildDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || '';
  // Enforce a small connection pool to avoid exhausting Supabase's
  // free-tier connection limit. pool_timeout=20 makes Prisma fail fast
  // (with an error) rather than hanging if all connections are busy.
  const params = 'connection_limit=3&pool_timeout=20';
  return url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: buildDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

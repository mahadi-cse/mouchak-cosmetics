import { createApp } from './app';
import { getEnv } from './config/env';
import logger from './shared/utils/logger';
import { prisma } from './config/database';

async function main() {
  const env = getEnv();
  const app = createApp();

  // Test database connection
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }

  // Start server
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

main().catch(error => {
  logger.error('Fatal error', { error });
  process.exit(1);
});

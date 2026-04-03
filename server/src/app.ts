import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { getEnv } from './config/env';
import requestLogger from './middleware/requestLogger';
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';
import { generalLimiter } from './middleware/rateLimiter';

import productRouter from './modules/products/product.router';
import categoryRouter from './modules/categories/category.router';

export function createApp(): Express {
  const app = express();
  const env = getEnv();

  // Middleware stack
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);
  app.use(generalLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // API Routes - Public
  app.use('/api/products', productRouter);
  app.use('/api/categories', categoryRouter);

  // 404 handler
  app.use(notFound);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;

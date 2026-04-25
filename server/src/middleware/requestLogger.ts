import { RequestHandler } from 'express';
import logger from '../shared/utils/logger';

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id ?? 'anonymous';

    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId,
    });
  });

  next();
};

export default requestLogger;

import winston from 'winston';
import { getEnv } from '../../config/env';

let logger: winston.Logger | null = null;

const initializeLogger = (): winston.Logger => {
  if (logger) {
    return logger;
  }

  const env = getEnv();

  logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'mouchak-api' },
    transports: [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      }),
    ],
  });

  if (env.NODE_ENV !== 'production') {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
          })
        ),
      })
    );
  }

  return logger;
};

export default {
  log: (level: string, message: string, meta?: any) => initializeLogger().log(level, message, meta),
  info: (message: string, meta?: any) => initializeLogger().info(message, meta),
  warn: (message: string, meta?: any) => initializeLogger().warn(message, meta),
  error: (message: string, meta?: any) => initializeLogger().error(message, meta),
  debug: (message: string, meta?: any) => initializeLogger().debug(message, meta),
};

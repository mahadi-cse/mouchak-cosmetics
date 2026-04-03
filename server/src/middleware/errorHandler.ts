import { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../shared/utils/AppError';
import { fail } from '../shared/utils/apiResponse';
import logger from '../shared/utils/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error('Error handler triggered', {
    error: err,
    path: req.path,
    method: req.method,
  });

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      fail(err.message, err.code)
    );
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json(
        fail('Unique constraint violation: Resource already exists', 'CONFLICT')
      );
    }

    if (err.code === 'P2025') {
      return res.status(404).json(
        fail('Resource not found', 'NOT_FOUND')
      );
    }

    if (err.code === 'P2003') {
      return res.status(400).json(
        fail('Foreign key constraint violated', 'INVALID_REFERENCE')
      );
    }

    logger.error('Prisma error', { code: err.code, message: err.message });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json(
      fail('Invalid request data', 'VALIDATION_ERROR')
    );
  }

  // Handle general errors
  logger.error('Unhandled error', { error: err });

  return res.status(500).json(
    fail('Internal server error', 'INTERNAL_ERROR')
  );
};

export default errorHandler;

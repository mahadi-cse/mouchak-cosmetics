import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { fail } from '../shared/utils/apiResponse';
import logger from '../shared/utils/logger';

export const validate = (schema: ZodSchema): RequestHandler => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      logger.error('Validation error', { error });
      
      if (error.errors) {
        const messages = error.errors
          .map((e: any) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return res.status(400).json(
          fail(`Validation failed: ${messages}`, 'VALIDATION_ERROR')
        );
      }

      return res.status(400).json(
        fail('Request validation failed', 'VALIDATION_ERROR')
      );
    }
  };
};

export default validate;

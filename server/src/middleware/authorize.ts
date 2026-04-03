import { RequestHandler } from 'express';
import { UserRole } from '@prisma/client';
import { fail } from '../shared/utils/apiResponse';

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(fail('Unauthorized'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(fail('Forbidden', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

export default authorize;

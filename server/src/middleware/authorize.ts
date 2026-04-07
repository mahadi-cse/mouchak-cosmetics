import { RequestHandler } from 'express';
import { fail } from '../shared/utils/apiResponse';

export const authorize = (...roles: ('ADMIN' | 'STAFF' | 'CUSTOMER')[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

export default authorize;

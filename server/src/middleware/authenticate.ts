import { RequestHandler } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.jwt';
import { RoleCode, USER_TYPE_CODES } from '../shared/types/auth.types';
import { fail } from '../shared/utils/apiResponse';
import { prisma } from '../config/database';
import logger from '../shared/utils/logger';

const toRoleCodeSet = (roles: RoleCode[]): Set<RoleCode> => {
  return new Set(roles);
};

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(fail('Missing or invalid authorization header', 'UNAUTHORIZED'));
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const payload = await verifyAccessToken(token);

    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      typeId: payload.typeId,
      iat: payload.iat,
      exp: payload.exp,
    };

    // Check if user still has active (non-revoked) refresh tokens
    // If all tokens are revoked (force logout), reject the request
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isActive: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json(fail('User account is inactive or has been logged out', 'USER_INACTIVE'));
    }

    return next();
  } catch (error) {
    logger.warn('Access token verification failed', { error });
    return res.status(401).json(fail('Invalid or expired access token', 'INVALID_ACCESS_TOKEN'));
  }
};

export const allowRoles = (...roles: RoleCode[]): RequestHandler => {
  const allowedRoleCodes = toRoleCodeSet(roles);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(fail('Unauthorized', 'UNAUTHORIZED'));
    }

    // SYSTEM_ADMIN has full access regardless of route-level role filters.
    if (req.user.role === USER_TYPE_CODES.SYSTEM_ADMIN) {
      return next();
    }

    if (!allowedRoleCodes.has(req.user.role)) {
      return res.status(403).json(fail('Forbidden', 'INSUFFICIENT_PERMISSIONS'));
    }

    return next();
  };
};

// Backward-compatible exports for existing module routes.
export const authenticate = authMiddleware;
export const authorize = allowRoles;

export default authMiddleware;

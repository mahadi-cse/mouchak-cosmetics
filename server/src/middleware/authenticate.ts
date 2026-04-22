import { RequestHandler } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.jwt';
import { RoleCode, USER_TYPE_CODES } from '../shared/types/auth.types';
import { fail } from '../shared/utils/apiResponse';
import { prisma } from '../config/database';
import logger from '../shared/utils/logger';

type RoleAlias =
  | 'SYSTEM_ADMIN'
  | 'MANAGER'
  | 'SALES_STAFF'
  | 'CASHIER'
  | 'RIDER'
  | 'CUSTOMER'
  | 'ADMIN'
  | 'STAFF';

type AllowedRole = RoleCode | RoleAlias;

const ROLE_ALIAS_MAP: Record<RoleAlias, RoleCode | RoleCode[]> = {
  SYSTEM_ADMIN: USER_TYPE_CODES.SYSTEM_ADMIN,
  MANAGER: USER_TYPE_CODES.MANAGER,
  SALES_STAFF: USER_TYPE_CODES.SALES_STAFF,
  CASHIER: USER_TYPE_CODES.CASHIER,
  RIDER: USER_TYPE_CODES.RIDER,
  CUSTOMER: USER_TYPE_CODES.CUSTOMER,
  ADMIN: USER_TYPE_CODES.SYSTEM_ADMIN,
  STAFF: [
    USER_TYPE_CODES.MANAGER,
    USER_TYPE_CODES.SALES_STAFF,
    USER_TYPE_CODES.CASHIER,
    USER_TYPE_CODES.RIDER,
  ],
};

const isRoleAlias = (role: AllowedRole): role is RoleAlias => role in ROLE_ALIAS_MAP;

const toRoleCodeSet = (roles: AllowedRole[]): Set<RoleCode> => {
  const normalized = roles.flatMap((role) => {
    if (isRoleAlias(role)) {
      const mapped = ROLE_ALIAS_MAP[role];
      return Array.isArray(mapped) ? mapped : [mapped];
    }

    return [role];
  });

  return new Set(normalized);
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

export const allowRoles = (...roles: AllowedRole[]): RequestHandler => {
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

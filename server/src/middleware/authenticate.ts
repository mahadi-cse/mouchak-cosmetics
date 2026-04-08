import { Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { getKeycloakConfig } from '../config/keycloak';
import { AuthUser, KeycloakTokenPayload } from '../shared/types/keycloak.types';
import { UnauthorizedError } from '../shared/utils/AppError';
import logger from '../shared/utils/logger';

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJWKS = () => {
  if (!JWKS) {
    const config = getKeycloakConfig();
    JWKS = createRemoteJWKSet(new URL(config.jwksUrl));
  }
  return JWKS;
};

const VALID_ROLES = ['ADMIN', 'STAFF', 'CUSTOMER'] as const;

const isValidRole = (role: string): role is typeof VALID_ROLES[number] => {
  return VALID_ROLES.includes(role as any);
};

export const authenticate: RequestHandler = async (
  req,
  res,
  next
) => {
  // TODO: Implement NextAuth next day
  // For now, allow all requests with a test user
  try {
    // TEMPORARY: Bypass JWT verification for testing
    // const authHeader = req.headers.authorization;
    //
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   throw new UnauthorizedError('Missing or invalid authorization header');
    // }
    //
    // const token = authHeader.substring(7);
    // const config = getKeycloakConfig();
    //
    // const verified = await jwtVerify<KeycloakTokenPayload>(
    //   token,
    //   getJWKS(),
    //   {
    //     issuer: config.realmUrl,
    //   }
    // );
    //
    // const payload = verified.payload;
    // const realmRoles = payload.realm_access?.roles ?? [];
    // const userRole = (realmRoles.find(isValidRole) ?? 'CUSTOMER') as typeof VALID_ROLES[number];

    // Set default test user for development
    const authUser: AuthUser = {
      keycloakId: 'test-user-123',
      email: 'admin@cosmetics.test',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN', // Test with admin role
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    };

    req.user = authUser;
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

export const authorize = (...roles: typeof VALID_ROLES[number][]): RequestHandler => {
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

export default authenticate;


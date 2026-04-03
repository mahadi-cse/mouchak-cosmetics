import { Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { getKeycloakConfig } from '../config/keycloak';
import { AuthUser, KeycloakTokenPayload } from '../shared/types/keycloak.types';
import { UnauthorizedError } from '../shared/utils/AppError';
import logger from '../shared/utils/logger';
import { UserRole } from '@prisma/client';

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJWKS = () => {
  if (!JWKS) {
    const config = getKeycloakConfig();
    JWKS = createRemoteJWKSet(new URL(config.jwksUrl));
  }
  return JWKS;
};

const isValidRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const authenticate: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const config = getKeycloakConfig();

    const verified = await jwtVerify<KeycloakTokenPayload>(
      token,
      getJWKS(),
      {
        issuer: config.realmUrl,
      }
    );

    const payload = verified.payload;
    const realmRoles = payload.realm_access?.roles ?? [];
    const userRole = realmRoles.find(isValidRole) ?? UserRole.CUSTOMER;

    const authUser: AuthUser = {
      keycloakId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      role: userRole,
      iat: payload.iat,
      exp: payload.exp,
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

export default authenticate;

import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from '../../config/env';
import { AccessTokenPayload, RoleCode, isRoleCode } from '../../shared/types/auth.types';
import { UnauthorizedError } from '../../shared/utils/AppError';

export interface SignAccessTokenInput {
  sub: number;
  role: RoleCode;
  typeId: number;
}

const getAccessTokenSecret = () => {
  const secret = getEnv().ACCESS_TOKEN_SECRET;
  if (secret.length < 32) {
    throw new Error('ACCESS_TOKEN_SECRET must be at least 32 characters long');
  }

  return new TextEncoder().encode(secret);
};

export const signAccessToken = async (payload: SignAccessTokenInput): Promise<string> => {
  const env = getEnv();

  return new SignJWT({ role: payload.role, typeId: payload.typeId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_EXPIRES_HOURS}h`)
    .sign(getAccessTokenSecret());
};

export const verifyAccessToken = async (token: string): Promise<AccessTokenPayload> => {
  try {
    const { payload } = await jwtVerify(token, getAccessTokenSecret(), {
      algorithms: ['HS256'],
    });

    const role = payload.role;
    const typeId = Number(payload.typeId);

    if (!payload.sub || !/^\d+$/.test(payload.sub)) {
      throw new UnauthorizedError('Invalid token subject', 'INVALID_ACCESS_TOKEN');
    }

    if (typeof role !== 'string' || !isRoleCode(role)) {
      throw new UnauthorizedError('Invalid token role', 'INVALID_ACCESS_TOKEN');
    }

    if (!Number.isInteger(typeId) || typeId <= 0) {
      throw new UnauthorizedError('Invalid token role type', 'INVALID_ACCESS_TOKEN');
    }

    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      throw new UnauthorizedError('Invalid token timestamps', 'INVALID_ACCESS_TOKEN');
    }

    return {
      sub: payload.sub,
      role,
      typeId,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError('Invalid or expired access token', 'INVALID_ACCESS_TOKEN');
  }
};

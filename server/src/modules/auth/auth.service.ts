import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { getEnv } from '../../config/env';
import { UnauthorizedError } from '../../shared/utils/AppError';
import { isRoleCode, RoleCode } from '../../shared/types/auth.types';
import { signAccessToken } from './auth.jwt';

export interface AuthTokenBundle {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    role: RoleCode;
    typeId: number;
  };
  accessTokenExpiresAt: number;
}

const hashRefreshToken = (token: string): string =>
  // Store only a hash at rest so DB exposure does not leak active tokens.
  createHash('sha256').update(token).digest('hex');

const generateRefreshToken = (): string => randomBytes(64).toString('hex');

const getRefreshTokenExpiryDate = (): Date => {
  const env = getEnv();
  return new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
};

const getAccessTokenExpiryDate = (): number => {
  const env = getEnv();
  return Date.now() + env.ACCESS_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000;
};

const assertRoleCode = (roleCode: string): RoleCode => {
  if (!isRoleCode(roleCode)) {
    throw new UnauthorizedError('User role is not allowed', 'INVALID_ROLE');
  }

  return roleCode;
};

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const env = getEnv();
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
};

export class AuthService {
  async login(email: string, password: string): Promise<AuthTokenBundle> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { userType: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.password || !user.userType || !user.userTypeId) {
      throw new UnauthorizedError('This account is not enabled for password authentication', 'AUTH_NOT_ENABLED');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const role = assertRoleCode(user.userType.code);
    const accessToken = await signAccessToken({
      sub: user.id,
      role,
      typeId: user.userTypeId,
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role,
        typeId: user.userTypeId,
      },
      accessTokenExpiresAt: getAccessTokenExpiryDate(),
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokenBundle> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userType: true,
          },
        },
      },
    });

    if (!existingToken) {
      throw new UnauthorizedError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    if (existingToken.revoked) {
      // Reuse of an already-rotated token indicates replay; revoke all active sessions.
      await this.revokeAllUserRefreshTokens(existingToken.userId);
      throw new UnauthorizedError(
        'Refresh token reuse detected. All sessions have been revoked.',
        'REFRESH_TOKEN_REUSED'
      );
    }

    if (existingToken.expiresAt.getTime() <= Date.now()) {
      await prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { revoked: true },
      });

      throw new UnauthorizedError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    if (!existingToken.user.isActive) {
      await this.revokeAllUserRefreshTokens(existingToken.userId);
      throw new UnauthorizedError('User account is inactive', 'USER_INACTIVE');
    }

    if (!existingToken.user.userType || !existingToken.user.userTypeId) {
      await this.revokeAllUserRefreshTokens(existingToken.userId);
      throw new UnauthorizedError('User role assignment is invalid', 'INVALID_ROLE_ASSIGNMENT');
    }

    const role = assertRoleCode(existingToken.user.userType.code);
    const typeId = existingToken.user.userTypeId;

    return prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: existingToken.id },
        data: { revoked: true },
      });

      const nextRefreshToken = generateRefreshToken();
      await tx.refreshToken.create({
        data: {
          userId: existingToken.userId,
          tokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: getRefreshTokenExpiryDate(),
        },
      });

      const accessToken = await signAccessToken({
        sub: existingToken.userId,
        role,
        typeId,
      });

      return {
        accessToken,
        refreshToken: nextRefreshToken,
        user: {
          id: existingToken.userId,
          role,
          typeId,
        },
        accessTokenExpiresAt: getAccessTokenExpiryDate(),
      };
    });
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existingToken) {
      return;
    }

    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
  }

  async getProfile(userId: number) {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        userRoles: {
          include: {
            role: true,
            branch: true,
          },
        },
        userBranches: {
          include: {
            branch: true,
          },
        },
        userModules: {
          where: { isActive: true },
          include: {
            module: true,
          },
          orderBy: {
            module: {
              sortOrder: 'asc'
            }
          }
        },
      },
    });

    if (!profile) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    return profile;
  }

  async updateProfile(userId: number, data: { firstName?: string; lastName?: string; phone?: string; address?: string }) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
      }
    });
    
    return updatedUser;
  }
}

export default new AuthService();

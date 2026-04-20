import { randomBytes, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { getEnv } from '../../config/env';
import { ConflictError, UnauthorizedError, ValidationError } from '../../shared/utils/AppError';
import { isRoleCode, RoleCode, USER_TYPE_CODES } from '../../shared/types/auth.types';
import { signAccessToken } from './auth.jwt';
import { GoogleSignInInput, RegisterInput } from './auth.schema';

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

interface GoogleTokenInfo {
  aud?: string;
  audience?: string;
  issued_to?: string;
  email?: string;
  email_verified?: string | boolean;
  verified_email?: string | boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
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
  private async getCustomerUserType() {
    const customerType = await prisma.userType.findUnique({
      where: { code: USER_TYPE_CODES.CUSTOMER },
    });

    if (!customerType) {
      throw new ValidationError(
        `Missing customer role code ${USER_TYPE_CODES.CUSTOMER}. Run auth seed first.`,
        'CUSTOMER_ROLE_NOT_CONFIGURED'
      );
    }

    return customerType;
  }

  private async issueTokens(userId: number, role: RoleCode, typeId: number): Promise<AuthTokenBundle> {
    const accessToken = await signAccessToken({
      sub: userId,
      role,
      typeId,
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: getRefreshTokenExpiryDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        role,
        typeId,
      },
      accessTokenExpiresAt: getAccessTokenExpiryDate(),
    };
  }

  private async verifyGoogleToken(input: GoogleSignInInput): Promise<GoogleTokenInfo> {
    const env = getEnv();

    if (!env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedError('Google sign-in is not configured', 'GOOGLE_NOT_CONFIGURED');
    }

    const tokenInfoUrl = input.idToken
      ? `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(input.idToken)}`
      : `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(input.accessToken!)}`;

    const response = await fetch(tokenInfoUrl);

    if (!response.ok) {
      throw new UnauthorizedError('Invalid Google token', 'INVALID_GOOGLE_TOKEN');
    }

    const tokenInfo = (await response.json()) as GoogleTokenInfo;
    const audience = tokenInfo.aud || tokenInfo.audience || tokenInfo.issued_to;
    if (!audience || audience !== env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedError('Google token audience mismatch', 'INVALID_GOOGLE_AUDIENCE');
    }

    const isEmailVerified =
      tokenInfo.email_verified === true ||
      tokenInfo.email_verified === 'true' ||
      tokenInfo.verified_email === true ||
      tokenInfo.verified_email === 'true';

    if (!tokenInfo.email || !isEmailVerified) {
      throw new UnauthorizedError('Google email is not verified', 'GOOGLE_EMAIL_NOT_VERIFIED');
    }

    return tokenInfo;
  }

  private getNameFromGoogle(tokenInfo: GoogleTokenInfo): { firstName: string; lastName: string } {
    const fallbackName = tokenInfo.name?.trim() || '';
    const fallbackParts = fallbackName ? fallbackName.split(/\s+/) : [];
    const firstName = tokenInfo.given_name?.trim() || fallbackParts[0] || 'Customer';
    const lastName =
      tokenInfo.family_name?.trim() || fallbackParts.slice(1).join(' ') || 'User';

    return { firstName, lastName };
  }

  async login(email: string, password: string): Promise<AuthTokenBundle> {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
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
    return this.issueTokens(user.id, role, user.userTypeId);
  }

  async register(input: RegisterInput): Promise<AuthTokenBundle> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email is already registered', 'EMAIL_ALREADY_EXISTS');
    }

    const customerType = await this.getCustomerUserType();
    const hashedPassword = await hashPassword(input.password);
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const phone = input.phone?.trim() || null;

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          userTypeId: customerType.id,
          firstName,
          lastName,
          phone,
          isActive: true,
        },
      });

      await tx.customer.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
        },
      });

      return user;
    });

    const customerRole = assertRoleCode(USER_TYPE_CODES.CUSTOMER);
    return this.issueTokens(createdUser.id, customerRole, customerType.id);
  }

  async loginWithGoogle(input: GoogleSignInInput): Promise<AuthTokenBundle> {
    const tokenInfo = await this.verifyGoogleToken(input);
    const email = tokenInfo.email!.trim().toLowerCase();
    const { firstName, lastName } = this.getNameFromGoogle(tokenInfo);
    const customerType = await this.getCustomerUserType();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { userType: true, customer: true },
    });

    if (existingUser && !existingUser.isActive) {
      throw new UnauthorizedError('User account is inactive', 'USER_INACTIVE');
    }

    if (
      existingUser?.userType?.code &&
      existingUser.userType.code !== USER_TYPE_CODES.CUSTOMER
    ) {
      throw new UnauthorizedError(
        'Google sign-in is available only for customer accounts',
        'GOOGLE_ROLE_NOT_ALLOWED'
      );
    }

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            userTypeId: existingUser.userTypeId || customerType.id,
            firstName: existingUser.firstName || firstName,
            lastName: existingUser.lastName || lastName,
            isActive: true,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            password: null,
            userTypeId: customerType.id,
            firstName,
            lastName,
            isActive: true,
          },
        });

    // Store personal details on the Customer record
    const customerFirstName = existingUser?.customer?.firstName || firstName;
    const customerLastName = existingUser?.customer?.lastName || lastName;

    await prisma.customer.upsert({
      where: { userId: user.id },
      update: {
        firstName: customerFirstName,
        lastName: customerLastName,
      },
      create: {
        userId: user.id,
        firstName,
        lastName,
      },
    });

    const customerRole = assertRoleCode(USER_TYPE_CODES.CUSTOMER);
    return this.issueTokens(user.id, customerRole, user.userTypeId || customerType.id);
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
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
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

    // For customer users, prefer the Customer table fields
    if (profile.customer) {
      return {
        ...profile,
        firstName: profile.customer.firstName,
        lastName: profile.customer.lastName,
        phone: profile.customer.phone,
      };
    }

    return profile;
  }

  async updateProfile(userId: number, data: { firstName?: string; lastName?: string; phone?: string; address?: string }) {
    // Check if this user is a customer
    const customer = await prisma.customer.findUnique({ where: { userId } });

    if (customer) {
      // Customer users: update personal details on the Customer table
      const updatedCustomer = await prisma.customer.update({
        where: { userId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.address !== undefined && { defaultAddress: data.address }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          defaultAddress: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return {
        id: updatedCustomer.user.id,
        email: updatedCustomer.user.email,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        phone: updatedCustomer.phone,
        address: updatedCustomer.defaultAddress,
      };
    }

    // Non-customer (staff) users: update on User table as before
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

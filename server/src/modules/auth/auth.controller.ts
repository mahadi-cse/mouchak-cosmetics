import { RequestHandler } from 'express';
import { getEnv } from '../../config/env';
import { prisma } from '../../config/database';
import { UnauthorizedError, ValidationError } from '../../shared/utils/AppError';
import { ok } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import authService from './auth.service';
import { googleSignInSchema, loginSchema, registerSchema } from './auth.schema';

const buildRefreshCookieOptions = () => {
  const env = getEnv();

  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  };
};

const getRefreshTokenFromRequest = (req: Parameters<RequestHandler>[0]): string | undefined => {
  const env = getEnv();
  return req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
};

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid login payload');
  }

  const result = await authService.login(parsed.data.email, parsed.data.password);
  const env = getEnv();

  // Refresh token is intentionally cookie-only to keep it out of JS runtime.
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());

  res.json(
    ok(
      {
        accessToken: result.accessToken,
        user: result.user,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      },
      'Login successful'
    )
  );
});

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid registration payload');
  }

  const result = await authService.register(parsed.data);
  const env = getEnv();

  // Keep refresh token HttpOnly and cookie-only.
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());

  res.json(
    ok(
      {
        accessToken: result.accessToken,
        user: result.user,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      },
      'Registration successful'
    )
  );
});

export const googleSignIn: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = googleSignInSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message || 'Invalid Google sign-in payload');
  }

  const result = await authService.loginWithGoogle(parsed.data);
  const env = getEnv();

  // Keep refresh token HttpOnly and cookie-only.
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());

  res.json(
    ok(
      {
        accessToken: result.accessToken,
        user: result.user,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      },
      'Google sign-in successful'
    )
  );
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) {
    throw new UnauthorizedError('Missing refresh token cookie', 'MISSING_REFRESH_TOKEN');
  }

  const result = await authService.refresh(refreshToken);
  const env = getEnv();

  // Rotate refresh token on every use (one-time token strategy).
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());

  res.json(
    ok(
      {
        accessToken: result.accessToken,
        user: result.user,
        accessTokenExpiresAt: result.accessTokenExpiresAt,
      },
      'Access token refreshed'
    )
  );
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  const env = getEnv();

  await authService.logout(refreshToken);

  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });

  res.json(ok({ loggedOut: true }, 'Logged out successfully'));
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'UNAUTHORIZED');
  }

  res.json(ok(req.user));
});

export const profile: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'UNAUTHORIZED');
  }

  const userProfile = await authService.getProfile(req.user.id);
  res.json(ok(userProfile));
});

export const updateProfile: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'UNAUTHORIZED');
  }

  const { firstName, lastName, phone, address } = req.body;
  const updated = await authService.updateProfile(req.user.id, { firstName, lastName, phone, address });
  
  res.json(ok(updated, 'Profile updated successfully'));
});

export const adminOnlyHealth: RequestHandler = asyncHandler(async (_req, res) => {
  res.json(ok({ status: 'authorized', area: 'admin' }));
});

export const getUserTypes: RequestHandler = asyncHandler(async (_req, res) => {
  const types = await prisma.userType.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { id: 'asc' },
  });
  res.json(ok(types));
});

export const getUsers: RequestHandler = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const users = await prisma.user.findMany({
    where: {
      userType: {
        code: { notIn: ['9x909'] }, // exclude CUSTOMER
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      createdAt: true,
      userTypeId: true,
      userType: { select: { id: true, code: true, name: true } },
      userModules: {
        where: { isActive: true },
        select: { module: { select: { id: true, code: true, name: true, icon: true } } },
      },
      userBranches: {
        where: { isActive: true },
        select: { branch: { select: { id: true, name: true } }, isPrimary: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(ok(users));
});

export const createUser: RequestHandler = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, isActive, typeId, moduleCodes } = req.body;

  if (!firstName || !email || !password) {
    throw new ValidationError('firstName, email and password are required');
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) throw new ValidationError('Email already exists');

  const { hashPassword } = await import('./auth.service');
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: hashed,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      phone: phone?.trim() || null,
      isActive: isActive !== false,
      userTypeId: typeId ? Number(typeId) : null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      userTypeId: true,
    },
  });

  // Assign modules if provided
  if (Array.isArray(moduleCodes) && moduleCodes.length > 0) {
    const modules = await prisma.appModule.findMany({ where: { code: { in: moduleCodes } } });
    for (const mod of modules) {
      await prisma.userModule.upsert({
        where: { userId_moduleId: { userId: user.id, moduleId: mod.id } },
        update: { isActive: true },
        create: { userId: user.id, moduleId: mod.id, isActive: true },
      });
    }
  }

  res.json(ok(user, 'User created'));
});

export const updateUser: RequestHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id) throw new ValidationError('Invalid user id');

  const { firstName, lastName, phone, password, isActive, typeId } = req.body;
  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (phone !== undefined) data.phone = phone || null;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (typeId !== undefined) data.userTypeId = Number(typeId);
  if (password && typeof password === 'string' && password.trim().length >= 8) {
    const { hashPassword } = await import('./auth.service');
    data.password = await hashPassword(password);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      isActive: true,
      userTypeId: true,
      userType: { select: { id: true, code: true, name: true } },
    },
  });
  res.json(ok(updated, 'User updated'));
});

export const updateUserModules: RequestHandler = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError('Invalid user id');

  const { moduleCodes } = req.body as { moduleCodes?: string[] };
  if (!Array.isArray(moduleCodes)) throw new ValidationError('moduleCodes must be an array');

  const modules = await prisma.appModule.findMany({
    where: { code: { in: moduleCodes } },
  });

  await prisma.$transaction(async (tx) => {
    // Deactivate all existing
    await tx.userModule.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Upsert selected modules
    for (const mod of modules) {
      await tx.userModule.upsert({
        where: { userId_moduleId: { userId, moduleId: mod.id } },
        update: { isActive: true },
        create: { userId, moduleId: mod.id, isActive: true },
      });
    }
  });

  const result = await prisma.userModule.findMany({
    where: { userId, isActive: true },
    include: { module: true },
  });
  res.json(ok(result, 'Modules updated'));
});

export const forceLogout: RequestHandler = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError('Invalid user id');

  await prisma.$transaction([
    prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    }),
  ]);

  res.json(ok({ userId }, 'All sessions revoked and user deactivated'));
});

export const updateUserBranches: RequestHandler = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) throw new ValidationError('Invalid user id');

  const { branchIds, primaryBranchId } = req.body as { branchIds?: number[]; primaryBranchId?: number | null };
  if (!Array.isArray(branchIds)) throw new ValidationError('branchIds must be an array');

  await prisma.$transaction(async (tx) => {
    // Deactivate all existing
    await tx.userBranch.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    for (const branchId of branchIds) {
      await tx.userBranch.upsert({
        where: { userId_branchId: { userId, branchId } },
        update: { isActive: true, isPrimary: branchId === primaryBranchId },
        create: { userId, branchId, isActive: true, isPrimary: branchId === primaryBranchId },
      });
    }
  });

  const result = await prisma.userBranch.findMany({
    where: { userId, isActive: true },
    include: { branch: true },
  });
  res.json(ok(result, 'Branches updated'));
});

export default {
  login,
  register,
  googleSignIn,
  refresh,
  logout,
  me,
  profile,
  updateProfile,
  adminOnlyHealth,
  getUserTypes,
  getUsers,
  createUser,
  updateUser,
  updateUserModules,
  updateUserBranches,
  forceLogout,
};

import { RequestHandler } from 'express';
import { getEnv } from '../../config/env';
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
};

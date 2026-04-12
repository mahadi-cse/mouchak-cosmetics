import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

type AccessTokenClaims = {
  sub: string;
  role: string;
  typeId: number;
  iat: number;
  exp: number;
};

type BackendAuthResponse = {
  data?: {
    accessToken?: string;
  };
};

const getBackendApiBaseUrl = (): string => {
  const raw = process.env.AUTH_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  return raw.replace(/\/$/, '');
};

const getRefreshCookieName = (): string => {
  return process.env.AUTH_REFRESH_COOKIE_NAME || 'mouchak_refresh_token';
};

const toBase64 = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return normalized + '='.repeat(paddingLength);
};

const decodeBase64 = (value: string): string => {
  if (typeof atob === 'function') {
    return atob(value);
  }

  return Buffer.from(value, 'base64').toString('utf8');
};

const decodeAccessToken = (token: string): AccessTokenClaims => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT');
  }

  const payload = parts[1];
  const decoded = decodeBase64(toBase64(payload));
  return JSON.parse(decoded) as AccessTokenClaims;
};

const getSetCookieHeaders = (headers: Headers): string[] => {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetSetCookie.getSetCookie === 'function') {
    return withGetSetCookie.getSetCookie();
  }

  const single = headers.get('set-cookie');
  return single ? [single] : [];
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const readRefreshTokenFromSetCookie = (setCookieHeaders: string[]): string | null => {
  const refreshCookieName = getRefreshCookieName();
  const matcher = new RegExp(`${escapeRegex(refreshCookieName)}=([^;]+)`);

  for (const cookieHeader of setCookieHeaders) {
    const match = cookieHeader.match(matcher);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
};

const parseBackendToken = async (response: Response): Promise<{ accessToken: string; refreshToken: string; claims: AccessTokenClaims }> => {
  const body = (await response.json()) as BackendAuthResponse;
  const accessToken = body?.data?.accessToken;

  if (!accessToken) {
    throw new Error('Backend auth response did not include an access token');
  }

  const refreshToken = readRefreshTokenFromSetCookie(getSetCookieHeaders(response.headers));
  if (!refreshToken) {
    throw new Error('Backend auth response did not include a refresh token cookie');
  }

  return {
    accessToken,
    refreshToken,
    claims: decodeAccessToken(accessToken),
  };
};

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  try {
    if (!token.refreshToken || typeof token.refreshToken !== 'string') {
      return { ...token, error: 'MissingRefreshToken' };
    }

    const refreshCookieName = getRefreshCookieName();
    const response = await fetch(`${getBackendApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: `${refreshCookieName}=${encodeURIComponent(token.refreshToken)}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }

    const parsed = await parseBackendToken(response);

    return {
      ...token,
      userId: parsed.claims.sub,
      role: parsed.claims.role,
      typeId: parsed.claims.typeId,
      accessToken: parsed.accessToken,
      accessTokenExpiresAt: parsed.claims.exp * 1000,
      refreshToken: parsed.refreshToken,
      error: undefined,
    };
  } catch {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').trim().toLowerCase();
        const password = String(credentials?.password || '');

        if (!email || !password) {
          return null;
        }

        const response = await fetch(`${getBackendApiBaseUrl()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          cache: 'no-store',
        });

        if (!response.ok) {
          return null;
        }

        const parsed = await parseBackendToken(response);

        return {
          id: parsed.claims.sub,
          email,
          role: parsed.claims.role,
          typeId: parsed.claims.typeId,
          accessToken: parsed.accessToken,
          accessTokenExpiresAt: parsed.claims.exp * 1000,
          refreshToken: parsed.refreshToken,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const signedInUser = user as typeof user & {
          role: string;
          typeId: number;
          accessToken: string;
          accessTokenExpiresAt: number;
          refreshToken: string;
        };

        return {
          ...token,
          userId: signedInUser.id,
          role: signedInUser.role,
          typeId: signedInUser.typeId,
          accessToken: signedInUser.accessToken,
          accessTokenExpiresAt: signedInUser.accessTokenExpiresAt,
          refreshToken: signedInUser.refreshToken,
          error: undefined,
        };
      }

      if (!token.accessToken || typeof token.accessTokenExpiresAt !== 'number') {
        return token;
      }

      const refreshBufferMs = 30 * 1000;
      const shouldRefresh = Date.now() >= token.accessTokenExpiresAt - refreshBufferMs;
      if (!shouldRefresh) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: String(token.userId || token.sub || ''),
        role: typeof token.role === 'string' ? token.role : '',
        typeId: typeof token.typeId === 'number' ? token.typeId : undefined,
      };

      session.accessToken = typeof token.accessToken === 'string' ? token.accessToken : undefined;
      session.error = typeof token.error === 'string' ? token.error : undefined;

      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = 'token' in message ? message.token : undefined;

      if (!token?.refreshToken || typeof token.refreshToken !== 'string') {
        return;
      }

      try {
        const refreshCookieName = getRefreshCookieName();
        await fetch(`${getBackendApiBaseUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            Cookie: `${refreshCookieName}=${encodeURIComponent(token.refreshToken)}`,
          },
          cache: 'no-store',
        });
      } catch {
        // Sign-out should continue even if backend token revocation fails.
      }
    },
  },
  trustHost: true,
});

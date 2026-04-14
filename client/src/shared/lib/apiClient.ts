import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import { API_CONFIG } from '../constants/config';
import { parseApiError, formatErrorLog } from '../utils/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

type JwtPayload = {
  exp?: number;
};

const SESSION_REFRESH_BUFFER_MS = 30 * 1000;
const UNAUTHENTICATED_CACHE_MS = 10 * 1000;
const FALLBACK_CACHE_MS = 5 * 60 * 1000;

let sessionPromise: Promise<Session | null> | null = null;
let cachedSession: Session | null = null;
let sessionCacheExpiresAt = 0;

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(paddingLength);
    const decoded = atob(padded);

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

const getAccessTokenExpiresAt = (accessToken?: string): number | null => {
  if (!accessToken) {
    return null;
  }

  const payload = parseJwtPayload(accessToken);
  if (!payload?.exp || typeof payload.exp !== 'number') {
    return null;
  }

  return payload.exp * 1000;
};

const getSessionCacheExpiresAt = (session: Session | null): number => {
  const now = Date.now();
  if (!session?.accessToken) {
    return now + UNAUTHENTICATED_CACHE_MS;
  }

  const sessionExpiresAt = session.expires ? Date.parse(session.expires) : Number.NaN;
  const tokenExpiresAt = getAccessTokenExpiresAt(session.accessToken);
  const validExpiries = [sessionExpiresAt, tokenExpiresAt].filter(
    (value): value is number => Number.isFinite(value)
  );

  if (validExpiries.length === 0) {
    return now + FALLBACK_CACHE_MS;
  }

  const earliestExpiry = Math.min(...validExpiries);
  return Math.max(now + 1000, earliestExpiry - SESSION_REFRESH_BUFFER_MS);
};

async function getCachedSession() {
  if (typeof window === 'undefined') return null;

  if (cachedSession && Date.now() < sessionCacheExpiresAt) {
    return cachedSession;
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = getSession()
    .then((session) => {
      cachedSession = session;
      sessionCacheExpiresAt = getSessionCacheExpiresAt(session);
      return session;
    })
    .catch((error) => {
      cachedSession = null;
      sessionCacheExpiresAt = 0;
      throw error;
    })
    .finally(() => {
      sessionPromise = null;
    });

  return sessionPromise;
}

// Request interceptor - Add auth token and logging
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      // Use a custom session cache to prevent multiple parallel /api/auth/session calls
      const session = await getCachedSession();
      const accessToken = session?.accessToken;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ✓ ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      sessionPromise = null;
      cachedSession = null;
      sessionCacheExpiresAt = 0;

      if (typeof window !== 'undefined') {
        if (!window.location.pathname.includes('/login')) {
          // Sign out clears the session cookie and returns to login.
          void signOut({ callbackUrl: '/login' });
        }
      }
    }

    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      console.error('[API] Forbidden - Access denied');
    }

    // Handle 404 - Not Found
    if (error.response?.status === 404) {
      console.warn('[API] Not Found - Resource not found');
    }

    // Handle 429 - Rate Limit
    if (error.response?.status === 429) {
      console.warn('[API] Rate Limit - Too many requests');
    }

    // Handle 500+ - Server Errors
    if (error.response && error.response.status >= 500) {
      console.error('[API] Server Error:', formatErrorLog(error));
    }

    // Network errors
    if (!error.response && error.message === 'Network Error') {
      console.error('[API] Network Error - Check your internet connection');
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Timeout - Request took too long');
    }

    // Parse and format error
    const apiError = parseApiError(error);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[API] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, apiError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

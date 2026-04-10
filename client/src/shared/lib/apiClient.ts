import axios, { AxiosError } from 'axios';
import { API_CONFIG } from '../constants/config';
import { parseApiError, getAuthError, formatErrorLog } from '../utils/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add auth token and logging
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const originalRequest = error.config as any;

    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
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

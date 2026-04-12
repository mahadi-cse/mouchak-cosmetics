import { ApiError, HTTP_STATUS } from '../types';
import { ERROR_MESSAGES } from '../constants';

/**
 * Parse API error response
 */
export const parseApiError = (error: any): ApiError => {
  const defaultError: ApiError = {
    success: false,
    message: ERROR_MESSAGES.UNKNOWN_ERROR,
    error: 'UNKNOWN_ERROR',
    errorCode: 'UNKNOWN',
    statusCode: 500,
  };

  if (!error) return defaultError;

  // Axios error
  if (error.response) {
    return {
      success: false,
      message: error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR,
      error: error.response.data?.error || 'SERVER_ERROR',
      errorCode: error.response.data?.errorCode || String(error.response.status),
      statusCode: error.response.status,
      details: error.response.data?.details,
    };
  }

  // Network error
  if (error.message === 'Network Error') {
    return {
      ...defaultError,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      error: 'NETWORK_ERROR',
      errorCode: 'NETWORK',
      statusCode: 0,
    };
  }

  // Timeout error
  if (error.code === 'ECONNABORTED') {
    return {
      ...defaultError,
      message: ERROR_MESSAGES.TIMEOUT_ERROR,
      error: 'TIMEOUT_ERROR',
      errorCode: 'TIMEOUT',
      statusCode: 504,
    };
  }

  // Regular error
  if (error instanceof Error) {
    return {
      ...defaultError,
      message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      error: error.name || 'ERROR',
    };
  }

  return defaultError;
};

/**
 * Get auth error
 */
export const getAuthError = (): ApiError => {
  return {
    success: false,
    message: ERROR_MESSAGES.AUTH_ERROR,
    error: 'AUTH_ERROR',
    errorCode: 'AUTH',
    statusCode: HTTP_STATUS.UNAUTHORIZED,
  };
};

/**
 * Get user-friendly error message
 */
export const getUserErrorMessage = (error: any): string => {
  const apiError = parseApiError(error);

  const statusCodeMap: Record<number, string> = {
    [HTTP_STATUS.BAD_REQUEST]: ERROR_MESSAGES.VALIDATION_ERROR,
    [HTTP_STATUS.UNAUTHORIZED]: ERROR_MESSAGES.AUTH_ERROR,
    [HTTP_STATUS.FORBIDDEN]: ERROR_MESSAGES.PERMISSION_ERROR,
    [HTTP_STATUS.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
    [HTTP_STATUS.CONFLICT]: ERROR_MESSAGES.CONFLICT,
    [HTTP_STATUS.RATE_LIMIT]: 'Too many requests. Please try again later.',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: ERROR_MESSAGES.SERVER_ERROR,
    [HTTP_STATUS.SERVICE_UNAVAILABLE]: ERROR_MESSAGES.SERVER_ERROR,
    [HTTP_STATUS.GATEWAY_TIMEOUT]: ERROR_MESSAGES.TIMEOUT_ERROR,
  };

  return statusCodeMap[apiError.statusCode] || apiError.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.message === 'Network Error';
};

/**
 * Check if error is validation error
 */
export const isValidationError = (error: any): boolean => {
  return error.response?.status === HTTP_STATUS.BAD_REQUEST;
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error.response?.status === HTTP_STATUS.UNAUTHORIZED;
};

/**
 * Check if error is permission error
 */
export const isPermissionError = (error: any): boolean => {
  return error.response?.status === HTTP_STATUS.FORBIDDEN;
};

/**
 * Check if error is not found error
 */
export const isNotFoundError = (error: any): boolean => {
  return error.response?.status === HTTP_STATUS.NOT_FOUND;
};

/**
 * Check if error is rate limit error
 */
export const isRateLimitError = (error: any): boolean => {
  return error.response?.status === HTTP_STATUS.RATE_LIMIT;
};

/**
 * Check if error is server error
 */
export const isServerError = (error: any): boolean => {
  return error.response?.status >= 500;
};

/**
 * Extract validation errors from response
 */
export const extractValidationErrors = (error: any): Record<string, string> => {
  if (!isValidationError(error)) return {};

  const details = error.response?.data?.details || {};
  const errors: Record<string, string> = {};

  Object.entries(details).forEach(([key, value]) => {
    errors[key] = Array.isArray(value) ? value[0] : String(value);
  });

  return errors;
};

/**
 * Format error for console logging
 */
export const formatErrorLog = (error: any): string => {
  const apiError = parseApiError(error);
  return `[${apiError.statusCode}] ${apiError.errorCode}: ${apiError.message}`;
};


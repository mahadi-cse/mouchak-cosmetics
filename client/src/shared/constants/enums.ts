// HTTP Methods
export enum HTTP_METHOD {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

// Status Codes
export enum HTTP_STATUS_CODE {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  RATE_LIMIT = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Request Status
export enum REQUEST_STATUS {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Query Status
export enum QUERY_STATUS {
  FRESH = 'fresh',
  FETCHING = 'fetching',
  PAUSED = 'paused',
  STALE = 'stale',
  INACTIVE = 'inactive',
}

// Notification Types
export enum NOTIFICATION_TYPE {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Theme
export enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

// Layout
export enum LAYOUT {
  GRID = 'grid',
  LIST = 'list',
  MASONRY = 'masonry',
  TABLE = 'table',
}

// Sort Direction
export enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

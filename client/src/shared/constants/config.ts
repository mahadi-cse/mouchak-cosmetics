// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  SIZES: [10, 20, 50, 100],
} as const;

// Cache Times (in milliseconds)
export const CACHE_TIME = {
  INSTANT: 0,
  SHORT: 1 * 60 * 1000,       // 1 minute
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Customer Routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  MY_ORDERS: '/my-orders',
  ORDER_DETAIL: '/my-orders/:id',
  CHECKOUT: '/checkout',
  WISHLIST: '/wishlist',
  CART: '/cart',
  
  // Shop Routes
  SHOP: '/shop',
  PRODUCT_DETAIL: '/product/:slug',
  CATEGORY: '/category/:slug',
  
  // Staff Routes
  STAFF_DASHBOARD: '/staff/dashboard',
  STAFF_PRODUCTS: '/staff/products',
  STAFF_ORDERS: '/staff/orders',
  STAFF_CUSTOMERS: '/staff/customers',
  STAFF_INVENTORY: '/staff/inventory',
  STAFF_ANALYTICS: '/staff/analytics',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'Resource not found.',
  CONFLICT: 'This resource already exists.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  SAVED: 'Saved successfully.',
  LOADED: 'Loaded successfully.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  PREFERENCES: 'preferences',
  CART: 'cart',
  RECENT_SEARCHES: 'recentSearches',
  FILTERS: 'filters',
} as const;

// Product Constants
export const PRODUCT = {
  MIN_PRICE: 0,
  MAX_PRICE: 1000000,
  FEATURED_ITEMS: 8,
  GRID_COLUMNS: 4,
} as const;

// Order Constants
export const ORDER = {
  ITEMS_PER_PAGE: 10,
  TRACKING_NUMBER_PREFIX: 'ORD-',
} as const;

// Payment Constants
export const PAYMENT = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 10000000,
  TAX_RATE: 0.15,
  SHIPPING_COST: 100,
  FREE_SHIPPING_THRESHOLD: 5000,
} as const;

// Analytics
export const ANALYTICS = {
  DATE_RANGE_DAYS: 30,
  CHART_COLORS: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
} as const;

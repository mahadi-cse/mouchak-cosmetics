// Regular Expressions for validation
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]{10,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  CREDIT_CARD: /^[0-9]{13,19}$/,
  ZIP_CODE: /^[0-9]{5}(?:-[0-9]{4})?$/,
} as const;

// Date & Time Format
export const DATE_FORMAT = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'MMMM dd, yyyy HH:mm:ss',
  TIME: 'HH:mm:ss',
  TIME_SHORT: 'HH:mm',
  DATE_TIME: 'MMM dd, yyyy HH:mm',
} as const;

// Image & File Constants
export const FILE = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  MAX_IMAGES: 10,
  IMAGE_SIZES: {
    THUMBNAIL: { width: 100, height: 100 },
    SMALL: { width: 300, height: 300 },
    MEDIUM: { width: 600, height: 600 },
    LARGE: { width: 1200, height: 1200 },
  },
} as const;

// Breakpoints (Tailwind-like)
export const BREAKPOINTS = {
  XS: 320,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Animation Duration (ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
} as const;

// Notification Duration (ms)
export const NOTIFICATION = {
  SHORT: 2000,
  NORMAL: 3000,
  LONG: 5000,
} as const;

// Request Debounce & Throttle (ms)
export const TIMING = {
  DEBOUNCE_SEARCH: 300,
  DEBOUNCE_RESIZE: 150,
  DEBOUNCE_BLUR: 200,
  THROTTLE_SCROLL: 250,
  THROTTLE_CLICK: 100,
} as const;

import { STORAGE_KEYS } from '../constants';

/**
 * Get item from localStorage
 */
export const getStorage = <T = any>(key: string, defaultValue: T | null = null): T | null => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

/**
 * Set item to localStorage
 */
export const setStorage = (key: string, value: any): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 */
export const removeStorage = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
    return false;
  }
};

/**
 * Clear all localStorage
 */
export const clearStorage = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage', error);
    return false;
  }
};

/**
 * Get auth token
 */
export const getAuthToken = (): string | null => {
  return getStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Set auth token
 */
export const setAuthToken = (token: string): boolean => {
  return setStorage(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Remove auth token
 */
export const removeAuthToken = (): boolean => {
  return removeStorage(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get user from storage
 */
export const getStoredUser = (): any => {
  return getStorage(STORAGE_KEYS.USER);
};

/**
 * Set user to storage
 */
export const setStoredUser = (user: any): boolean => {
  return setStorage(STORAGE_KEYS.USER, user);
};

/**
 * Get cart from storage
 */
export const getCart = (): any[] => {
  return (getStorage(STORAGE_KEYS.CART, [] as any[]) || []) as any[];
};

/**
 * Set cart to storage
 */
export const setCart = (cart: any[]): boolean => {
  return setStorage(STORAGE_KEYS.CART, cart);
};

/**
 * Add to cart
 */
export const addToCart = (item: any): boolean => {
  const cart = getCart();
  const existing = cart.find((c) => c.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    cart.push(item);
  }
  return setCart(cart);
};

/**
 * Remove from cart
 */
export const removeFromCart = (productId: number): boolean => {
  const cart = getCart();
  const filtered = cart.filter((c) => c.productId !== productId);
  return setCart(filtered);
};

/**
 * Clear cart
 */
export const clearCart = (): boolean => {
  return removeStorage(STORAGE_KEYS.CART);
};

/**
 * Get preferences
 */
export const getPreferences = (): any => {
  return getStorage(STORAGE_KEYS.PREFERENCES, {});
};

/**
 * Set preference
 */
export const setPreference = (key: string, value: any): boolean => {
  const prefs = getPreferences();
  prefs[key] = value;
  return setStorage(STORAGE_KEYS.PREFERENCES, prefs);
};

import { describe, it, expect } from 'vitest';
import { formatPrice, truncate, isValidEmail } from '@/shared/utils';

describe('Formatters', () => {
  describe('formatPrice', () => {
    it('should format price with currency', () => {
      const result = formatPrice(1000);
      expect(result).toContain('1,000');
    });

    it('should handle zero price', () => {
      const result = formatPrice(0);
      expect(result).toBeDefined();
    });
  });

  describe('truncate', () => {
    it('should truncate string to max length', () => {
      const result = truncate('Hello World', 5);
      expect(result).toBe('He...');
    });

    it('should not truncate if string is shorter than max length', () => {
      const result = truncate('Hi', 10);
      expect(result).toBe('Hi');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });
});

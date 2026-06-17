import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  description: z.string().max(500).optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().nonnegative().optional(),
  maxDiscountAmount: z.coerce.number().nonnegative().optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  value: z.coerce.number().positive().optional(),
  minOrderAmount: z.coerce.number().nonnegative().optional().nullable(),
  maxDiscountAmount: z.coerce.number().nonnegative().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.coerce.number().nonnegative(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

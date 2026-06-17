import { z } from 'zod';

export const createPromotionSchema = z.object({
  label: z.string().min(1, 'Promotion name is required').max(200),
  banner: z.string().min(1, 'Banner text is required').max(500),
  pct: z.coerce.number().int().min(1, 'Discount must be at least 1%').max(95, 'Discount cannot exceed 95%'),
  endsAt: z.string().max(100).optional(),
  isActive: z.boolean().default(false),

  // Scope
  applyTo: z.enum(['ALL', 'PRODUCT', 'CATEGORY']).default('ALL'),
  productIds: z.array(z.coerce.number().int().positive()).default([]),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
}).refine(
  (data) => {
    if (data.applyTo === 'PRODUCT') {
      return data.productIds.length > 0;
    }
    return true;
  },
  { message: 'At least one product must be selected when applying to specific products', path: ['productIds'] }
).refine(
  (data) => {
    if (data.applyTo === 'CATEGORY') {
      return data.categoryId != null;
    }
    return true;
  },
  { message: 'A category must be selected when applying to a category', path: ['categoryId'] }
).refine(
  (data) => {
    if (data.applyTo === 'ALL') {
      return data.productIds.length === 0 && !data.categoryId;
    }
    return true;
  },
  { message: 'Product IDs and category should not be set when applying to all products', path: ['applyTo'] }
);

export const updatePromotionSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  banner: z.string().min(1).max(500).optional(),
  pct: z.coerce.number().int().min(1).max(95).optional(),
  endsAt: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),

  // Scope
  applyTo: z.enum(['ALL', 'PRODUCT', 'CATEGORY']).optional(),
  productIds: z.array(z.coerce.number().int().positive()).optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

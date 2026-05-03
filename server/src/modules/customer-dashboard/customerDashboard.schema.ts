import { z } from 'zod';

export const orderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const returnReasonEnum = z.enum([
  'DEFECTIVE',
  'WRONG_ITEM',
  'COLOR_MISMATCH',
  'NOT_AS_DESCRIBED',
  'CUSTOMER_CHANGED_MIND',
  'DAMAGED_IN_TRANSIT',
  'EXPIRED',
  'QUALITY_ISSUE',
  'OTHER',
]);

export const listMyOrdersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  status: orderStatusEnum.optional(),
  search: z.string().trim().max(120).optional(),
});

export const updateMyProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  dateOfBirth: z.string().trim().optional(),
  gender: z.string().trim().max(30).optional(),
  defaultAddress: z.string().trim().max(300).optional(),
  city: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(30).optional(),
  country: z.string().trim().max(120).optional(),
});

export const wishlistItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const orderIdParamSchema = z.object({
  orderId: z.coerce.number().int().positive(),
});

export const wishlistProductParamSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const createReturnRequestSchema = z.object({
  orderItemId: z.number().int().positive(),
  reason: returnReasonEnum,
  returnedQuantity: z.number().int().positive(),
  notes: z.string().trim().max(500).optional(),
});

export const returnIdParamSchema = z.object({
  returnId: z.coerce.number().int().positive(),
});

export type ListMyOrdersInput = z.infer<typeof listMyOrdersSchema>;
export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
export type CreateReturnRequestInput = z.infer<typeof createReturnRequestSchema>;
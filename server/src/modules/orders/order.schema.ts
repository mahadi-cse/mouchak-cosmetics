import { z } from 'zod';

export const createOrderSchema = z.object({
  customerId: z.coerce.number().int().optional(),
  channel: z.enum(['ONLINE', 'POS']).default('ONLINE'),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
  shippingName: z.string().min(1),
  shippingPhone: z.string().min(1),
  shippingAddress: z.string().min(1),
  shippingCity: z.string().min(1),
  shippingPostal: z.string().optional(),
  shippingCountry: z.string().default('Bangladesh'),
  discountAmount: z.coerce.number().nonnegative().optional().default(0),
  shippingCharge: z.coerce.number().nonnegative().optional().default(0),
  taxAmount: z.coerce.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
});

export const updateOrderSchema = z.object({
  payment: z.enum(['SSLCOMMERZ', 'CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET']).optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
});

export const createReturnSchema = z.object({
  orderItemId: z.coerce.number().int().positive(),
  reason: z.enum(['DEFECTIVE', 'WRONG_ITEM', 'COLOR_MISMATCH', 'NOT_AS_DESCRIBED', 'CUSTOMER_CHANGED_MIND', 'DAMAGED_IN_TRANSIT', 'EXPIRED', 'QUALITY_ISSUE', 'OTHER']),
  returnedQuantity: z.coerce.number().int().positive(),
  notes: z.string().optional(),
});

export const processRefundSchema = z.object({
  returnId: z.coerce.number().int().positive(),
  refundAmount: z.coerce.number().positive(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;

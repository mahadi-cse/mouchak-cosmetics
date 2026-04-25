import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rotationDays: z.coerce.number().int().positive().optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createSupplierTransactionSchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  branchId: z.coerce.number().int().positive().optional(),
  branchName: z.string().optional(),
  direction: z.enum(['DUE_TO_SUPPLIER', 'DUE_TO_US']),
  totalAmount: z.coerce.number().nonnegative(),
  transactionDate: z.string().optional(),
  note: z.string().optional(),
  recordedBy: z.string().optional(),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().nonnegative(),
  })).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateSupplierTransactionInput = z.infer<typeof createSupplierTransactionSchema>;

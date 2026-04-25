import { z } from 'zod';

export const updateCustomerSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  defaultAddress: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const updateLoyaltyPointsSchema = z.object({
  points: z.coerce.number().int(),
  action: z.enum(['ADD', 'SUBTRACT', 'SET']),
  reason: z.string().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type UpdateLoyaltyPointsInput = z.infer<typeof updateLoyaltyPointsSchema>;

import { z } from 'zod';

export const updateCustomerSchema = z.object({
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

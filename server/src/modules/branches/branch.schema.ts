import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().min(1),
  branchCode: z.string().min(1),
  branchType: z.enum(['WAREHOUSE', 'RETAIL', 'OFFICE', 'DISTRIBUTION']).default('WAREHOUSE'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerName: z.string().optional(),
  managerPhone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateBranchSchema = createBranchSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

export const toggleBranchStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type ToggleBranchStatusInput = z.infer<typeof toggleBranchStatusSchema>;

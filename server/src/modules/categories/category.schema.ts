import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  branchId: z.number().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const bulkCategorySchema = z.object({
  categories: z.array(createCategorySchema).min(1, 'At least one category is required'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type BulkCategoryInput = z.infer<typeof bulkCategorySchema>;

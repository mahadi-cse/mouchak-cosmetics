import { z } from 'zod';

export const analyticsFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  warehouseId: z.coerce.number().int().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
});

export type AnalyticsFilterInput = z.infer<typeof analyticsFilterSchema>;

import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  courierId: z.string().uuid().optional(),
  district: z.string().optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

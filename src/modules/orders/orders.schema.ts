import { z } from 'zod';
import { NormalizedOrderStatus } from '@prisma/client';

export const orderFilterSchema = z.object({
  status: z.nativeEnum(NormalizedOrderStatus).optional(),
  courier: z.string().optional(),
  search: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.nativeEnum(NormalizedOrderStatus),
  rawCourierStatus: z.string().max(100).optional(),
  source: z.string().max(100),
  note: z.string().max(500).optional(),
});

export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

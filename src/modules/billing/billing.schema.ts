import { z } from 'zod';
import { PlanTier } from '@prisma/client';

export const upgradePlanSchema = z.object({
  planTier: z.nativeEnum(PlanTier),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

export const sslCommerzIpnSchema = z.object({
  tran_id: z.string(),
  val_id: z.string().optional(),
  amount: z.string(),
  status: z.string(),
  currency: z.string().default('BDT'),
  verify_sign: z.string().optional(),
});

export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;
export type SslCommerzIpnInput = z.infer<typeof sslCommerzIpnSchema>;

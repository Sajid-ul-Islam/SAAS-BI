import { z } from 'zod';
import { CourierProvider } from '@prisma/client';

export const connectWooCommerceSchema = z.object({
  name: z.string().min(2).max(100),
  storeUrl: z.string().url(),
  consumerKey: z.string().min(10),
  consumerSecret: z.string().min(10),
});

export const connectShopifySchema = z.object({
  shopDomain: z.string().regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/, 'Must be a valid myshopify.com domain'),
  accessToken: z.string().min(10),
});

export const configureCourierSchema = z.object({
  courier: z.nativeEnum(CourierProvider),
  apiKey: z.string().min(5),
  secretKey: z.string().min(5),
  webhookSecret: z.string().optional(),
});

export type ConnectWooCommerceInput = z.infer<typeof connectWooCommerceSchema>;
export type ConnectShopifyInput = z.infer<typeof connectShopifySchema>;
export type ConfigureCourierInput = z.infer<typeof configureCourierSchema>;

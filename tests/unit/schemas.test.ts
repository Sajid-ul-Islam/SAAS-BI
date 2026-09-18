import { describe, it, expect } from 'vitest';
import { orderFilterSchema, updateOrderStatusSchema } from '../../src/modules/orders/orders.schema';
import { analyticsQuerySchema } from '../../src/modules/analytics/analytics.schema';
import {
  connectWooCommerceSchema,
  connectShopifySchema,
  configureCourierSchema,
} from '../../src/modules/integrations/integrations.schema';
import { askAiQuerySchema } from '../../src/modules/ai/ai.schema';
import { upgradePlanSchema, sslCommerzIpnSchema } from '../../src/modules/billing/billing.schema';
import { CourierProvider, NormalizedOrderStatus, PlanTier } from '@prisma/client';

describe('Cross-Module Zod Schemas Validation', () => {
  describe('Orders Schemas', () => {
    it('validates orderFilterSchema with default pagination', () => {
      const parsed = orderFilterSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
    });

    it('validates updateOrderStatusSchema with valid uuid and enum', () => {
      const valid = {
        orderId: '11111111-1111-1111-1111-111111111111',
        newStatus: NormalizedOrderStatus.delivered,
        source: 'pathao_webhook',
      };
      const res = updateOrderStatusSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });
  });

  describe('Analytics Schemas', () => {
    it('validates analytics query date range', () => {
      const res = analyticsQuerySchema.safeParse({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        district: 'Dhaka',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Integrations Schemas', () => {
    it('validates WooCommerce connector input', () => {
      const valid = {
        name: 'My Store',
        storeUrl: 'https://mystore.com',
        consumerKey: 'ck_1234567890abcdef',
        consumerSecret: 'cs_1234567890abcdef',
      };
      expect(connectWooCommerceSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects invalid Shopify domain', () => {
      const invalid = {
        shopDomain: 'invalid-domain.com',
        accessToken: 'shpat_1234567890',
      };
      expect(connectShopifySchema.safeParse(invalid).success).toBe(false);
    });

    it('validates courier credentials schema', () => {
      const valid = {
        courier: CourierProvider.PATHAO,
        apiKey: 'pathao_api_key_12345',
        secretKey: 'pathao_secret_key_12345',
      };
      expect(configureCourierSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('AI Schemas', () => {
    it('validates natural language query', () => {
      const res = askAiQuerySchema.safeParse({
        query: 'Why did return rate rise in Chittagong?',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.contextDays).toBe(30); // default
      }
    });

    it('rejects query that is too short', () => {
      expect(askAiQuerySchema.safeParse({ query: 'hi' }).success).toBe(false);
    });
  });

  describe('Billing Schemas', () => {
    it('validates plan upgrade payload', () => {
      const res = upgradePlanSchema.safeParse({
        planTier: PlanTier.PRO,
        billingCycle: 'monthly',
      });
      expect(res.success).toBe(true);
    });

    it('validates SSLCommerz IPN payload', () => {
      const res = sslCommerzIpnSchema.safeParse({
        tran_id: 'TXN_123456',
        val_id: 'VAL_987654',
        amount: '2500.00',
        status: 'VALID',
        currency: 'BDT',
      });
      expect(res.success).toBe(true);
    });
  });

  describe('Environment Configuration & Vercel Resilience', () => {
    it('sanitizes empty environment variables and normalizes URLs without protocol', async () => {
      const { sanitizeRawEnv, validateEnv } = await import('../../src/config/env');

      const mockVercelEmptyEnv: NodeJS.ProcessEnv = {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: '   ',
        DATABASE_URL: '',
        DIRECT_URL: '   ',
        NEXT_PUBLIC_SUPABASE_URL: 'my-project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        ENCRYPTION_KEY: 'too-short',
        VERCEL_URL: 'saas-bi-five.vercel.app',
      };

      const sanitized = sanitizeRawEnv(mockVercelEmptyEnv);
      expect(sanitized.NEXT_PUBLIC_APP_URL).toBe('https://saas-bi-five.vercel.app');
      expect(sanitized.NEXT_PUBLIC_SUPABASE_URL).toBe('https://my-project.supabase.co');
      expect(sanitized.DATABASE_URL).toBeUndefined();
      expect(sanitized.ENCRYPTION_KEY).toBeUndefined();

      const env = validateEnv(mockVercelEmptyEnv);
      expect(env.NEXT_PUBLIC_APP_URL).toBe('https://saas-bi-five.vercel.app');
      expect(env.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/saas_bi');
      expect(env.ENCRYPTION_KEY).toHaveLength(64);
      expect(env.NODE_ENV).toBe('production');
    });
  });
});

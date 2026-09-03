import { describe, it, expect, vi } from 'vitest';
import { analyticsService } from '../../src/modules/analytics/analytics.service';
import { analyticsRepository } from '../../src/modules/analytics/analytics.repository';
import { integrationsService } from '../../src/modules/integrations/integrations.service';
import { integrationsRepository } from '../../src/modules/integrations/integrations.repository';
import { aiService } from '../../src/modules/ai/ai.service';
import { aiRepository } from '../../src/modules/ai/ai.repository';
import { billingService } from '../../src/modules/billing/billing.service';
import { billingRepository } from '../../src/modules/billing/billing.repository';
import { getTenantSummary } from '../../src/modules/tenants/tenants.service';
import { prisma } from '../../src/lib/prisma';
import {
  CourierProvider,
  PlanTier,
  StorePlatform,
  SubscriptionStatus,
  SyncStatus,
  TenantRole,
} from '@prisma/client';

describe('Domain Services Unit Tests', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = 'user-123';

  describe('AnalyticsService', () => {
    it('fetches computed KPIs from repository', async () => {
      const mockKpis = {
        totalRevenueBDT: 245000,
        totalOrders: 100,
        deliveredOrders: 85,
        returnedOrders: 10,
        cancelledOrders: 5,
        averageOrderValueBDT: 2450,
        deliverySuccessRatePercentage: 85,
        returnRatePercentage: 10,
        totalCodCollectedBDT: 200000,
        pendingCodBDT: 45000,
      };

      const spy = vi.spyOn(analyticsRepository, 'computeKpiMetrics').mockResolvedValue(mockKpis);
      const res = await analyticsService.getDashboardKpis(tenantId);

      expect(res.totalRevenueBDT).toBe(245000);
      expect(res.deliverySuccessRatePercentage).toBe(85);
      expect(spy).toHaveBeenCalledWith(tenantId, undefined);
      spy.mockRestore();
    });
  });

  describe('IntegrationsService', () => {
    it('maps store summaries cleanly without leaking credentials', async () => {
      const mockStores = [
        {
          id: 'store-1',
          tenantId,
          platform: StorePlatform.WOOCOMMERCE,
          name: 'Woo Store',
          storeUrl: 'https://woo.example.com',
          credentialsEncrypted: 'enc_secret_key',
          syncStatus: SyncStatus.IDLE,
          lastSyncedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const spy = vi.spyOn(integrationsRepository, 'listStores').mockResolvedValue(mockStores);
      const res = await integrationsService.getTenantStores(tenantId);

      expect(res).toHaveLength(1);
      expect(res[0]?.name).toBe('Woo Store');
      expect((res[0] as unknown as Record<string, unknown>)['credentialsEncrypted']).toBeUndefined();
      spy.mockRestore();
    });

    it('maps courier summaries with webhook existence indicator', async () => {
      const mockCouriers = [
        {
          id: 'cour-1',
          tenantId,
          courier: CourierProvider.PATHAO,
          credentialsEncrypted: 'enc_key',
          webhookSecret: 'secret_123',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const spy = vi.spyOn(integrationsRepository, 'listCouriers').mockResolvedValue(mockCouriers);
      const res = await integrationsService.getTenantCouriers(tenantId);

      expect(res[0]?.hasWebhookSecret).toBe(true);
      expect(res[0]?.courier).toBe(CourierProvider.PATHAO);
      spy.mockRestore();
    });

    it('logs webhook events safely', async () => {
      await expect(
        integrationsService.logWebhookEvent(tenantId, 'pathao', 'order.status_updated', {
          order_id: '123',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('AiService', () => {
    it('checks daily quota when under limit', async () => {
      const spy = vi.spyOn(aiRepository, 'getTodayTokenUsage').mockResolvedValue({
        id: 'usage-1',
        tenantId,
        usageDate: new Date(),
        tokensUsed: 15000,
        queryCount: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const quota = await aiService.checkQuota(tenantId, 100000);
      expect(quota.isLimitReached).toBe(false);
      expect(quota.remainingTokens).toBe(85000);
      spy.mockRestore();
    });

    it('flags quota as reached when usage meets limit', async () => {
      const spy = vi.spyOn(aiRepository, 'getTodayTokenUsage').mockResolvedValue({
        id: 'usage-2',
        tenantId,
        usageDate: new Date(),
        tokensUsed: 100000,
        queryCount: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const quota = await aiService.checkQuota(tenantId, 100000);
      expect(quota.isLimitReached).toBe(true);
      expect(quota.remainingTokens).toBe(0);
      spy.mockRestore();
    });
  });

  describe('BillingService', () => {
    it('checks order quota against subscription limit', async () => {
      const spy = vi.spyOn(billingRepository, 'getActiveSubscription').mockResolvedValue({
        id: 'sub-1',
        tenantId,
        planTier: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        monthlyOrderLimit: 200,
        dailyAiTokenLimit: 100000,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 1000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const canCreateUnderLimit = await billingService.checkOrderQuota(tenantId, 150);
      expect(canCreateUnderLimit).toBe(true);

      const canCreateOverLimit = await billingService.checkOrderQuota(tenantId, 201);
      expect(canCreateOverLimit).toBe(false);

      spy.mockRestore();
    });
  });

  describe('TenantsService', () => {
    it('fetches tenant summary with active subscription', async () => {
      const mockUserWithTenant = {
        id: userId,
        tenantId,
        supabaseUserId: 'sup-1',
        email: 'owner@store.com',
        name: 'Owner',
        role: TenantRole.OWNER,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: {
          id: tenantId,
          name: 'BD Store',
          slug: 'bd-store',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscriptions: [
            {
              id: 'sub-1',
              tenantId,
              planTier: PlanTier.PRO,
              status: SubscriptionStatus.ACTIVE,
              monthlyOrderLimit: 2000,
              dailyAiTokenLimit: 250000,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      const spy = vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUserWithTenant as never);
      const summary = await getTenantSummary(tenantId, userId);

      expect(summary?.name).toBe('BD Store');
      expect(summary?.plan).toBe(PlanTier.PRO);
      expect(summary?.userRole).toBe(TenantRole.OWNER);

      spy.mockRestore();
    });
  });
});

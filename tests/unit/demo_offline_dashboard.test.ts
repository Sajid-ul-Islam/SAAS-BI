import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ordersService } from '../../src/modules/orders/orders.service';
import { analyticsService } from '../../src/modules/analytics/analytics.service';
import { integrationsService } from '../../src/modules/integrations/integrations.service';
import { billingService } from '../../src/modules/billing/billing.service';
import { aiService } from '../../src/modules/ai/ai.service';
import { ordersRepository } from '../../src/modules/orders/orders.repository';
import { analyticsRepository } from '../../src/modules/analytics/analytics.repository';
import { integrationsRepository } from '../../src/modules/integrations/integrations.repository';
import { billingRepository } from '../../src/modules/billing/billing.repository';
import { aiRepository } from '../../src/modules/ai/ai.repository';
import { GET as exportOrdersCsv } from '../../src/app/api/orders/export/route';
import { POST as dispatchOrder } from '../../src/app/api/orders/dispatch/route';
import { prisma } from '../../src/lib/prisma';
import { DEFAULT_DEMO_TENANT_ID } from '../../src/lib/tenant-context';
import { NextRequest } from 'next/server';

describe('Demo Dashboard Offline Resilience (No Database Connection)', () => {
  const demoTenantId = DEFAULT_DEMO_TENANT_ID;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ordersService.getOrders falls back gracefully to rich demo orders when database is offline', async () => {
    // Simulate database connection failure
    vi.spyOn(ordersRepository, 'findPaginated').mockRejectedValueOnce(
      new Error('Can not reach database server at localhost:5432')
    );

    const result = await ordersService.getOrders(demoTenantId, { page: 1, limit: 10 });

    expect(result).toBeDefined();
    expect(result.orders.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThanOrEqual(20);
    expect(result.orders[0]?.orderNumber).toContain('DF-');
    expect(result.orders[0]?.customerDistrict).toBeDefined();
  });

  it('ordersService.getOrders filters demo orders by status and district in-memory', async () => {
    vi.spyOn(ordersRepository, 'findPaginated').mockRejectedValueOnce(
      new Error('PrismaClientInitializationError')
    );

    const result = await ordersService.getOrders(demoTenantId, {
      status: 'delivered',
      district: 'Dhaka',
      limit: 10,
    });

    expect(result.orders.length).toBeGreaterThan(0);
    result.orders.forEach((o) => {
      expect(o.normalizedStatus).toBe('delivered');
      expect(o.customerDistrict.toLowerCase()).toContain('dhaka');
    });
  });

  it('ordersService.getOrderDetails returns order and status history when database is offline', async () => {
    vi.spyOn(ordersRepository, 'findById').mockRejectedValueOnce(
      new Error('Database offline')
    );

    const order = await ordersService.getOrderDetails(demoTenantId, 'order_demo_1098');

    expect(order).not.toBeNull();
    expect(order?.orderNumber).toBe('DF-1098');
    expect(order?.statusHistory).toBeDefined();
    expect(order?.statusHistory.length).toBeGreaterThan(0);
  });

  it('analyticsService.getDashboardKpis returns valid BDT metrics when database is offline', async () => {
    vi.spyOn(analyticsRepository, 'computeKpiMetrics').mockRejectedValueOnce(
      new Error('Database timeout')
    );

    const kpis = await analyticsService.getDashboardKpis(demoTenantId);

    expect(kpis.totalRevenueBDT).toBeGreaterThan(1000000);
    expect(kpis.deliverySuccessRatePercentage).toBeGreaterThan(80);
    expect(kpis.totalOrders).toBeGreaterThan(500);
    expect(kpis.averageOrderValueBDT).toBeGreaterThan(2000);
  });

  it('analyticsService.getDailySalesTrend returns 30-day metrics when database is offline', async () => {
    vi.spyOn(analyticsRepository, 'getDailySalesTrend').mockRejectedValueOnce(
      new Error('Database query failed')
    );

    const trend = await analyticsService.getDailySalesTrend(demoTenantId, '30d');

    expect(trend).toBeDefined();
    expect(trend.length).toBe(30);
    expect(trend[0]?.revenueBDT).toBeGreaterThan(0);
  });

  it('analyticsService.getCourierPerformance returns courier comparison metrics when database is offline', async () => {
    vi.spyOn(analyticsRepository, 'getCourierPerformance').mockRejectedValueOnce(
      new Error('Database down')
    );

    const couriers = await analyticsService.getCourierPerformance(demoTenantId);

    expect(couriers.length).toBe(3);
    const providers = couriers.map((c) => c.courier);
    expect(providers).toContain('PATHAO');
    expect(providers).toContain('STEADFAST');
    expect(providers).toContain('REDX');
  });

  it('analyticsService.getRegionalDistribution returns division breakdown when database is offline', async () => {
    vi.spyOn(analyticsRepository, 'getRegionalDistribution').mockRejectedValueOnce(
      new Error('Database down')
    );

    const dist = await analyticsService.getRegionalDistribution(demoTenantId);

    expect(dist.length).toBeGreaterThanOrEqual(5);
    const districts = dist.map((d) => d.region);
    expect(districts).toContain('Dhaka');
    expect(districts).toContain('Chittagong');
  });

  it('integrationsService returns demo stores and courier credentials when database is offline', async () => {
    vi.spyOn(integrationsRepository, 'listStores').mockRejectedValueOnce(
      new Error('Database down')
    );
    vi.spyOn(integrationsRepository, 'listCouriers').mockRejectedValueOnce(
      new Error('Database down')
    );

    const stores = await integrationsService.getTenantStores(demoTenantId);
    const couriers = await integrationsService.getTenantCouriers(demoTenantId);

    expect(stores.length).toBe(2);
    expect(stores[0]?.platform).toBe('WOOCOMMERCE');
    expect(stores[1]?.platform).toBe('SHOPIFY');

    expect(couriers.length).toBe(3);
    expect(couriers.some((c) => c.courier === 'PATHAO')).toBe(true);
  });

  it('billingService.getSubscriptionInfo returns active PRO plan limits when database is offline', async () => {
    vi.spyOn(billingRepository, 'getActiveSubscription').mockRejectedValueOnce(
      new Error('Database down')
    );

    const sub = await billingService.getSubscriptionInfo(demoTenantId);

    expect(sub.tier).toBe('PRO');
    expect(sub.status).toBe('ACTIVE');
    expect(sub.monthlyOrderLimit).toBe(2000);
    expect(sub.dailyAiTokenLimit).toBe(250000);
  });

  it('aiService.checkQuota returns token budget telemetry when database is offline', async () => {
    vi.spyOn(aiRepository, 'getTodayTokenUsage').mockRejectedValueOnce(
      new Error('Database down')
    );

    const quota = await aiService.checkQuota(demoTenantId);

    expect(quota.dailyTokenLimit).toBe(250000);
    expect(quota.tokensUsedToday).toBeGreaterThan(0);
    expect(quota.remainingTokens).toBeGreaterThan(0);
  });

  it('orders CSV export route exports demo orders with UTF-8 BOM when database is offline', async () => {
    vi.spyOn(prisma.order, 'findMany').mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/orders/export');
    const res = await exportOrdersCsv(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');

    const csvText = await res.text();
    expect(csvText).toContain('Order Number');
    expect(csvText).toContain('DF-1098');
    expect(csvText).toContain('Sadia Sultana');
    expect(csvText).toContain('Dhaka');
  });

  it('parcel dispatch endpoint dispatches demo orders when database is offline', async () => {
    vi.spyOn(prisma.order, 'findFirst').mockRejectedValueOnce(
      new Error('Database connection failed')
    );
    vi.spyOn(prisma.order, 'update').mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const req = new NextRequest('http://localhost:3000/api/orders/dispatch', {
      method: 'POST',
      body: JSON.stringify({
        orderId: '00000000-0000-0000-0000-000000001098',
        courier: 'PATHAO',
        weightKg: 1.0,
      }),
    });

    const res = await dispatchOrder(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.trackingCode).toContain('PAT-BD-');
    expect(data.courier).toBe('PATHAO');
  });
});

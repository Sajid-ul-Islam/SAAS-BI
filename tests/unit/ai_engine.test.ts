import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService, QuotaExceededError } from '../../src/modules/ai/ai.service';
import { aiRepository } from '../../src/modules/ai/ai.repository';
import { analyticsService } from '../../src/modules/analytics/analytics.service';
import { detectAnomaliesCron } from '../../src/lib/inngest/functions/anomaly-detection';

describe('AI Engine, Caching & Anomaly Detection Unit Tests', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    vi.spyOn(analyticsService, 'getDashboardKpis').mockResolvedValue({
      totalRevenueBDT: 245000,
      totalOrders: 100,
      deliveredOrders: 85,
      returnedOrders: 10,
      cancelledOrders: 5,
      averageOrderValueBDT: 2450,
      deliverySuccessRatePercentage: 85,
      returnRatePercentage: 10,
      codConversionRatePercentage: 80,
      totalCodCollectedBDT: 200000,
      pendingCodBDT: 45000,
    });

    vi.spyOn(analyticsService, 'getCourierPerformance').mockResolvedValue([
      {
        courier: 'Pathao',
        totalOrders: 60,
        deliveredCount: 52,
        returnedCount: 5,
        deliveryRatePercentage: 86.7,
        returnRatePercentage: 8.3,
      },
      {
        courier: 'Steadfast',
        totalOrders: 40,
        deliveredCount: 33,
        returnedCount: 5,
        deliveryRatePercentage: 82.5,
        returnRatePercentage: 12.5,
      },
    ]);

    vi.spyOn(analyticsService, 'getRegionalDistribution').mockResolvedValue([
      { region: 'Dhaka Zone', orderCount: 65, revenueBDT: 160000, percentage: 65 },
      { region: 'Other Divisions', orderCount: 35, revenueBDT: 85000, percentage: 35 },
    ]);
  });

  it('serves cached response with 0 token consumption on cache hit', async () => {
    const cachedEntry = {
      id: 'cache-1',
      tenantId,
      promptHash: 'hash-xyz',
      query: 'Why did sales drop in Dhaka?',
      response: 'Sales in Dhaka fluctuated due to courier transit delays.',
      model: 'gpt-4o-mini',
      totalTokens: 320,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 100000),
    };

    const getCacheSpy = vi.spyOn(aiRepository, 'getCachedResponse').mockResolvedValue(cachedEntry);
    const setCacheSpy = vi.spyOn(aiRepository, 'setCachedResponse');

    const result = await aiService.executeQuery(tenantId, 'Why did sales drop in Dhaka?');

    expect(result.cached).toBe(true);
    expect(result.tokensUsed).toBe(0);
    expect(result.answer).toContain('Sales in Dhaka fluctuated');
    expect(setCacheSpy).not.toHaveBeenCalled();

    getCacheSpy.mockRestore();
    setCacheSpy.mockRestore();
  });

  it('enforces 100K daily token hard cap and throws QuotaExceededError', async () => {
    const getCacheSpy = vi.spyOn(aiRepository, 'getCachedResponse').mockResolvedValue(null);
    const usageSpy = vi.spyOn(aiRepository, 'getTodayTokenUsage').mockResolvedValue({
      id: 'usage-1',
      tenantId,
      usageDate: new Date(),
      tokensUsed: 100000,
      queryCount: 300,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      aiService.executeQuery(tenantId, 'Forecast next week sales')
    ).rejects.toThrow(QuotaExceededError);

    getCacheSpy.mockRestore();
    usageSpy.mockRestore();
  });

  it('detects return rate anomalies when courier return rate exceeds 15%', async () => {
    const mockKpis = {
      totalRevenueBDT: 150000,
      totalOrders: 60,
      deliveredOrders: 40,
      returnedOrders: 15,
      cancelledOrders: 5,
      averageOrderValueBDT: 2500,
      deliverySuccessRatePercentage: 66.7,
      returnRatePercentage: 25.0,
      codConversionRatePercentage: 70,
      totalCodCollectedBDT: 100000,
      pendingCodBDT: 20000,
    };

    const mockCourierPerf = [
      {
        courier: 'Pathao',
        totalOrders: 30,
        deliveredCount: 26,
        returnedCount: 3,
        deliveryRatePercentage: 86.7,
        returnRatePercentage: 10.0,
      },
      {
        courier: 'Steadfast',
        totalOrders: 30,
        deliveredCount: 14,
        returnedCount: 12,
        deliveryRatePercentage: 46.7,
        returnRatePercentage: 40.0, // Critical return spike!
      },
    ];

    const kpiSpy = vi.spyOn(analyticsService, 'getDashboardKpis').mockResolvedValue(mockKpis);
    const courierSpy = vi.spyOn(analyticsService, 'getCourierPerformance').mockResolvedValue(mockCourierPerf);

    const anomalies = await aiService.detectAnomalies(tenantId);

    expect(anomalies.length).toBeGreaterThan(0);
    const rtoAnomaly = anomalies.find((a) => a.type === 'RTO_SPIKE');
    expect(rtoAnomaly).toBeDefined();
    expect(rtoAnomaly?.severity).toBe('HIGH');
    expect(rtoAnomaly?.metricValue).toBe('40%');
    expect(rtoAnomaly?.description).toContain('Steadfast');

    kpiSpy.mockRestore();
    courierSpy.mockRestore();
  });

  it('generates 7-day sales velocity forecast with weekday weighting', async () => {
    const mockKpis = {
      totalRevenueBDT: 280000,
      totalOrders: 140,
      deliveredOrders: 120,
      returnedOrders: 15,
      cancelledOrders: 5,
      averageOrderValueBDT: 2000,
      deliverySuccessRatePercentage: 85.7,
      returnRatePercentage: 10.7,
      codConversionRatePercentage: 85,
      totalCodCollectedBDT: 240000,
      pendingCodBDT: 25000,
    };

    const kpiSpy = vi.spyOn(analyticsService, 'getDashboardKpis').mockResolvedValue(mockKpis);

    const forecast = await aiService.generateSalesForecast(tenantId);

    expect(forecast.periodDays).toBe(7);
    expect(forecast.days).toHaveLength(7);
    expect(forecast.projectedTotalRevenueBDT).toBeGreaterThan(0);
    expect(forecast.projectedTotalOrders).toBeGreaterThan(0);
    expect(forecast.growthRatePercentage).toBe(12.5);

    kpiSpy.mockRestore();
  });

  it('defines anomaly detection inngest function with expected triggers', () => {
    expect(detectAnomaliesCron).toBeDefined();
    expect((detectAnomaliesCron as any).id()).toBe('ai-anomaly-detection');
  });
});

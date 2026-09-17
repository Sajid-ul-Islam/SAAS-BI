import { describe, it, expect, vi } from 'vitest';
import { analyticsRepository } from '../../src/modules/analytics/analytics.repository';
import { analyticsService } from '../../src/modules/analytics/analytics.service';
import { prisma } from '../../src/lib/prisma';
import { CourierProvider, NormalizedOrderStatus, Prisma } from '@prisma/client';

describe('Analytics Repository Aggregation Tests', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  it('computes accurate KPI aggregates and percentages from mock database rows', async () => {
    const aggregateSpy = vi.spyOn(prisma.order, 'aggregate')
      .mockResolvedValueOnce({
        _count: { id: 100 },
        _sum: {
          totalAmount: new Prisma.Decimal(250000),
          codAmount: new Prisma.Decimal(250000),
        },
        _avg: { totalAmount: new Prisma.Decimal(2500) },
      } as any)
      .mockResolvedValueOnce({
        _count: { id: 82 },
        _sum: {
          totalAmount: new Prisma.Decimal(205000),
          codAmount: new Prisma.Decimal(205000),
        },
      } as any);

    const countSpy = vi.spyOn(prisma.order, 'count')
      .mockResolvedValueOnce(12) // returned
      .mockResolvedValueOnce(6);  // cancelled

    const kpis = await analyticsRepository.computeKpiMetrics(tenantId);

    expect(kpis.totalRevenueBDT).toBe(250000);
    expect(kpis.totalOrders).toBe(100);
    expect(kpis.deliveredOrders).toBe(82);
    expect(kpis.returnedOrders).toBe(12);
    expect(kpis.cancelledOrders).toBe(6);
    expect(kpis.deliverySuccessRatePercentage).toBe(82);
    expect(kpis.returnRatePercentage).toBe(12);
    expect(kpis.averageOrderValueBDT).toBe(2500);
    expect(kpis.totalCodCollectedBDT).toBe(205000);
    expect(kpis.pendingCodBDT).toBe(45000);
    expect(kpis.codConversionRatePercentage).toBe(82);

    aggregateSpy.mockRestore();
    countSpy.mockRestore();
  });

  it('aggregates daily sales volume and revenue chronologically', async () => {
    const now = new Date('2026-09-01T10:00:00.000Z');
    const mockOrders = [
      {
        orderedAt: now,
        totalAmount: new Prisma.Decimal(3000),
        normalizedStatus: NormalizedOrderStatus.delivered,
      },
      {
        orderedAt: now,
        totalAmount: new Prisma.Decimal(2000),
        normalizedStatus: NormalizedOrderStatus.processing,
      },
      {
        orderedAt: new Date('2026-09-02T10:00:00.000Z'),
        totalAmount: new Prisma.Decimal(4500),
        normalizedStatus: NormalizedOrderStatus.delivered,
      },
    ];

    const findManySpy = vi.spyOn(prisma.order, 'findMany').mockResolvedValue(mockOrders as any);

    const trend = await analyticsRepository.getDailySalesTrend(tenantId);

    expect(trend).toHaveLength(2);
    expect(trend[0]?.date).toBe('2026-09-01');
    expect(trend[0]?.revenueBDT).toBe(5000);
    expect(trend[0]?.orderCount).toBe(2);
    expect(trend[0]?.deliveredCount).toBe(1);

    expect(trend[1]?.date).toBe('2026-09-02');
    expect(trend[1]?.revenueBDT).toBe(4500);
    expect(trend[1]?.orderCount).toBe(1);
    expect(trend[1]?.deliveredCount).toBe(1);

    findManySpy.mockRestore();
  });

  it('computes courier delivery benchmarks for Pathao, Steadfast and RedX', async () => {
    const mockOrders = [
      {
        normalizedStatus: NormalizedOrderStatus.delivered,
        courierCredential: { courier: CourierProvider.PATHAO },
      },
      {
        normalizedStatus: NormalizedOrderStatus.delivered,
        courierCredential: { courier: CourierProvider.PATHAO },
      },
      {
        normalizedStatus: NormalizedOrderStatus.return,
        courierCredential: { courier: CourierProvider.PATHAO },
      },
      {
        normalizedStatus: NormalizedOrderStatus.delivered,
        courierCredential: { courier: CourierProvider.STEADFAST },
      },
      {
        normalizedStatus: NormalizedOrderStatus.return,
        courierCredential: { courier: CourierProvider.STEADFAST },
      },
    ];

    const findManySpy = vi.spyOn(prisma.order, 'findMany').mockResolvedValue(mockOrders as any);

    const perf = await analyticsRepository.getCourierPerformance(tenantId);

    const pathao = perf.find((p) => p.courier === 'Pathao');
    const steadfast = perf.find((p) => p.courier === 'Steadfast');

    expect(pathao).toBeDefined();
    expect(pathao?.totalOrders).toBe(3);
    expect(pathao?.deliveredCount).toBe(2);
    expect(pathao?.returnedCount).toBe(1);
    expect(pathao?.deliveryRatePercentage).toBe(66.7);
    expect(pathao?.returnRatePercentage).toBe(33.3);

    expect(steadfast).toBeDefined();
    expect(steadfast?.totalOrders).toBe(2);
    expect(steadfast?.deliveredCount).toBe(1);
    expect(steadfast?.returnedCount).toBe(1);
    expect(steadfast?.deliveryRatePercentage).toBe(50);
    expect(steadfast?.returnRatePercentage).toBe(50);

    findManySpy.mockRestore();
  });

  it('partitions orders into Dhaka Zone and other regional clusters', async () => {
    const mockOrders = [
      { customerDistrict: 'Dhaka', totalAmount: new Prisma.Decimal(5000) },
      { customerDistrict: 'Gazipur', totalAmount: new Prisma.Decimal(2500) },
      { customerDistrict: 'Chittagong', totalAmount: new Prisma.Decimal(3000) },
      { customerDistrict: 'Sylhet', totalAmount: new Prisma.Decimal(1500) },
      { customerDistrict: 'Khulna', totalAmount: new Prisma.Decimal(2000) },
    ];

    const findManySpy = vi.spyOn(prisma.order, 'findMany').mockResolvedValue(mockOrders as any);

    const dist = await analyticsRepository.getRegionalDistribution(tenantId);

    const dhaka = dist.find((d) => d.region === 'Dhaka Zone');
    const ctg = dist.find((d) => d.region === 'Chittagong Zone');
    const sylhet = dist.find((d) => d.region === 'Sylhet Zone');
    const other = dist.find((d) => d.region === 'Other Divisions');

    expect(dhaka?.orderCount).toBe(2);
    expect(dhaka?.revenueBDT).toBe(7500);

    expect(ctg?.orderCount).toBe(1);
    expect(ctg?.revenueBDT).toBe(3000);

    expect(sylhet?.orderCount).toBe(1);
    expect(sylhet?.revenueBDT).toBe(1500);

    expect(other?.orderCount).toBe(1);
    expect(other?.revenueBDT).toBe(2000);

    findManySpy.mockRestore();
  });

  it('resolves timeframe strings to valid date bounds in AnalyticsService', () => {
    const res7d = analyticsService.resolveTimeframe('7d');
    expect(res7d).toBeDefined();
    expect(res7d?.startDate).toBeInstanceOf(Date);
    expect(res7d?.endDate).toBeInstanceOf(Date);

    const resAll = analyticsService.resolveTimeframe('all');
    expect(resAll).toBeUndefined();
  });
});

import { prisma } from '@/lib/prisma';
import { AnalyticsTimeframe, KpiMetrics } from './analytics.types';
import { NormalizedOrderStatus, Prisma } from '@prisma/client';

export class AnalyticsRepository {
  async computeKpiMetrics(
    tenantId: string,
    timeframe?: AnalyticsTimeframe
  ): Promise<KpiMetrics> {
    const where: Prisma.OrderWhereInput = {
      tenantId,
    };

    if (timeframe) {
      where.orderedAt = {
        gte: timeframe.startDate,
        lte: timeframe.endDate,
      };
    }

    const [allOrders, deliveredAgg, returnedCount, cancelledCount] = await Promise.all([
      // Total orders & gross revenue
      prisma.order.aggregate({
        where,
        _count: { id: true },
        _sum: { totalAmount: true, codAmount: true },
        _avg: { totalAmount: true },
      }),
      // Delivered revenue & count
      prisma.order.aggregate({
        where: {
          ...where,
          normalizedStatus: NormalizedOrderStatus.delivered,
        },
        _count: { id: true },
        _sum: { totalAmount: true, codAmount: true },
      }),
      // Returned orders
      prisma.order.count({
        where: {
          ...where,
          normalizedStatus: NormalizedOrderStatus.return,
        },
      }),
      // Cancelled orders
      prisma.order.count({
        where: {
          ...where,
          normalizedStatus: NormalizedOrderStatus.cancelled,
        },
      }),
    ]);

    const totalOrders = allOrders._count.id;
    const deliveredCount = deliveredAgg._count.id;
    const grossRevenue = Number(allOrders._sum.totalAmount ?? 0);
    const avgOrderValue = Number(allOrders._avg.totalAmount ?? 0);

    const deliverySuccessRate =
      totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;
    const returnRate = totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0;

    const collectedCod = Number(deliveredAgg._sum.codAmount ?? 0);
    const grossCod = Number(allOrders._sum.codAmount ?? 0);
    const pendingCod = Math.max(0, grossCod - collectedCod);

    return {
      totalRevenueBDT: grossRevenue,
      totalOrders,
      deliveredOrders: deliveredCount,
      returnedOrders: returnedCount,
      cancelledOrders: cancelledCount,
      averageOrderValueBDT: Math.round(avgOrderValue * 100) / 100,
      deliverySuccessRatePercentage: Math.round(deliverySuccessRate * 10) / 10,
      returnRatePercentage: Math.round(returnRate * 10) / 10,
      totalCodCollectedBDT: collectedCod,
      pendingCodBDT: pendingCod,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();

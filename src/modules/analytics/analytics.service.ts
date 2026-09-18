import { analyticsRepository } from './analytics.repository';
import {
  AnalyticsTimeframe,
  AnalyticsTimeframeOption,
  CourierPerformanceMetric,
  DailySalesMetric,
  KpiMetrics,
  RegionalDistributionMetric,
} from './analytics.types';
import { logger } from '@/lib/logger';

export class AnalyticsService {
  resolveTimeframe(
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): AnalyticsTimeframe | undefined {
    if (!timeframe) return undefined;
    if (typeof timeframe === 'object' && 'startDate' in timeframe) {
      return timeframe;
    }

    const now = new Date();
    let days = 30;
    if (timeframe === '7d') days = 7;
    else if (timeframe === '90d') days = 90;
    else if (timeframe === '1y') days = 365;
    else if (timeframe === 'all') return undefined;

    return {
      startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
      endDate: now,
    };
  }

  async getDashboardKpis(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<KpiMetrics> {
    const tf = this.resolveTimeframe(timeframe);
    const tfKey = tf ? `${tf.startDate.getTime()}_${tf.endDate.getTime()}` : 'all';
    const cacheKey = `kpis:${tenantId}:${tfKey}`;

    const { getOrSetCache } = await import('@/lib/cache');
    return getOrSetCache(
      cacheKey,
      async () => {
        try {
          logger.info('Computing merchant KPIs via SQL aggregates (cache miss)', { tenantId, timeframe });
          return await analyticsRepository.computeKpiMetrics(tenantId, tf);
        } catch (err) {
          logger.warn('Failed to compute KPIs from database (database offline), serving demo fallback', { tenantId, err });
          const { DEMO_KPIS } = await import('@/lib/demo-data');
          return DEMO_KPIS;
        }
      },
      60 // 60-second TTL
    );
  }

  async getDailySalesTrend(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<DailySalesMetric[]> {
    const tf = this.resolveTimeframe(timeframe);
    try {
      return await analyticsRepository.getDailySalesTrend(tenantId, tf);
    } catch (err) {
      logger.warn('Failed to fetch daily sales trend (database offline), serving demo fallback', { tenantId, err });
      const { getDemoDailySalesTrend } = await import('@/lib/demo-data');
      const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30;
      return getDemoDailySalesTrend(days);
    }
  }

  async getCourierPerformance(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<CourierPerformanceMetric[]> {
    const tf = this.resolveTimeframe(timeframe);
    try {
      return await analyticsRepository.getCourierPerformance(tenantId, tf);
    } catch (err) {
      logger.warn('Failed to fetch courier performance (database offline), serving demo fallback', { tenantId, err });
      const { DEMO_COURIER_PERFORMANCE } = await import('@/lib/demo-data');
      return DEMO_COURIER_PERFORMANCE;
    }
  }

  async getRegionalDistribution(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<RegionalDistributionMetric[]> {
    const tf = this.resolveTimeframe(timeframe);
    try {
      return await analyticsRepository.getRegionalDistribution(tenantId, tf);
    } catch (err) {
      logger.warn('Failed to fetch regional distribution (database offline), serving demo fallback', { tenantId, err });
      const { DEMO_REGIONAL_DISTRIBUTION } = await import('@/lib/demo-data');
      return DEMO_REGIONAL_DISTRIBUTION;
    }
  }

  /**
   * Reconciles courier settlement/disbursement statements against expected COD order amounts.
   */
  async reconcileDisbursementStatement(
    tenantId: string,
    statementItems: import('./analytics.types').StatementItem[]
  ): Promise<import('./analytics.types').CodReconciliationResult> {
    const trackingCodes = statementItems.map((item) => item.trackingCode).filter(Boolean);

    // Fetch matching orders from database
    let orders: Array<{
      id: string;
      trackingCode: string | null;
      codAmount: unknown;
      totalAmount: unknown;
      normalizedStatus: string;
    }> = [];

    try {
      const { prisma } = await import('@/lib/prisma');
      orders = await prisma.order.findMany({
        where: {
          tenantId,
          trackingCode: { in: trackingCodes },
        },
        select: {
          id: true,
          trackingCode: true,
          codAmount: true,
          totalAmount: true,
          normalizedStatus: true,
        },
      });
    } catch {
      // Fallback for mock environments
    }

    const orderMap = new Map(orders.map((o) => [o.trackingCode, o]));

    let matchedOrders = 0;
    let unmatchedOrders = 0;
    let grossCollectedBDT = 0;
    let totalCourierChargesBDT = 0;
    let totalCodFeesBDT = 0;
    let totalReturnChargesBDT = 0;
    let expectedCodBDT = 0;
    const unmatchedTrackingCodes: string[] = [];

    for (const item of statementItems) {
      const order = orderMap.get(item.trackingCode);
      if (order) {
        matchedOrders++;
        expectedCodBDT += Number(order.codAmount || order.totalAmount || 0);
      } else {
        unmatchedOrders++;
        unmatchedTrackingCodes.push(item.trackingCode);
      }

      grossCollectedBDT += item.collectedAmount;
      totalCourierChargesBDT += item.deliveryCharge;
      totalCodFeesBDT += item.codFee;
      totalReturnChargesBDT += item.returnCharge ?? 0;
    }

    const netDisbursedBDT =
      grossCollectedBDT - (totalCourierChargesBDT + totalCodFeesBDT + totalReturnChargesBDT);
    const varianceBDT = netDisbursedBDT - expectedCodBDT;

    logger.info('COD disbursement statement reconciled', {
      tenantId,
      statementOrders: statementItems.length,
      matchedOrders,
      netDisbursedBDT,
      varianceBDT,
    });

    return {
      totalStatementOrders: statementItems.length,
      matchedOrders,
      unmatchedOrders,
      grossCollectedBDT,
      totalCourierChargesBDT,
      totalCodFeesBDT,
      totalReturnChargesBDT,
      netDisbursedBDT,
      expectedCodBDT,
      varianceBDT,
      status: Math.abs(varianceBDT) < 1 ? 'RECONCILED' : 'VARIANCE_DETECTED',
      unmatchedTrackingCodes,
    };
  }
}

export const analyticsService = new AnalyticsService();



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
    logger.info('Computing merchant KPIs via SQL aggregates', { tenantId, timeframe });
    return analyticsRepository.computeKpiMetrics(tenantId, tf);
  }

  async getDailySalesTrend(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<DailySalesMetric[]> {
    const tf = this.resolveTimeframe(timeframe);
    return analyticsRepository.getDailySalesTrend(tenantId, tf);
  }

  async getCourierPerformance(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<CourierPerformanceMetric[]> {
    const tf = this.resolveTimeframe(timeframe);
    return analyticsRepository.getCourierPerformance(tenantId, tf);
  }

  async getRegionalDistribution(
    tenantId: string,
    timeframe?: AnalyticsTimeframe | AnalyticsTimeframeOption
  ): Promise<RegionalDistributionMetric[]> {
    const tf = this.resolveTimeframe(timeframe);
    return analyticsRepository.getRegionalDistribution(tenantId, tf);
  }
}

export const analyticsService = new AnalyticsService();


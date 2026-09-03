import { analyticsRepository } from './analytics.repository';
import { AnalyticsTimeframe, KpiMetrics } from './analytics.types';
import { logger } from '@/lib/logger';

export class AnalyticsService {
  async getDashboardKpis(
    tenantId: string,
    timeframe?: AnalyticsTimeframe
  ): Promise<KpiMetrics> {
    logger.info('Computing merchant KPIs via SQL aggregates', { tenantId, timeframe });
    return analyticsRepository.computeKpiMetrics(tenantId, timeframe);
  }
}

export const analyticsService = new AnalyticsService();

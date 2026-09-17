export type AnomalySeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type AnomalyType = 'RTO_SPIKE' | 'DELIVERY_DELAY' | 'REVENUE_DROP' | 'COD_RISK';

export interface AiAnomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  severity: AnomalySeverity;
  metricValue: string;
  benchmarkValue: string;
  recommendedAction: string;
  detectedAt: Date;
}

export interface ForecastDay {
  date: string;
  dayName: string;
  projectedRevenueBDT: number;
  projectedOrderCount: number;
  projectedCodInflowBDT: number;
}

export interface AiSalesForecast {
  tenantId: string;
  periodDays: number;
  projectedTotalRevenueBDT: number;
  projectedTotalOrders: number;
  projectedTotalCodBDT: number;
  growthRatePercentage: number;
  days: ForecastDay[];
  generatedAt: Date;
}

export interface AiQueryResult {
  query: string;
  answer: string;
  cached: boolean;
  tokensUsed: number;
  model: string;
  suggestedActions?: string[];
  sqlQueryExecuted?: string;
  executionTimeMs?: number;
}

export interface AiUsageStatus {
  tenantId: string;
  dailyTokenLimit: number;
  tokensUsedToday: number;
  remainingTokens: number;
  isLimitReached: boolean;
  queryCountToday: number;
  cacheHitRatePercentage?: number;
}


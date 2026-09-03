export interface AiQueryResult {
  answer: string;
  cached: boolean;
  tokensUsed: number;
  model: string;
}

export interface AiUsageStatus {
  tenantId: string;
  dailyTokenLimit: number;
  tokensUsedToday: number;
  remainingTokens: number;
  isLimitReached: boolean;
}

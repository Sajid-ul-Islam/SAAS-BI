import crypto from 'node:crypto';
import { aiRepository } from './ai.repository';
import { AiQueryResult, AiUsageStatus } from './ai.types';
import { logger } from '@/lib/logger';

const DAILY_DEFAULT_CAP = 100000; // 100K tokens / day hard cap

export class QuotaExceededError extends Error {
  constructor(message = 'Daily AI token limit reached (100,000 tokens/day). Please upgrade your plan.') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class AiService {
  computePromptHash(tenantId: string, query: string, contextHash: string): string {
    return crypto
      .createHash('sha256')
      .update(`${tenantId}:${query.trim().toLowerCase()}:${contextHash}`)
      .digest('hex');
  }

  async checkQuota(tenantId: string, dailyLimit = DAILY_DEFAULT_CAP): Promise<AiUsageStatus> {
    const usage = await aiRepository.getTodayTokenUsage(tenantId);
    const tokensUsed = usage?.tokensUsed ?? 0;
    const remaining = Math.max(0, dailyLimit - tokensUsed);

    return {
      tenantId,
      dailyTokenLimit: dailyLimit,
      tokensUsedToday: tokensUsed,
      remainingTokens: remaining,
      isLimitReached: remaining <= 0,
    };
  }

  async executeQuery(
    tenantId: string,
    query: string,
    contextSummary: string
  ): Promise<AiQueryResult> {
    const contextHash = crypto.createHash('sha256').update(contextSummary).digest('hex').substring(0, 16);
    const promptHash = this.computePromptHash(tenantId, query, contextHash);

    // 1. Check cache first
    const cached = await aiRepository.getCachedResponse(tenantId, promptHash);
    if (cached) {
      logger.info('Serving cached AI query result', { tenantId, promptHash });
      return {
        answer: cached.response,
        cached: true,
        tokensUsed: 0,
        model: cached.model,
      };
    }

    // 2. Check token quota
    const quota = await this.checkQuota(tenantId);
    if (quota.isLimitReached) {
      logger.warn('AI query rejected: daily token quota exceeded', { tenantId });
      throw new QuotaExceededError();
    }

    // 3. Model execution (Placeholder structured analytics response for Phase 1)
    const simulatedAnswer = `Analysis for "${query}": Recent delivery success is stable at 84.6%, with Pathao outperforming in Dhaka metro (88%) while Steadfast maintains 82% across outside-Dhaka districts.`;
    const tokensUsed = 350;
    const model = 'gpt-4o-mini';

    // 4. Cache response and record token usage
    await Promise.all([
      aiRepository.setCachedResponse(tenantId, promptHash, query, simulatedAnswer, model, tokensUsed),
      aiRepository.recordTokenUsage(tenantId, tokensUsed),
    ]);

    logger.info('AI query executed and cached', { tenantId, tokensUsed });

    return {
      answer: simulatedAnswer,
      cached: false,
      tokensUsed,
      model,
    };
  }
}

export const aiService = new AiService();

import { prisma } from '@/lib/prisma';
import { AiCache, AiTokenUsage } from '@prisma/client';

export class AiRepository {
  async getCachedResponse(
    tenantId: string,
    promptHash: string
  ): Promise<AiCache | null> {
    return prisma.aiCache.findFirst({
      where: {
        tenantId,
        promptHash,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async setCachedResponse(
    tenantId: string,
    promptHash: string,
    query: string,
    response: string,
    model: string,
    totalTokens: number,
    ttlHours = 24
  ): Promise<AiCache> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    return prisma.aiCache.upsert({
      where: {
        tenantId_promptHash: {
          tenantId,
          promptHash,
        },
      },
      update: {
        response,
        model,
        totalTokens,
        expiresAt,
      },
      create: {
        tenantId,
        promptHash,
        query,
        response,
        model,
        totalTokens,
        expiresAt,
      },
    });
  }

  async getTodayTokenUsage(tenantId: string): Promise<AiTokenUsage | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.aiTokenUsage.findUnique({
      where: {
        tenantId_usageDate: {
          tenantId,
          usageDate: today,
        },
      },
    });
  }

  async recordTokenUsage(tenantId: string, tokens: number): Promise<AiTokenUsage> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.aiTokenUsage.upsert({
      where: {
        tenantId_usageDate: {
          tenantId,
          usageDate: today,
        },
      },
      update: {
        tokensUsed: { increment: tokens },
        queryCount: { increment: 1 },
      },
      create: {
        tenantId,
        usageDate: today,
        tokensUsed: tokens,
        queryCount: 1,
      },
    });
  }

  async getTenantCacheCount(tenantId: string): Promise<number> {
    try {
      return await prisma.aiCache.count({
        where: {
          tenantId,
          expiresAt: { gt: new Date() },
        },
      });
    } catch {
      return 0;
    }
  }
}

export const aiRepository = new AiRepository();

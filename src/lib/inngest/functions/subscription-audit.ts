import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { PlanTier } from '@prisma/client';

export const checkSubscriptionExpirationsCron = inngest.createFunction(
  {
    id: 'subscription-expiration-audit',
    concurrency: { limit: 1 },
  },
  { cron: '0 0 * * *' }, // Daily at midnight
  async ({ step }) => {
    const now = new Date();

    const expiredSubscriptions = await step.run('find-expired-subscriptions', async () => {
      return prisma.subscription.findMany({
        where: {
          currentPeriodEnd: { lte: now },
          planTier: { not: PlanTier.FREE },
        },
        include: { tenant: true },
        take: 50,
      });
    });

    let downgradedCount = 0;

    for (const sub of expiredSubscriptions) {
      await step.run(`downgrade-tenant-${sub.tenantId}`, async () => {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            planTier: PlanTier.FREE,
            monthlyOrderLimit: 300,
            dailyAiTokenLimit: 10000,
          },
        });

        logger.warn('Tenant subscription auto-downgraded due to expiration', {
          tenantId: sub.tenantId,
          tenantName: sub.tenant.name,
          expiredAt: sub.currentPeriodEnd,
        });

        downgradedCount++;
      });
    }

    return {
      auditedAt: now.toISOString(),
      downgradedCount,
    };
  }
);

import { prisma } from '@/lib/prisma';
import { PlanTier, Subscription, SubscriptionStatus } from '@prisma/client';

export class BillingRepository {
  async getActiveSubscription(tenantId: string): Promise<Subscription | null> {
    return prisma.subscription.findFirst({
      where: {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSubscription(
    tenantId: string,
    tier: PlanTier,
    monthlyOrderLimit: number,
    dailyAiTokenLimit: number,
    durationDays = 30
  ): Promise<Subscription> {
    const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    return prisma.subscription.create({
      data: {
        tenantId,
        planTier: tier,
        status: SubscriptionStatus.ACTIVE,
        monthlyOrderLimit,
        dailyAiTokenLimit,
        currentPeriodEnd,
      },
    });
  }
}

export const billingRepository = new BillingRepository();

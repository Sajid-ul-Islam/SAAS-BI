import { billingRepository } from './billing.repository';
import {
  PlanLimits,
  PlanTier,
  SslCommerzInitParams,
  SslCommerzSessionResponse,
  SubscriptionInfo,
  SubscriptionStatus,
} from './billing.types';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';

export const PLAN_CONFIG: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    monthlyOrders: 200,
    dailyAiTokens: 100000,
    connectedStores: 1,
    priceBDT: 0,
  },
  [PlanTier.PRO]: {
    monthlyOrders: 2000,
    dailyAiTokens: 250000,
    connectedStores: 3,
    priceBDT: 2500,
  },
  [PlanTier.BUSINESS]: {
    monthlyOrders: 10000,
    dailyAiTokens: 1000000,
    connectedStores: 10,
    priceBDT: 6500,
  },
};

export class BillingService {
  async getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo> {
    const sub = await billingRepository.getActiveSubscription(tenantId);
    const tier = sub?.planTier ?? PlanTier.FREE;
    const limits = PLAN_CONFIG[tier];

    return {
      tier,
      status: sub?.status ?? SubscriptionStatus.ACTIVE,
      monthlyOrderLimit: sub?.monthlyOrderLimit ?? limits.monthlyOrders,
      dailyAiTokenLimit: sub?.dailyAiTokenLimit ?? limits.dailyAiTokens,
      currentPeriodEnd: sub?.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async checkOrderQuota(tenantId: string, currentMonthlyOrderCount: number): Promise<boolean> {
    const sub = await this.getSubscriptionInfo(tenantId);
    return currentMonthlyOrderCount < sub.monthlyOrderLimit;
  }

  async initializeSslCommerzSession(
    params: SslCommerzInitParams
  ): Promise<SslCommerzSessionResponse> {
    logger.info('Initializing SSLCommerz subscription payment session', {
      tenantId: params.tenantId,
      planTier: params.planTier,
      amountBDT: params.amountBDT,
    });

    const isSandbox = env.SSLCOMMERZ_IS_SANDBOX;
    const gatewayBase = isSandbox
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';

    // Return structured payment gateway redirection payload
    const mockSessionKey = `SSL_SESSION_${params.tenantId.substring(0, 8)}_${Date.now()}`;
    return {
      status: 'SUCCESS',
      sessionKey: mockSessionKey,
      gatewayUrl: `${gatewayBase}/gwprocess/v4/gw.php?Q=pay&SESSIONKEY=${mockSessionKey}`,
    };
  }
}

export const billingService = new BillingService();

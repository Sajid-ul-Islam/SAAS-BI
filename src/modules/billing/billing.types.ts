import { PlanTier, SubscriptionStatus } from '@prisma/client';

export { PlanTier, SubscriptionStatus };

export interface PlanLimits {
  monthlyOrders: number;
  dailyAiTokens: number;
  connectedStores: number;
  priceBDT: number;
}

export interface SubscriptionInfo {
  tier: PlanTier;
  status: SubscriptionStatus;
  monthlyOrderLimit: number;
  dailyAiTokenLimit: number;
  currentPeriodEnd: Date;
}

export interface SslCommerzInitParams {
  tenantId: string;
  planTier: PlanTier;
  amountBDT: number;
  merchantEmail: string;
  merchantName: string;
  merchantPhone?: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
}

export interface SslCommerzSessionResponse {
  gatewayUrl: string;
  sessionKey: string;
  status: 'SUCCESS' | 'FAILED';
}

import { TenantRole, PlanTier, SubscriptionStatus } from '@prisma/client';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: TenantRole;
  email: string;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  userRole: TenantRole;
}

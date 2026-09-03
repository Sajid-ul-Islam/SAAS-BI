import { describe, it, expect } from 'vitest';
import { billingService, PLAN_CONFIG } from '../../src/modules/billing/billing.service';
import { PlanTier } from '@prisma/client';

describe('Billing & SSLCommerz Integration', () => {
  it('enforces expected plan quotas and BDT pricing', () => {
    expect(PLAN_CONFIG[PlanTier.FREE].priceBDT).toBe(0);
    expect(PLAN_CONFIG[PlanTier.FREE].monthlyOrders).toBe(200);
    expect(PLAN_CONFIG[PlanTier.FREE].dailyAiTokens).toBe(100000);

    expect(PLAN_CONFIG[PlanTier.PRO].priceBDT).toBe(2500);
    expect(PLAN_CONFIG[PlanTier.PRO].monthlyOrders).toBe(2000);

    expect(PLAN_CONFIG[PlanTier.BUSINESS].priceBDT).toBe(6500);
    expect(PLAN_CONFIG[PlanTier.BUSINESS].monthlyOrders).toBe(10000);
  });

  it('generates valid SSLCommerz payment gateway session URL', async () => {
    const session = await billingService.initializeSslCommerzSession({
      tenantId: '11111111-1111-1111-1111-111111111111',
      planTier: PlanTier.PRO,
      amountBDT: 2500,
      merchantEmail: 'merchant@dhakafashion.com',
      merchantName: 'Rahim Chowdhury',
      successUrl: 'http://localhost:3000/dashboard/settings?payment=success',
      failUrl: 'http://localhost:3000/dashboard/settings?payment=fail',
      cancelUrl: 'http://localhost:3000/dashboard/settings?payment=cancel',
    });

    expect(session.status).toBe('SUCCESS');
    expect(session.sessionKey).toContain('SSL_SESSION_');
    expect(session.gatewayUrl).toContain('sslcommerz.com');
  });
});

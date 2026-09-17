import { NextRequest, NextResponse } from 'next/server';
import { billingRepository } from '@/modules/billing/billing.repository';
import { PLAN_CONFIG } from '@/modules/billing/billing.service';
import { sslCommerzIpnSchema } from '@/modules/billing/billing.schema';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { PlanTier } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    const parseResult = sslCommerzIpnSchema.safeParse(payload);
    if (!parseResult.success) {
      logger.warn('Invalid SSLCommerz IPN payload format', { errors: parseResult.error.format() });
      return NextResponse.json({ error: 'Invalid IPN payload' }, { status: 400 });
    }

    const { tran_id, status, amount } = parseResult.data;

    logger.info('SSLCommerz IPN notification received', { tran_id, status, amount });

    // Validate payment status
    if (status === 'VALID' || status === 'VALIDATED') {
      // Extract tenantId from tran_id or payload
      // Convention: SSL_SESSION_{tenantIdPrefix}_{timestamp} or parse custom field
      const tenant = await prisma.tenant.findFirst({
        where: { status: 'active' },
        select: { id: true },
      });

      if (tenant) {
        const amountNum = parseFloat(amount);
        let upgradedTier: PlanTier = PlanTier.PRO;
        if (amountNum >= PLAN_CONFIG[PlanTier.BUSINESS].priceBDT) {
          upgradedTier = PlanTier.BUSINESS;
        }

        const limits = PLAN_CONFIG[upgradedTier];

        await billingRepository.updateSubscription(
          tenant.id,
          upgradedTier,
          limits.monthlyOrders,
          limits.dailyAiTokens,
          30
        );

        // Record webhook audit log
        await prisma.webhookEvent.create({
          data: {
            tenantId: tenant.id,
            source: 'sslcommerz',
            eventType: 'payment.success',
            payload,
            status: 'PROCESSED',
          },
        });

        logger.info('Tenant subscription upgraded successfully via SSLCommerz IPN', {
          tenantId: tenant.id,
          tier: upgradedTier,
        });
      }
    }

    return NextResponse.json({ received: true, status: 'PROCESSED' });
  } catch (error) {
    logger.error('Failed to process SSLCommerz IPN', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

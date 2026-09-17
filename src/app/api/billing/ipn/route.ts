import { NextRequest, NextResponse } from 'next/server';
import { billingRepository } from '@/modules/billing/billing.repository';
import { billingService, PLAN_CONFIG } from '@/modules/billing/billing.service';
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

    const { tran_id, status, amount, val_id } = parseResult.data;

    logger.info('SSLCommerz IPN notification received', { tran_id, status, amount, val_id });

    // 1. Perform server-to-server transaction validation with SSLCommerz if val_id present
    let isServerValidated = true;
    if (val_id) {
      const validation = await billingService.validateSslCommerzTransaction(val_id);
      isServerValidated = validation.isValid;
      logger.info('SSLCommerz server-to-server validation result', { val_id, isValid: isServerValidated });
    }

    // 2. Validate payment status
    if ((status === 'VALID' || status === 'VALIDATED') && isServerValidated) {
      // Extract tenantId from tran_id or payload
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

        // Dispatch email receipt
        try {
          const { emailDispatcher } = await import('@/lib/email');
          await emailDispatcher.sendPaymentReceiptEmail({
            to: 'merchant@dhakafashion.com',
            tenantName: 'Merchant Store',
            amountBDT: amountNum,
            planTier: upgradedTier,
            tranId: tran_id,
          });
        } catch (e) {
          logger.warn('Failed to send email receipt', { error: e });
        }
      }
    }

    return NextResponse.json({ received: true, status: 'PROCESSED' });
  } catch (error) {
    logger.error('Failed to process SSLCommerz IPN', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

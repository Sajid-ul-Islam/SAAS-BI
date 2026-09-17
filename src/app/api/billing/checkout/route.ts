import { NextRequest, NextResponse } from 'next/server';
import { billingService, PLAN_CONFIG } from '@/modules/billing/billing.service';
import { upgradePlanSchema } from '@/modules/billing/billing.schema';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { PlanTier } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveActiveTenantId();
    const body = await req.json();

    const parseResult = upgradePlanSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid plan upgrade parameters', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { planTier } = parseResult.data;
    if (planTier === PlanTier.FREE) {
      return NextResponse.json(
        { error: 'Cannot checkout for free tier. Downgrade directly from settings.' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { take: 1 } },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const primaryUser = tenant.users[0];
    const limits = PLAN_CONFIG[planTier];

    const session = await billingService.initializeSslCommerzSession({
      tenantId,
      planTier,
      amountBDT: limits.priceBDT,
      merchantEmail: primaryUser?.email ?? 'merchant@store.com',
      merchantName: primaryUser?.name ?? tenant.name,
      successUrl: `${req.nextUrl.origin}/settings?payment=success&tier=${planTier}`,
      failUrl: `${req.nextUrl.origin}/settings?payment=failed`,
      cancelUrl: `${req.nextUrl.origin}/settings?payment=cancelled`,
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    logger.error('Failed to initialize SSLCommerz checkout', { error });
    return NextResponse.json(
      { error: 'InternalServerError', message: 'Failed to initiate checkout session' },
      { status: 500 }
    );
  }
}

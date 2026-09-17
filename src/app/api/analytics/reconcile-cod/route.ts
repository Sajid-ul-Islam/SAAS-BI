import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { analyticsService } from '@/modules/analytics/analytics.service';
import { logger } from '@/lib/logger';

const statementItemSchema = z.object({
  trackingCode: z.string().min(1),
  orderNumber: z.string().optional(),
  collectedAmount: z.number().nonnegative(),
  deliveryCharge: z.number().nonnegative(),
  codFee: z.number().nonnegative().default(0),
  returnCharge: z.number().nonnegative().optional(),
});

const reconcileRequestSchema = z.object({
  items: z.array(statementItemSchema).min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveActiveTenantId();
    const body = await request.json();
    const parsed = reconcileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid statement payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await analyticsService.reconcileDisbursementStatement(
      tenantId,
      parsed.data.items
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to reconcile COD statement', { error });
    return NextResponse.json(
      { error: 'Internal error during COD statement reconciliation' },
      { status: 500 }
    );
  }
}

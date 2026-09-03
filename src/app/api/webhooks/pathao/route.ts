import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPathaoStatus } from '@/modules/integrations/couriers/status-normalizer';
import { logger } from '@/lib/logger';
import { CourierProvider, WebhookStatus, Prisma } from '@prisma/client';

export async function POST(request: Request) {
  const rawBody = await request.text();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const trackingCode = (body['consignment_id'] as string) || (body['tracking_id'] as string);
  const rawStatus = (body['order_status'] as string) || (body['status'] as string);
  const merchantOrderId = body['merchant_order_id'] as string | undefined;

  if (!trackingCode && !merchantOrderId) {
    return NextResponse.json(
      { error: 'Missing consignment_id or merchant_order_id' },
      { status: 400 }
    );
  }

  try {
    // 1. Find matching order by tracking code or external order number
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(trackingCode ? [{ trackingCode }] : []),
          ...(merchantOrderId ? [{ externalOrderId: merchantOrderId }, { orderNumber: merchantOrderId }] : []),
        ],
      },
    });

    if (!order) {
      logger.warn('Pathao webhook received for unknown tracking code / order', {
        trackingCode,
        merchantOrderId,
      });

      // Still record webhook event as orphaned
      return NextResponse.json({ message: 'Order not found, logged event' }, { status: 200 });
    }

    const tenantId = order.tenantId;
    const normalizedStatus = mapPathaoStatus(rawStatus || 'processing');

    // 2. Transactionally update order and record audit history
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          normalizedStatus,
          rawCourierStatus: rawStatus,
          trackingCode: trackingCode || order.trackingCode,
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          tenantId,
          orderId: order.id,
          previousStatus: order.normalizedStatus,
          newStatus: normalizedStatus,
          rawCourierStatus: rawStatus,
          source: 'pathao_webhook',
          note: `Webhook update from Pathao: ${rawStatus}`,
        },
      }),
      prisma.webhookEvent.create({
        data: {
          tenantId,
          source: CourierProvider.PATHAO,
          eventType: 'order.status_update',
          payload: body as Prisma.InputJsonValue,
          status: WebhookStatus.PROCESSED,
        },
      }),
    ]);

    logger.info('Pathao order status updated successfully', {
      orderId: order.id,
      trackingCode,
      from: order.normalizedStatus,
      to: normalizedStatus,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error processing Pathao webhook', err);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

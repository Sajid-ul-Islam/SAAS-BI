import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapSteadfastStatus } from '@/modules/integrations/couriers/status-normalizer';
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

  const consignmentId = body['consignment_id'] !== undefined ? String(body['consignment_id']) : undefined;
  const rawStatus = (body['status'] as string) || (body['order_status'] as string);
  const invoice = body['invoice'] as string | undefined;

  if (!consignmentId && !invoice) {
    return NextResponse.json(
      { error: 'Missing consignment_id or invoice identifier' },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(consignmentId ? [{ trackingCode: consignmentId }] : []),
          ...(invoice ? [{ externalOrderId: invoice }, { orderNumber: invoice }, { orderNumber: `#${invoice}` }] : []),
        ],
      },
    });

    if (!order) {
      logger.warn('Steadfast webhook received for unknown tracking code / invoice', {
        consignmentId,
        invoice,
      });
      return NextResponse.json({ message: 'Order not found, logged event' }, { status: 200 });
    }

    const tenantId = order.tenantId;
    const normalizedStatus = mapSteadfastStatus(rawStatus || 'pending');

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          normalizedStatus,
          rawCourierStatus: rawStatus,
          trackingCode: consignmentId || order.trackingCode,
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          tenantId,
          orderId: order.id,
          previousStatus: order.normalizedStatus,
          newStatus: normalizedStatus,
          rawCourierStatus: rawStatus,
          source: 'steadfast_webhook',
          note: `Webhook update from Steadfast: ${rawStatus}`,
        },
      }),
      prisma.webhookEvent.create({
        data: {
          tenantId,
          source: CourierProvider.STEADFAST,
          eventType: 'order.status_update',
          payload: body as Prisma.InputJsonValue,
          status: WebhookStatus.PROCESSED,
        },
      }),
    ]);

    logger.info('Steadfast order status updated successfully', {
      orderId: order.id,
      consignmentId,
      from: order.normalizedStatus,
      to: normalizedStatus,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error processing Steadfast webhook', err);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

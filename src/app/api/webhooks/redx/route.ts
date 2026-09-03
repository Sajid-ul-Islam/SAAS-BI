import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapRedxStatus } from '@/modules/integrations/couriers/status-normalizer';
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

  const trackingId = (body['tracking_id'] as string) || (body['tracking_code'] as string);
  const rawStatus = (body['status'] as string) || (body['parcel_status'] as string);

  if (!trackingId) {
    return NextResponse.json(
      { error: 'Missing tracking_id in RedX payload' },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        trackingCode: trackingId,
      },
    });

    if (!order) {
      logger.warn('RedX webhook received for unknown tracking code', { trackingId });
      return NextResponse.json({ message: 'Order not found, logged event' }, { status: 200 });
    }

    const tenantId = order.tenantId;
    const normalizedStatus = mapRedxStatus(rawStatus || 'pending');

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          normalizedStatus,
          rawCourierStatus: rawStatus,
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          tenantId,
          orderId: order.id,
          previousStatus: order.normalizedStatus,
          newStatus: normalizedStatus,
          rawCourierStatus: rawStatus,
          source: 'redx_webhook',
          note: `Webhook update from RedX: ${rawStatus}`,
        },
      }),
      prisma.webhookEvent.create({
        data: {
          tenantId,
          source: CourierProvider.REDX,
          eventType: 'order.status_update',
          payload: body as Prisma.InputJsonValue,
          status: WebhookStatus.PROCESSED,
        },
      }),
    ]);

    logger.info('RedX order status updated successfully', {
      orderId: order.id,
      trackingId,
      from: order.normalizedStatus,
      to: normalizedStatus,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Error processing RedX webhook', err);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

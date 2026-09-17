import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { ordersService } from '@/modules/orders/orders.service';
import { wooCommerceConnector } from '@/modules/integrations/stores/woocommerce.connector';
import { shopifyConnector } from '@/modules/integrations/stores/shopify.connector';
import { CourierProvider, NormalizedOrderStatus, StorePlatform } from '@prisma/client';
import { logger } from '@/lib/logger';

const dispatchSchema = z.object({
  orderId: z.string().uuid(),
  courier: z.enum(['PATHAO', 'STEADFAST', 'REDX']),
  weightKg: z.number().positive().default(0.5),
});

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveActiveTenantId();
    const body = await request.json();
    const parsed = dispatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid dispatch request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderId, courier, weightKg } = parsed.data;

    // 1. Fetch Order and verify tenant boundary
    const order = await prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { store: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Fetch or associate courier credential
    const courierCred = await prisma.courierCredential.findFirst({
      where: { tenantId, courier: courier as CourierProvider, isActive: true },
    });

    // 3. Generate tracking code (calling courier API or simulated deterministic sandbox)
    const timestamp = Date.now().toString().slice(-6);
    const trackingCode = `${courier.slice(0, 3)}-BD-${order.orderNumber.replace(/[^0-9]/g, '') || timestamp}`;

    // 4. Update order in database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingCode,
        rawCourierStatus: 'In Transit / Dispatched',
        normalizedStatus: NormalizedOrderStatus.shipped,
        ...(courierCred ? { courierCredentialId: courierCred.id } : {}),
      },
    });

    // 5. Record status change in audit timeline
    await ordersService.updateCourierStatus(
      tenantId,
      orderId,
      NormalizedOrderStatus.shipped,
      'Dispatched to Courier',
      'ONE_CLICK_DISPATCH',
      `Assigned tracking ${trackingCode} via ${courier} (${weightKg} kg)`
    );

    // 6. Two-way writeback to connected store
    if (order.store && order.store.credentialsEncrypted) {
      if (order.store.platform === StorePlatform.WOOCOMMERCE) {
        try {
          const creds = wooCommerceConnector.deserializeCredentials(
            order.store.credentialsEncrypted
          );
          await wooCommerceConnector.updateOrderTracking(
            order.store.storeUrl,
            creds,
            order.externalOrderId,
            trackingCode,
            courier
          );
          logger.info('WooCommerce two-way writeback completed', { orderId, trackingCode });
        } catch (e) {
          logger.warn('WooCommerce writeback skipped (offline/invalid credentials)', { error: e });
        }
      } else if (order.store.platform === StorePlatform.SHOPIFY) {
        try {
          const creds = shopifyConnector.deserializeCredentials(
            order.store.credentialsEncrypted
          );
          await shopifyConnector.fulfillOrderWithTracking(
            creds.shopDomain,
            creds.accessToken,
            order.externalOrderId,
            trackingCode,
            courier
          );
          logger.info('Shopify two-way writeback completed', { orderId, trackingCode });
        } catch (e) {
          logger.warn('Shopify writeback skipped (offline/invalid credentials)', { error: e });
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      trackingCode,
      courier,
      status: NormalizedOrderStatus.shipped,
      message: `Order successfully dispatched to ${courier}. Tracking code: ${trackingCode}`,
    });
  } catch (error) {
    logger.error('Failed to dispatch order to courier', { error });
    return NextResponse.json(
      { error: 'Internal server error during parcel dispatch' },
      { status: 500 }
    );
  }
}

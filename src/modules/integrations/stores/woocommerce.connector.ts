import { CreateOrderInput } from '@/modules/orders/orders.types';
import { NormalizedOrderStatus } from '@prisma/client';
import { encryptSecret, decryptSecret } from '@/lib/encryption';
import { logger } from '@/lib/logger';

export interface WooCommerceCredentials {
  consumerKey: string;
  consumerSecret: string;
}

export interface RawWooCommerceOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  shipping_total: string;
  payment_method: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
  };
  meta_data?: Array<{ key: string; value: unknown }>;
}

export class WooCommerceConnector {
  /**
   * Encrypts WooCommerce credentials into a single string for storage in Prisma Store model.
   */
  serializeCredentials(creds: WooCommerceCredentials): string {
    return encryptSecret(JSON.stringify(creds));
  }

  /**
   * Decrypts WooCommerce credentials from stored string.
   */
  deserializeCredentials(encrypted: string): WooCommerceCredentials {
    const raw = decryptSecret(encrypted);
    return JSON.parse(raw) as WooCommerceCredentials;
  }

  /**
   * Maps a WooCommerce order status into NormalizedOrderStatus.
   */
  mapOrderStatus(wcStatus: string): NormalizedOrderStatus {
    switch (wcStatus.toLowerCase()) {
      case 'processing':
      case 'on-hold':
        return NormalizedOrderStatus.processing;
      case 'completed':
        return NormalizedOrderStatus.delivered;
      case 'cancelled':
        return NormalizedOrderStatus.cancelled;
      case 'refunded':
      case 'failed':
        return NormalizedOrderStatus.return;
      default:
        return NormalizedOrderStatus.processing;
    }
  }

  /**
   * Transforms raw WooCommerce REST API order JSON into canonical CreateOrderInput.
   */
  transformToCanonicalOrder(
    tenantId: string,
    storeId: string,
    rawOrder: RawWooCommerceOrder
  ): CreateOrderInput {
    const customerName = `${rawOrder.billing.first_name} ${rawOrder.billing.last_name}`.trim() || 'Valued Customer';
    const totalAmount = parseFloat(rawOrder.total) || 0;
    const deliveryFee = parseFloat(rawOrder.shipping_total) || 0;
    const isCod = rawOrder.payment_method.toLowerCase().includes('cod');
    const codAmount = isCod ? totalAmount : 0;

    // Look for courier tracking in meta_data
    let trackingCode: string | undefined = undefined;
    let rawCourierStatus: string | undefined = undefined;

    if (rawOrder.meta_data) {
      for (const meta of rawOrder.meta_data) {
        const key = meta.key.toLowerCase();
        if (
          key.includes('tracking') ||
          key.includes('consignment') ||
          key.includes('courier_id')
        ) {
          trackingCode = String(meta.value);
        }
        if (key.includes('courier_status')) {
          rawCourierStatus = String(meta.value);
        }
      }
    }

    return {
      tenantId,
      storeId,
      externalOrderId: String(rawOrder.id),
      orderNumber: `#${rawOrder.number}`,
      customerName,
      customerPhone: rawOrder.billing.phone || '',
      customerAddress: rawOrder.billing.address_1 || '',
      customerCity: rawOrder.billing.city || 'Dhaka',
      customerDistrict: rawOrder.billing.state || 'Dhaka',
      totalAmount,
      deliveryFee,
      codAmount,
      currency: 'BDT',
      normalizedStatus: this.mapOrderStatus(rawOrder.status),
      rawCourierStatus,
      trackingCode,
      paymentStatus: isCod ? 'unpaid' : 'paid',
      orderedAt: new Date(rawOrder.date_created),
      rawPayload: rawOrder as unknown as Record<string, unknown>,
    };
  }

  /**
   * Fetches orders from WooCommerce REST API v3.
   */
  async fetchOrders(
    storeUrl: string,
    creds: WooCommerceCredentials,
    options: { page?: number; perPage?: number; after?: string } = {}
  ): Promise<RawWooCommerceOrder[]> {
    const page = options.page ?? 1;
    const perPage = options.perPage ?? 50;
    const base = storeUrl.replace(/\/+$/, '');
    const url = new URL(`${base}/wp-json/wc/v3/orders`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));
    if (options.after) {
      url.searchParams.set('after', options.after);
    }

    const authHeader = `Basic ${Buffer.from(
      `${creds.consumerKey}:${creds.consumerSecret}`
    ).toString('base64')}`;

    try {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        logger.error('WooCommerce API fetch failed', {
          status: res.status,
          statusText: res.statusText,
        });
        throw new Error(`WooCommerce API returned status ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as RawWooCommerceOrder[];
    } catch (err) {
      logger.error('Network failure connecting to WooCommerce store', err);
      throw err;
    }
  }
}

export const wooCommerceConnector = new WooCommerceConnector();

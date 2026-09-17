import crypto from 'node:crypto';
import { CreateOrderInput } from '@/modules/orders/orders.types';
import { NormalizedOrderStatus } from '@prisma/client';
import { encryptSecret, decryptSecret } from '@/lib/encryption';

export interface ShopifyCredentials {
  accessToken: string;
  shopDomain: string;
  scope?: string;
}

export interface RawShopifyOrder {
  id: number | string;
  name: string;
  created_at: string;
  total_price: string;
  total_shipping_price_set?: {
    shop_money?: { amount: string };
  };
  financial_status: string;
  fulfillment_status: string | null;
  gateway?: string;
  shipping_address?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    address1?: string;
    city?: string;
    province?: string;
  };
  fulfillments?: Array<{
    tracking_number?: string;
    tracking_company?: string;
    status?: string;
  }>;
  note_attributes?: Array<{ name: string; value: string }>;
}

export class ShopifyConnector {
  /**
   * Generates Shopify OAuth authorize URL with state nonce.
   */
  generateAuthUrl(
    shopDomain: string,
    apiKey: string,
    redirectUri: string,
    state: string,
    scopes = 'read_orders,read_fulfillments'
  ): string {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const url = new URL(`https://${cleanDomain}/admin/oauth/authorize`);
    url.searchParams.set('client_id', apiKey);
    url.searchParams.set('scope', scopes);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    return url.toString();
  }

  /**
   * Verifies Shopify HMAC signature from query parameters or webhook headers.
   */
  verifyHmac(params: Record<string, string>, apiSecret: string): boolean {
    const hmac = params['hmac'];
    if (!hmac) return false;

    const orderedKeys = Object.keys(params)
      .filter((k) => k !== 'hmac' && k !== 'signature')
      .sort();

    const message = orderedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const computed = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computed));
    } catch {
      return false;
    }
  }

  /**
   * Verifies Shopify Webhook HMAC header (X-Shopify-Hmac-Sha256)
   */
  verifyWebhookHmac(rawBody: string, hmacHeader: string | null, apiSecret: string): boolean {
    if (!hmacHeader) return false;
    const computed = crypto
      .createHmac('sha256', apiSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    try {
      return crypto.timingSafeEqual(Buffer.from(hmacHeader), Buffer.from(computed));
    } catch {
      return false;
    }
  }

  /**
   * Serializes Shopify credentials with AES-256-GCM encryption.
   */
  serializeCredentials(creds: ShopifyCredentials): string {
    return encryptSecret(JSON.stringify(creds));
  }

  /**
   * Deserializes Shopify credentials from encrypted string.
   */
  deserializeCredentials(encrypted: string): ShopifyCredentials {
    try {
      const raw = decryptSecret(encrypted);
      if (!raw) return { accessToken: '', shopDomain: '' };
      return JSON.parse(raw) as ShopifyCredentials;
    } catch {
      return { accessToken: '', shopDomain: '' };
    }
  }

  /**
   * Maps Shopify fulfillment and financial status to NormalizedOrderStatus.
   */
  mapOrderStatus(
    financialStatus: string,
    fulfillmentStatus: string | null
  ): NormalizedOrderStatus {
    if (financialStatus === 'refunded' || financialStatus === 'voided') {
      return NormalizedOrderStatus.return;
    }

    switch (fulfillmentStatus) {
      case 'fulfilled':
        return NormalizedOrderStatus.shipped;
      case 'partial':
        return NormalizedOrderStatus.partial;
      case 'restocked':
        return NormalizedOrderStatus.return;
      case null:
      case 'unfulfilled':
      default:
        return NormalizedOrderStatus.processing;
    }
  }

  /**
   * Transforms raw Shopify order payload into canonical CreateOrderInput.
   */
  transformToCanonicalOrder(
    tenantId: string,
    storeId: string,
    raw: RawShopifyOrder
  ): CreateOrderInput {
    const address = raw.shipping_address;
    const customerName = address?.name || `${address?.first_name || ''} ${address?.last_name || ''}`.trim() || 'Valued Customer';
    const totalAmount = parseFloat(raw.total_price) || 0;
    const deliveryFee = parseFloat(raw.total_shipping_price_set?.shop_money?.amount || '0') || 0;
    const isCod = (raw.gateway || '').toLowerCase().includes('cod') || raw.financial_status === 'pending';
    const codAmount = isCod ? totalAmount : 0;

    // Tracking info from fulfillments
    const fulfillment = raw.fulfillments?.[0];
    const trackingCode = fulfillment?.tracking_number;
    const rawCourierStatus = fulfillment?.status;

    return {
      tenantId,
      storeId,
      externalOrderId: String(raw.id),
      orderNumber: raw.name.startsWith('#') ? raw.name : `#${raw.name}`,
      customerName,
      customerPhone: address?.phone || '',
      customerAddress: address?.address1 || '',
      customerCity: address?.city || 'Dhaka',
      customerDistrict: address?.province || 'Dhaka',
      totalAmount,
      deliveryFee,
      codAmount,
      currency: 'BDT',
      normalizedStatus: this.mapOrderStatus(raw.financial_status, raw.fulfillment_status),
      rawCourierStatus,
      trackingCode,
      paymentStatus: isCod ? 'unpaid' : 'paid',
      orderedAt: new Date(raw.created_at),
      rawPayload: raw as unknown as Record<string, unknown>,
    };
  }

  /**
   * Exchanges temporary OAuth code for permanent offline access token.
   */
  async exchangeAccessToken(
    shopDomain: string,
    apiKey: string,
    apiSecret: string,
    code: string
  ): Promise<{ accessToken: string; scope: string }> {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const tokenUrl = `https://${cleanDomain}/admin/oauth/access_token`;

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    if (!res.ok) {
      throw new Error(`Shopify OAuth token exchange failed with status ${res.status}`);
    }

    const data = (await res.json()) as { access_token: string; scope: string };
    return {
      accessToken: data.access_token,
      scope: data.scope,
    };
  }

  /**
   * Two-way status writeback: Creates or updates a fulfillment on Shopify with courier tracking.
   */
  async fulfillOrderWithTracking(
    shopDomain: string,
    accessToken: string,
    externalOrderId: string,
    trackingNumber: string,
    trackingCompany: string
  ): Promise<{ success: boolean; fulfillmentId?: string | number }> {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const url = `https://${cleanDomain}/admin/api/2024-01/orders/${externalOrderId}/fulfillments.json`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fulfillment: {
            tracking_number: trackingNumber,
            tracking_company: trackingCompany,
            notify_customer: true,
          },
        }),
      });

      if (!res.ok) {
        return { success: false };
      }

      const data = (await res.json()) as { fulfillment?: { id: number | string } };
      return { success: true, fulfillmentId: data.fulfillment?.id };
    } catch {
      return { success: false };
    }
  }
}

export const shopifyConnector = new ShopifyConnector();


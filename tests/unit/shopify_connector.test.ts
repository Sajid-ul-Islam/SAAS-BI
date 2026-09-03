import { describe, it, expect } from 'vitest';
import {
  shopifyConnector,
  RawShopifyOrder,
} from '../../src/modules/integrations/stores/shopify.connector';
import { NormalizedOrderStatus } from '@prisma/client';
import crypto from 'node:crypto';

describe('Shopify Connector & OAuth', () => {
  const apiSecret = 'shpss_test_secret_1234567890';

  it('generates standard Shopify OAuth URL with query params', () => {
    const url = shopifyConnector.generateAuthUrl(
      'dhaka-threads.myshopify.com',
      'api_key_xyz',
      'https://app.example.com/api/integrations/shopify/callback',
      'nonce_state_123'
    );

    expect(url).toContain('https://dhaka-threads.myshopify.com/admin/oauth/authorize');
    expect(url).toContain('client_id=api_key_xyz');
    expect(url).toContain('state=nonce_state_123');
  });

  it('verifies valid Shopify query HMAC signature', () => {
    const params: Record<string, string> = {
      shop: 'dhaka-threads.myshopify.com',
      timestamp: '1700000000',
    };

    const message = `shop=${params.shop}&timestamp=${params.timestamp}`;
    const hmac = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
    params['hmac'] = hmac;

    expect(shopifyConnector.verifyHmac(params, apiSecret)).toBe(true);
  });

  it('rejects tampered Shopify HMAC signature', () => {
    const params: Record<string, string> = {
      shop: 'dhaka-threads.myshopify.com',
      timestamp: '1700000000',
      hmac: 'invalid_hmac_hash',
    };

    expect(shopifyConnector.verifyHmac(params, apiSecret)).toBe(false);
  });

  it('verifies valid Shopify Webhook HMAC-SHA256 header', () => {
    const rawBody = JSON.stringify({ id: 98765, name: '#1001' });
    const hmacHeader = crypto
      .createHmac('sha256', apiSecret)
      .update(rawBody, 'utf8')
      .digest('base64');

    expect(shopifyConnector.verifyWebhookHmac(rawBody, hmacHeader, apiSecret)).toBe(true);
  });

  describe('Shopify Order Transformation', () => {
    const rawShopifyOrder: RawShopifyOrder = {
      id: 88776655,
      name: '#SP-2005',
      created_at: '2026-03-02T15:30:00Z',
      total_price: '6800.00',
      financial_status: 'pending', // Pending payment implies COD
      fulfillment_status: 'fulfilled',
      gateway: 'Cash on Delivery (COD)',
      shipping_address: {
        name: 'Ayesha Siddiqua',
        phone: '+8801822334455',
        address1: 'Road 5, Dhanmondi',
        city: 'Dhaka',
        province: 'Dhaka',
      },
      fulfillments: [
        {
          tracking_number: 'SF-991122',
          tracking_company: 'Steadfast Courier',
          status: 'in_transit',
        },
      ],
    };

    it('transforms raw Shopify payload into canonical CreateOrderInput', () => {
      const order = shopifyConnector.transformToCanonicalOrder(
        'tenant-uuid-1',
        'store-uuid-shopify',
        rawShopifyOrder
      );

      expect(order.tenantId).toBe('tenant-uuid-1');
      expect(order.storeId).toBe('store-uuid-shopify');
      expect(order.externalOrderId).toBe('88776655');
      expect(order.orderNumber).toBe('#SP-2005');
      expect(order.customerName).toBe('Ayesha Siddiqua');
      expect(order.customerPhone).toBe('+8801822334455');
      expect(order.customerDistrict).toBe('Dhaka');
      expect(order.totalAmount).toBe(6800.0);
      expect(order.codAmount).toBe(6800.0);
      expect(order.normalizedStatus).toBe(NormalizedOrderStatus.shipped);
      expect(order.trackingCode).toBe('SF-991122');
      expect(order.rawCourierStatus).toBe('in_transit');
    });
  });
});

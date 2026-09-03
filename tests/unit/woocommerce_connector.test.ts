import { describe, it, expect } from 'vitest';
import {
  wooCommerceConnector,
  RawWooCommerceOrder,
} from '../../src/modules/integrations/stores/woocommerce.connector';
import { encryptSecret, decryptSecret } from '../../src/lib/encryption';
import { NormalizedOrderStatus } from '@prisma/client';

describe('WooCommerce Connector & Encryption', () => {
  describe('AES-256-GCM Encryption', () => {
    it('encrypts and decrypts sensitive plain text symmetrically', () => {
      const plain = 'ck_test_1234567890abcdef:cs_test_0987654321fedcba';
      const encrypted = encryptSecret(plain);

      expect(encrypted).not.toBe(plain);
      expect(encrypted.split(':')).toHaveLength(3); // iv:ciphertext:tag

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plain);
    });

    it('serializes and deserializes WooCommerce credentials object', () => {
      const creds = {
        consumerKey: 'ck_abc1234567890',
        consumerSecret: 'cs_xyz0987654321',
      };

      const serialized = wooCommerceConnector.serializeCredentials(creds);
      const deserialized = wooCommerceConnector.deserializeCredentials(serialized);

      expect(deserialized.consumerKey).toBe(creds.consumerKey);
      expect(deserialized.consumerSecret).toBe(creds.consumerSecret);
    });
  });

  describe('Order Canonical Transformation', () => {
    const rawOrder: RawWooCommerceOrder = {
      id: 5432,
      number: '105432',
      status: 'processing',
      date_created: '2026-03-01T12:00:00',
      total: '4500.00',
      shipping_total: '120.00',
      payment_method: 'cod',
      payment_method_title: 'Cash on Delivery',
      billing: {
        first_name: 'Mahmudul',
        last_name: 'Hasan',
        phone: '+8801700112233',
        address_1: 'Banani Road 11',
        city: 'Dhaka',
        state: 'Dhaka',
      },
      meta_data: [
        { key: 'pathao_consignment_id', value: 'PT-998877' },
        { key: 'courier_status', value: 'Picked' },
      ],
    };

    it('transforms raw WooCommerce order into canonical CreateOrderInput', () => {
      const canonical = wooCommerceConnector.transformToCanonicalOrder(
        'tenant-uuid-1',
        'store-uuid-1',
        rawOrder
      );

      expect(canonical.tenantId).toBe('tenant-uuid-1');
      expect(canonical.storeId).toBe('store-uuid-1');
      expect(canonical.externalOrderId).toBe('5432');
      expect(canonical.orderNumber).toBe('#105432');
      expect(canonical.customerName).toBe('Mahmudul Hasan');
      expect(canonical.customerPhone).toBe('+8801700112233');
      expect(canonical.customerDistrict).toBe('Dhaka');
      expect(canonical.totalAmount).toBe(4500.0);
      expect(canonical.deliveryFee).toBe(120.0);
      expect(canonical.codAmount).toBe(4500.0); // Because payment_method is cod
      expect(canonical.normalizedStatus).toBe(NormalizedOrderStatus.processing);
      expect(canonical.trackingCode).toBe('PT-998877');
      expect(canonical.rawCourierStatus).toBe('Picked');
    });

    it('maps completed status to delivered', () => {
      expect(wooCommerceConnector.mapOrderStatus('completed')).toBe(
        NormalizedOrderStatus.delivered
      );
    });

    it('maps refunded to return', () => {
      expect(wooCommerceConnector.mapOrderStatus('refunded')).toBe(
        NormalizedOrderStatus.return
      );
    });
  });
});

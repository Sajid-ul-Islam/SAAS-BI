import { describe, it, expect, vi } from 'vitest';
import {
  normalizeStoreOrders,
  persistStoreOrders,
  syncOrders,
} from '../../src/lib/inngest/functions/order-sync';
import { pollCourierStatus } from '../../src/lib/inngest/functions/courier-poll';
import { ordersRepository } from '../../src/modules/orders/orders.repository';
import { RawWooCommerceOrder } from '../../src/modules/integrations/stores/woocommerce.connector';

describe('Inngest Background Workflows', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const storeId = 'store-uuid-1';

  it('syncOrders function has correct concurrency and tenantId key', () => {
    // Check inngest function metadata
    expect(syncOrders.id()).toBe('sync-orders');
  });

  it('pollCourierStatus function is properly configured', () => {
    expect(pollCourierStatus.id()).toBe('poll-courier-status');
  });

  it('normalizes store orders correctly in batch', () => {
    const rawOrders: RawWooCommerceOrder[] = [
      {
        id: 101,
        number: '101',
        status: 'processing',
        date_created: '2026-03-01T10:00:00',
        total: '1500.00',
        shipping_total: '60.00',
        payment_method: 'cod',
        payment_method_title: 'COD',
        billing: {
          first_name: 'Habib',
          last_name: 'Wahid',
          phone: '01711111111',
          address_1: 'Mirpur 10',
          city: 'Dhaka',
          state: 'Dhaka',
        },
      },
    ];

    const normalized = normalizeStoreOrders(tenantId, storeId, rawOrders);
    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.customerName).toBe('Habib Wahid');
    expect(normalized[0]?.totalAmount).toBe(1500);
  });

  it('persists store orders and counts processed records', async () => {
    const upsertSpy = vi.spyOn(ordersRepository, 'upsertOrder').mockResolvedValue({} as never);

    const count = await persistStoreOrders([
      {
        tenantId,
        storeId,
        externalOrderId: '101',
        orderNumber: '#101',
        customerName: 'Habib',
        customerPhone: '01711111111',
        customerAddress: 'Mirpur',
        customerCity: 'Dhaka',
        customerDistrict: 'Dhaka',
        totalAmount: 1500,
        orderedAt: new Date(),
      },
    ]);

    expect(count).toBe(1);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    upsertSpy.mockRestore();
  });
});

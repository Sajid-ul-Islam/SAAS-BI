import { describe, it, expect, vi } from 'vitest';
import { ordersService } from '../../src/modules/orders/orders.service';
import { ordersRepository } from '../../src/modules/orders/orders.repository';
import { NormalizedOrderStatus, Prisma } from '@prisma/client';
import { cn } from '../../src/shared/utils/cn';

describe('Orders Service Logic', () => {
  const tenantId = '11111111-1111-1111-1111-111111111111';
  const orderId = 'order-uuid-123';

  it('merges tailwind classes using cn utility', () => {
    expect(cn('px-2 py-1', 'bg-blue-500', { 'text-white': true, 'opacity-50': false })).toBe(
      'px-2 py-1 bg-blue-500 text-white'
    );
  });

  it('handles state transition updates cleanly', async () => {
    const existingOrder = {
      id: orderId,
      tenantId,
      storeId: 'store-1',
      courierId: null,
      externalOrderId: 'EXT-1',
      orderNumber: '#1001',
      customerName: 'Karim',
      customerPhone: '01700000000',
      customerAddress: 'Dhaka',
      customerCity: 'Dhaka',
      customerDistrict: 'Dhaka',
      totalAmount: new Prisma.Decimal(1200),
      deliveryFee: new Prisma.Decimal(60),
      codAmount: new Prisma.Decimal(1200),
      currency: 'BDT',
      normalizedStatus: NormalizedOrderStatus.processing,
      rawCourierStatus: 'pending',
      trackingCode: null,
      paymentStatus: 'unpaid',
      rawPayload: null,
      orderedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [],
    };

    const findSpy = vi.spyOn(ordersRepository, 'findById').mockResolvedValue(existingOrder);
    const recordSpy = vi.spyOn(ordersRepository, 'recordStatusChange').mockResolvedValue([
      existingOrder,
      {
        id: 'hist-1',
        tenantId,
        orderId,
        previousStatus: NormalizedOrderStatus.processing,
        newStatus: NormalizedOrderStatus.shipped,
        rawCourierStatus: 'picked',
        source: 'courier_webhook',
        note: null,
        changedAt: new Date(),
      },
    ]);

    await ordersService.updateCourierStatus(
      tenantId,
      orderId,
      NormalizedOrderStatus.shipped,
      'picked',
      'courier_webhook'
    );

    expect(findSpy).toHaveBeenCalledWith(tenantId, orderId);
    expect(recordSpy).toHaveBeenCalledWith(
      tenantId,
      orderId,
      NormalizedOrderStatus.processing,
      NormalizedOrderStatus.shipped,
      'picked',
      'courier_webhook',
      undefined
    );

    findSpy.mockRestore();
    recordSpy.mockRestore();
  });
});

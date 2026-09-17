import { describe, it, expect, vi } from 'vitest';
import { ordersRepository } from '../../src/modules/orders/orders.repository';
import { ordersService } from '../../src/modules/orders/orders.service';
import { BANGLADESH_DISTRICTS } from '../../src/modules/orders/orders.types';
import { prisma } from '../../src/lib/prisma';
import { CourierProvider, NormalizedOrderStatus, Prisma } from '@prisma/client';

describe('Orders Filtering & Pagination Unit Tests', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  it('contains expected Bangladeshi districts including primary commerce hubs', () => {
    expect(BANGLADESH_DISTRICTS).toContain('Dhaka');
    expect(BANGLADESH_DISTRICTS).toContain('Chittagong');
    expect(BANGLADESH_DISTRICTS).toContain('Sylhet');
    expect(BANGLADESH_DISTRICTS).toContain('Gazipur');
    expect(BANGLADESH_DISTRICTS.length).toBe(64);
  });

  it('constructs correct Prisma where clause for status and courier filters', async () => {
    const mockOrders = [
      {
        id: 'ord-1',
        tenantId,
        storeId: 'store-1',
        courierId: 'cour-1',
        externalOrderId: 'WOO-1',
        orderNumber: '#DF-1001',
        customerName: 'Rahim',
        customerPhone: '01711111111',
        customerAddress: 'Dhanmondi',
        customerCity: 'Dhaka',
        customerDistrict: 'Dhaka',
        totalAmount: new Prisma.Decimal(2500),
        deliveryFee: new Prisma.Decimal(60),
        codAmount: new Prisma.Decimal(2500),
        currency: 'BDT',
        normalizedStatus: NormalizedOrderStatus.delivered,
        rawCourierStatus: 'Delivered',
        trackingCode: 'PT-123',
        paymentStatus: 'paid',
        rawPayload: null,
        orderedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        store: { id: 'store-1', name: 'Dhaka Store', platform: 'WOOCOMMERCE' },
        courierCredential: { id: 'cour-1', courier: CourierProvider.PATHAO },
      },
    ];

    const findManySpy = vi.spyOn(prisma.order, 'findMany').mockResolvedValue(mockOrders as any);
    const countSpy = vi.spyOn(prisma.order, 'count').mockResolvedValue(1);

    const res = await ordersRepository.findPaginated(tenantId, {
      status: NormalizedOrderStatus.delivered,
      courier: 'PATHAO',
      district: 'Dhaka',
      search: 'DF-1001',
      page: 2,
      limit: 10,
    });

    expect(findManySpy).toHaveBeenCalled();
    const callArgs = findManySpy.mock.calls[0]?.[0];
    expect(callArgs?.where?.tenantId).toBe(tenantId);
    expect(callArgs?.where?.normalizedStatus).toBe(NormalizedOrderStatus.delivered);
    expect(callArgs?.where?.courierCredential).toEqual({ courier: CourierProvider.PATHAO });
    expect(callArgs?.where?.customerDistrict).toEqual({ contains: 'Dhaka', mode: 'insensitive' });
    expect(callArgs?.skip).toBe(10);
    expect(callArgs?.take).toBe(10);

    expect(res.orders).toHaveLength(1);
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
    expect(res.total).toBe(1);

    findManySpy.mockRestore();
    countSpy.mockRestore();
  });

  it('delegates service calls to repository cleanly', async () => {
    const mockResult = {
      orders: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    const spy = vi.spyOn(ordersRepository, 'findPaginated').mockResolvedValue(mockResult);

    const res = await ordersService.getOrders(tenantId, { status: 'ALL' });
    expect(res.total).toBe(0);
    expect(spy).toHaveBeenCalledWith(tenantId, { status: 'ALL' });

    spy.mockRestore();
  });
});

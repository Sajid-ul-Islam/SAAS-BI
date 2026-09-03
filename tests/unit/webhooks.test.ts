import { describe, it, expect, vi } from 'vitest';
import { POST as pathaoPost } from '../../src/app/api/webhooks/pathao/route';
import { POST as steadfastPost } from '../../src/app/api/webhooks/steadfast/route';
import { POST as redxPost } from '../../src/app/api/webhooks/redx/route';
import { prisma } from '../../src/lib/prisma';
import { NormalizedOrderStatus } from '@prisma/client';

describe('Courier Webhook Handlers', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  it('Pathao webhook handles missing fields gracefully', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/pathao', {
      method: 'POST',
      body: JSON.stringify({ invalid: true }),
    });

    const res = await pathaoPost(req);
    expect(res.status).toBe(400);
  });

  it('Pathao webhook updates order to delivered when consignment matches', async () => {
    const mockOrder = {
      id: 'ord-pathao-1',
      tenantId,
      trackingCode: 'PT-123456',
      normalizedStatus: NormalizedOrderStatus.processing,
    };

    const findSpy = vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as never);
    const txSpy = vi.spyOn(prisma, '$transaction').mockResolvedValue([] as never);

    const req = new Request('http://localhost:3000/api/webhooks/pathao', {
      method: 'POST',
      body: JSON.stringify({
        consignment_id: 'PT-123456',
        order_status: 'Delivered',
      }),
    });

    const res = await pathaoPost(req);
    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalled();
    expect(txSpy).toHaveBeenCalled();

    findSpy.mockRestore();
    txSpy.mockRestore();
  });

  it('Steadfast webhook updates order when invoice matches', async () => {
    const mockOrder = {
      id: 'ord-sf-1',
      tenantId,
      orderNumber: '#DF-9988',
      normalizedStatus: NormalizedOrderStatus.processing,
      trackingCode: 'SF-112233',
    };

    const findSpy = vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as never);
    const txSpy = vi.spyOn(prisma, '$transaction').mockResolvedValue([] as never);

    const req = new Request('http://localhost:3000/api/webhooks/steadfast', {
      method: 'POST',
      body: JSON.stringify({
        consignment_id: 112233,
        invoice: 'DF-9988',
        status: 'in_transit',
      }),
    });

    const res = await steadfastPost(req);
    expect(res.status).toBe(200);
    expect(findSpy).toHaveBeenCalled();
    expect(txSpy).toHaveBeenCalled();

    findSpy.mockRestore();
    txSpy.mockRestore();
  });

  it('RedX webhook handles tracking id update', async () => {
    const mockOrder = {
      id: 'ord-redx-1',
      tenantId,
      trackingCode: 'REDX-7788',
      normalizedStatus: NormalizedOrderStatus.processing,
    };

    const findSpy = vi.spyOn(prisma.order, 'findFirst').mockResolvedValue(mockOrder as never);
    const txSpy = vi.spyOn(prisma, '$transaction').mockResolvedValue([] as never);

    const req = new Request('http://localhost:3000/api/webhooks/redx', {
      method: 'POST',
      body: JSON.stringify({
        tracking_id: 'REDX-7788',
        status: 'delivered',
      }),
    });

    const res = await redxPost(req);
    expect(res.status).toBe(200);

    findSpy.mockRestore();
    txSpy.mockRestore();
  });
});

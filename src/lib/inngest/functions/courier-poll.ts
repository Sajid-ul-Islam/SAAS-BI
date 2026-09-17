import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { ordersRepository } from '@/modules/orders/orders.repository';
import { normalizeCourierStatus } from '@/modules/integrations/couriers/status-normalizer';
import { logger } from '@/lib/logger';
import { NormalizedOrderStatus } from '@prisma/client';

export const pollCourierStatus = inngest.createFunction(
  {
    id: 'poll-courier-status',
    concurrency: { limit: 5, key: 'event.data.tenantId' },
    retries: 3,
  },
  { event: 'courier/status.poll' },
  async ({ event, step }) => {
    const { tenantId } = event.data;

    // 1. Fetch orders in flight
    const pendingOrders = await step.run('fetch-in-flight-orders', async () => {
      return prisma.order.findMany({
        where: {
          tenantId,
          trackingCode: { not: null },
          normalizedStatus: {
            in: [
              NormalizedOrderStatus.processing,
              NormalizedOrderStatus.shipped,
              NormalizedOrderStatus.on_the_way,
            ],
          },
        },
        include: {
          courierCredential: true,
        },
        take: 50,
      });
    });

    if (pendingOrders.length === 0) {
      return { polledCount: 0, updatedCount: 0 };
    }

    // 2. Poll & update status
    const updateResult = await step.run('poll-and-update-statuses', async () => {
      let updatedCount = 0;

      for (const order of pendingOrders) {
        if (!order.courierCredential || !order.trackingCode) continue;

        // Simulated check or live status lookup
        const courierProvider = order.courierCredential.courier;
        const currentRaw = order.rawCourierStatus || 'pending';
        const normalized = normalizeCourierStatus(courierProvider, currentRaw);

        if (normalized !== order.normalizedStatus) {
          await ordersRepository.recordStatusChange(
            tenantId,
            order.id,
            order.normalizedStatus,
            normalized,
            currentRaw,
            'courier_poller',
            `Status polled from ${courierProvider}`
          );
          updatedCount++;
        }
      }

      logger.info('Courier polling completed', {
        tenantId,
        polledOrders: pendingOrders.length,
        updatedCount,
      });

      return { polledCount: pendingOrders.length, updatedCount };
    });

    return updateResult;
  }
);

/**
 * Scheduled cron to reconcile stale orders stuck in transit (>72h)
 */
export const reconcileStaleOrdersCron = inngest.createFunction(
  {
    id: 'reconcile-stale-courier-orders',
    concurrency: { limit: 2 },
  },
  { cron: '0 */6 * * *' },
  async ({ step }) => {
    const staleThreshold = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const tenantsWithStaleOrders = await step.run('find-tenants-with-stale-orders', async () => {
      const orders = await prisma.order.findMany({
        where: {
          normalizedStatus: {
            in: [NormalizedOrderStatus.shipped, NormalizedOrderStatus.on_the_way],
          },
          updatedAt: { lte: staleThreshold },
          trackingCode: { not: null },
        },
        select: { tenantId: true },
        distinct: ['tenantId'],
        take: 20,
      });
      return orders.map((o) => o.tenantId);
    });

    for (const tenantId of tenantsWithStaleOrders) {
      await step.run(`trigger-poll-${tenantId}`, async () => {
        await inngest.send({
          name: 'courier/status.poll',
          data: { tenantId },
        });
      });
    }

    return { reconciledTenants: tenantsWithStaleOrders.length };
  }
);


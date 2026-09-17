import { inngest } from '../client';
import { prisma } from '@/lib/prisma';
import { wooCommerceConnector, RawWooCommerceOrder } from '@/modules/integrations/stores/woocommerce.connector';
import { ordersRepository } from '@/modules/orders/orders.repository';
import { CreateOrderInput } from '@/modules/orders/orders.types';
import { logger } from '@/lib/logger';
import { StorePlatform, SyncStatus } from '@prisma/client';

export async function fetchStoreOrders(tenantId: string, storeId: string): Promise<RawWooCommerceOrder[]> {
  const store = await prisma.store.findFirst({
    where: { id: storeId, tenantId },
  });

  if (!store) {
    logger.warn('Store not found for sync job', { tenantId, storeId });
    return [];
  }

  if (store.platform === StorePlatform.WOOCOMMERCE) {
    const creds = wooCommerceConnector.deserializeCredentials(store.credentialsEncrypted);
    return wooCommerceConnector.fetchOrders(store.storeUrl, creds, { perPage: 25 });
  }

  return [];
}

export function normalizeStoreOrders(
  tenantId: string,
  storeId: string,
  rawOrders: RawWooCommerceOrder[]
): CreateOrderInput[] {
  return rawOrders.map((raw) =>
    wooCommerceConnector.transformToCanonicalOrder(tenantId, storeId, raw)
  );
}

export async function persistStoreOrders(
  orders: Array<Omit<CreateOrderInput, 'orderedAt'> & { orderedAt: Date | string }>
): Promise<number> {
  let count = 0;
  for (const ord of orders) {
    await ordersRepository.upsertOrder({
      ...ord,
      orderedAt: typeof ord.orderedAt === 'string' ? new Date(ord.orderedAt) : ord.orderedAt,
    });
    count++;
  }
  return count;
}

/**
 * Inngest order synchronization workflow
 */
export const syncOrders = inngest.createFunction(
  {
    id: 'sync-orders',
    concurrency: { limit: 5, key: 'event.data.tenantId' },
    retries: 3,
  },
  { event: 'integration/orders.sync' },
  async ({ event, step }) => {
    const { tenantId, storeId } = event.data;

    // 1. Fetch orders from store
    const raw = await step.run('fetch-orders', async () => {
      return fetchStoreOrders(tenantId, storeId);
    });

    // 2. Normalize statuses into canonical enum
    const normalized = await step.run('normalize-statuses', async () => {
      return normalizeStoreOrders(tenantId, storeId, raw);
    });

    // 3. Persist orders idempotently into database
    const persistedCount = await step.run('persist', async () => {
      const count = await persistStoreOrders(normalized);
      await prisma.store.update({
        where: { id: storeId },
        data: {
          syncStatus: SyncStatus.SUCCESS,
          lastSyncedAt: new Date(),
        },
      });
      return count;
    });

    return {
      syncedOrders: persistedCount,
      tenantId,
      storeId,
    };
  }
);

/**
 * Historical order backfill job stepping through pages with cursor & rate limits
 */
export const backfillStoreOrders = inngest.createFunction(
  {
    id: 'backfill-store-orders',
    concurrency: { limit: 2, key: 'event.data.tenantId' },
    retries: 3,
  },
  { event: 'integration/orders.backfill' },
  async ({ event, step }) => {
    const { tenantId, storeId, maxPages = 5, perPage = 50 } = event.data;

    let totalBackfilled = 0;

    for (let page = 1; page <= maxPages; page++) {
      const orders = await step.run(`fetch-page-${page}`, async () => {
        const store = await prisma.store.findFirst({
          where: { id: storeId, tenantId },
        });
        if (!store || store.platform !== StorePlatform.WOOCOMMERCE) return [];
        const creds = wooCommerceConnector.deserializeCredentials(store.credentialsEncrypted);
        return wooCommerceConnector.fetchOrders(store.storeUrl, creds, { page, perPage });
      });

      if (orders.length === 0) break;

      const normalized = normalizeStoreOrders(tenantId, storeId, orders);
      const count = await step.run(`persist-page-${page}`, async () => {
        return persistStoreOrders(normalized);
      });

      totalBackfilled += count;

      // Small pause between pages to respect storefront rate limits
      await step.sleep(`pause-after-page-${page}`, '2s');
    }

    return { totalBackfilled, tenantId, storeId };
  }
);


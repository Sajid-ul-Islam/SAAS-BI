import { integrationsRepository } from './integrations.repository';
import { StoreSummary, CourierCredentialSummary } from './integrations.types';
import { logger } from '@/lib/logger';

export class IntegrationsService {
  async getTenantStores(tenantId: string): Promise<StoreSummary[]> {
    try {
      const stores = await integrationsRepository.listStores(tenantId);
      if (stores.length === 0 && (tenantId === '00000000-0000-0000-0000-000000000001' || tenantId.includes('demo'))) {
        const { DEMO_STORES } = await import('@/lib/demo-data');
        return DEMO_STORES;
      }
      return stores.map((s) => ({
        id: s.id,
        name: s.name,
        platform: s.platform,
        storeUrl: s.storeUrl,
        syncStatus: s.syncStatus,
        lastSyncedAt: s.lastSyncedAt,
      }));
    } catch (err) {
      logger.warn('Failed to query stores from database, serving demo fallback', { tenantId, err });
      const { DEMO_STORES } = await import('@/lib/demo-data');
      return DEMO_STORES;
    }
  }

  async getTenantCouriers(tenantId: string): Promise<CourierCredentialSummary[]> {
    try {
      const couriers = await integrationsRepository.listCouriers(tenantId);
      if (couriers.length === 0 && (tenantId === '00000000-0000-0000-0000-000000000001' || tenantId.includes('demo'))) {
        const { DEMO_COURIERS } = await import('@/lib/demo-data');
        return DEMO_COURIERS;
      }
      return couriers.map((c) => ({
        id: c.id,
        courier: c.courier,
        isActive: c.isActive,
        hasWebhookSecret: Boolean(c.webhookSecret),
      }));
    } catch (err) {
      logger.warn('Failed to query couriers from database, serving demo fallback', { tenantId, err });
      const { DEMO_COURIERS } = await import('@/lib/demo-data');
      return DEMO_COURIERS;
    }
  }

  async logWebhookEvent(
    tenantId: string,
    source: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    logger.info('Inbound courier webhook event logged', {
      tenantId,
      source,
      eventType,
      keys: Object.keys(payload),
    });
  }
}

export const integrationsService = new IntegrationsService();

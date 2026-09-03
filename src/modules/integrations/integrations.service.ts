import { integrationsRepository } from './integrations.repository';
import { StoreSummary, CourierCredentialSummary } from './integrations.types';
import { logger } from '@/lib/logger';

export class IntegrationsService {
  async getTenantStores(tenantId: string): Promise<StoreSummary[]> {
    const stores = await integrationsRepository.listStores(tenantId);
    return stores.map((s) => ({
      id: s.id,
      name: s.name,
      platform: s.platform,
      storeUrl: s.storeUrl,
      syncStatus: s.syncStatus,
      lastSyncedAt: s.lastSyncedAt,
    }));
  }

  async getTenantCouriers(tenantId: string): Promise<CourierCredentialSummary[]> {
    const couriers = await integrationsRepository.listCouriers(tenantId);
    return couriers.map((c) => ({
      id: c.id,
      courier: c.courier,
      isActive: c.isActive,
      hasWebhookSecret: Boolean(c.webhookSecret),
    }));
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

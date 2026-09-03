import { StorePlatform, CourierProvider, SyncStatus } from '@prisma/client';

export { StorePlatform, CourierProvider, SyncStatus };

export interface StoreSummary {
  id: string;
  name: string;
  platform: StorePlatform;
  storeUrl: string;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
}

export interface CourierCredentialSummary {
  id: string;
  courier: CourierProvider;
  isActive: boolean;
  hasWebhookSecret: boolean;
}

export interface WebhookPayload {
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
}

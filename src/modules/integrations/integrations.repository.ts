import { prisma } from '@/lib/prisma';
import { StorePlatform, CourierProvider, Store, CourierCredential } from '@prisma/client';

export class IntegrationsRepository {
  async listStores(tenantId: string): Promise<Store[]> {
    return prisma.store.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStoreById(tenantId: string, storeId: string): Promise<Store | null> {
    return prisma.store.findFirst({
      where: { id: storeId, tenantId },
    });
  }

  async listCouriers(tenantId: string): Promise<CourierCredential[]> {
    return prisma.courierCredential.findMany({
      where: { tenantId },
    });
  }

  async findCourier(
    tenantId: string,
    courier: CourierProvider
  ): Promise<CourierCredential | null> {
    return prisma.courierCredential.findUnique({
      where: {
        tenantId_courier: {
          tenantId,
          courier,
        },
      },
    });
  }

  async saveStore(
    tenantId: string,
    platform: StorePlatform,
    name: string,
    storeUrl: string,
    credentialsEncrypted: string
  ): Promise<Store> {
    return prisma.store.upsert({
      where: {
        tenantId_storeUrl: {
          tenantId,
          storeUrl,
        },
      },
      update: {
        name,
        credentialsEncrypted,
      },
      create: {
        tenantId,
        platform,
        name,
        storeUrl,
        credentialsEncrypted,
      },
    });
  }

  async saveCourier(
    tenantId: string,
    courier: CourierProvider,
    credentialsEncrypted: string,
    webhookSecret?: string
  ): Promise<CourierCredential> {
    return prisma.courierCredential.upsert({
      where: {
        tenantId_courier: {
          tenantId,
          courier,
        },
      },
      update: {
        credentialsEncrypted,
        webhookSecret,
        isActive: true,
      },
      create: {
        tenantId,
        courier,
        credentialsEncrypted,
        webhookSecret,
        isActive: true,
      },
    });
  }
}

export const integrationsRepository = new IntegrationsRepository();

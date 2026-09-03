import { prisma } from '@/lib/prisma';
import { Tenant, User, TenantRole } from '@prisma/client';

export class TenantsRepository {
  async findById(tenantId: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async findUserMembership(userId: string, tenantId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });
  }

  async listTenantUsers(tenantId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRole(tenantId: string, userId: string, role: TenantRole): Promise<User> {
    return prisma.user.update({
      where: {
        id: userId,
        tenantId,
      },
      data: { role },
    });
  }
}

export const tenantsRepository = new TenantsRepository();

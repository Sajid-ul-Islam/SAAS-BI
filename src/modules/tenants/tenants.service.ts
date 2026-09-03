import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { TenantSummary } from './tenants.types';
import { PlanTier, SubscriptionStatus, TenantRole } from '@prisma/client';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied: cross-tenant access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export { extractTenantIdFromJwtClaims } from '../../lib/auth-utils';

/**
 * Validates that the requested resource tenant matches the authenticated session tenant.
 * Prevents horizontal privilege escalation.
 */
export function assertTenantAccess(sessionTenantId: string, requestedTenantId: string): void {
  if (!sessionTenantId || !requestedTenantId || sessionTenantId !== requestedTenantId) {
    logger.warn('Cross-tenant access attempt blocked', {
      sessionTenantId,
      requestedTenantId,
    });
    throw new ForbiddenError(`Access denied: cross-tenant access forbidden`);
  }
}

/**
 * Retrieves tenant overview and active subscription summary.
 */
export async function getTenantSummary(tenantId: string, userId: string): Promise<TenantSummary | null> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    include: {
      tenant: {
        include: {
          subscriptions: {
            where: { status: SubscriptionStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!user || !user.tenant) {
    return null;
  }

  const sub = user.tenant.subscriptions[0];

  return {
    id: user.tenant.id,
    name: user.tenant.name,
    slug: user.tenant.slug,
    status: user.tenant.status,
    plan: sub?.planTier ?? PlanTier.FREE,
    subscriptionStatus: sub?.status ?? SubscriptionStatus.ACTIVE,
    userRole: user.role ?? TenantRole.MEMBER,
  };
}

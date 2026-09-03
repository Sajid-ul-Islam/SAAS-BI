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

/**
 * Extracts tenantId safely from Supabase Auth JWT claims.
 * Checks app_metadata first (secure server-set), then user_metadata.
 */
export function extractTenantIdFromJwtClaims(claims: unknown): string | null {
  if (!claims || typeof claims !== 'object') {
    return null;
  }

  const record = claims as Record<string, unknown>;

  // 1. Check app_metadata.tenant_id
  if (record['app_metadata'] && typeof record['app_metadata'] === 'object') {
    const appMeta = record['app_metadata'] as Record<string, unknown>;
    if (typeof appMeta['tenant_id'] === 'string' && appMeta['tenant_id'].trim().length > 0) {
      return appMeta['tenant_id'];
    }
  }

  // 2. Fallback to user_metadata.tenant_id
  if (record['user_metadata'] && typeof record['user_metadata'] === 'object') {
    const userMeta = record['user_metadata'] as Record<string, unknown>;
    if (typeof userMeta['tenant_id'] === 'string' && userMeta['tenant_id'].trim().length > 0) {
      return userMeta['tenant_id'];
    }
  }

  return null;
}

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

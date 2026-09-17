import { TenantRole } from '@prisma/client';
import { UnauthorizedError } from '@/shared/errors';

export type RbacAction =
  | 'view_dashboard'
  | 'view_orders'
  | 'view_analytics'
  | 'query_ai'
  | 'dispatch_orders'
  | 'manage_integrations'
  | 'invite_members'
  | 'manage_billing'
  | 'delete_tenant';

const ROLE_HIERARCHY: Record<TenantRole, number> = {
  [TenantRole.MEMBER]: 1,
  [TenantRole.ADMIN]: 2,
  [TenantRole.OWNER]: 3,
};

const ACTION_PERMISSIONS: Record<RbacAction, TenantRole> = {
  view_dashboard: TenantRole.MEMBER,
  view_orders: TenantRole.MEMBER,
  view_analytics: TenantRole.MEMBER,
  query_ai: TenantRole.MEMBER,
  dispatch_orders: TenantRole.MEMBER,
  manage_integrations: TenantRole.ADMIN,
  invite_members: TenantRole.ADMIN,
  manage_billing: TenantRole.ADMIN,
  delete_tenant: TenantRole.OWNER,
};

export class RbacGuard {
  static hasPermission(userRole: TenantRole, action: RbacAction): boolean {
    const requiredRole = ACTION_PERMISSIONS[action];
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
  }

  static assertPermission(userRole: TenantRole, action: RbacAction): void {
    if (!this.hasPermission(userRole, action)) {
      throw new UnauthorizedError(
        `User role '${userRole}' lacks permission to perform action '${action}'`
      );
    }
  }

  static assertAtLeastRole(userRole: TenantRole, requiredRole: TenantRole): void {
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
      throw new UnauthorizedError(
        `Insufficient privileges. Required role: '${requiredRole}', current role: '${userRole}'`
      );
    }
  }
}

/**
 * Pure JWT and tenant claim parsing utilities safe for Edge Runtime and Middleware.
 */

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

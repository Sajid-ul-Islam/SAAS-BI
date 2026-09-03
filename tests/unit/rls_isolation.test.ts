import { describe, it, expect } from 'vitest';
import { extractTenantIdFromJwtClaims, assertTenantAccess } from '../../src/modules/tenants/tenants.service';

describe('Multi-Tenant Isolation & JWT Parsing', () => {
  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';

  it('extracts tenantId correctly from app_metadata in Supabase Auth claims', () => {
    const claims = {
      sub: 'usr-123',
      email: 'merchant@dhaka.com',
      app_metadata: {
        tenant_id: TENANT_A,
      },
    };

    const extracted = extractTenantIdFromJwtClaims(claims);
    expect(extracted).toBe(TENANT_A);
  });

  it('falls back to user_metadata if app_metadata is missing tenant_id', () => {
    const claims = {
      sub: 'usr-456',
      email: 'merchant2@chittagong.com',
      user_metadata: {
        tenant_id: TENANT_B,
      },
    };

    const extracted = extractTenantIdFromJwtClaims(claims);
    expect(extracted).toBe(TENANT_B);
  });

  it('returns null if no tenantId is present in JWT claims', () => {
    const claims = {
      sub: 'usr-789',
      email: 'unassigned@example.com',
    };

    const extracted = extractTenantIdFromJwtClaims(claims);
    expect(extracted).toBeNull();
  });

  it('assertTenantAccess permits matching tenant context', () => {
    expect(() => assertTenantAccess(TENANT_A, TENANT_A)).not.toThrow();
  });

  it('assertTenantAccess throws UnauthorizedError for cross-tenant access attempt', () => {
    expect(() => assertTenantAccess(TENANT_A, TENANT_B)).toThrowError(
      /Access denied: cross-tenant access forbidden/
    );
  });
});

import { describe, it, expect } from 'vitest';
import { createTenantSchema, inviteMemberSchema } from '../../src/modules/tenants/tenants.schema';
import { TenantRole } from '@prisma/client';

describe('Auth & Tenant Validation Schemas', () => {
  it('validates proper tenant creation input', () => {
    const valid = {
      name: 'Dhaka Threads Ltd',
      slug: 'dhaka-threads-ltd',
    };
    const res = createTenantSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects invalid slug with uppercase or special characters', () => {
    const invalid = {
      name: 'Dhaka Threads',
      slug: 'Dhaka_Threads!',
    };
    const res = createTenantSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('validates invite member payload with default role', () => {
    const valid = {
      email: 'accountant@dhakafashion.com',
      name: 'Anisul Huq',
      role: TenantRole.MEMBER,
    };
    const res = inviteMemberSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects invalid email for team invitation', () => {
    const invalid = {
      email: 'not-an-email',
      name: 'Anisul Huq',
      role: TenantRole.ADMIN,
    };
    const res = inviteMemberSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });
});

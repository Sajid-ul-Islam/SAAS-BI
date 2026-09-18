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

describe('Middleware Resilience & Edge Routing', () => {
  it('allows access to public homepage and healthcheck without crashing or redirecting', async () => {
    const { middleware } = await import('../../src/middleware');
    const { NextRequest } = await import('next/server');

    const homeReq = new NextRequest('http://localhost:3000/');
    const homeRes = await middleware(homeReq);
    expect(homeRes.status).toBe(200);

    const healthReq = new NextRequest('http://localhost:3000/api/health');
    const healthRes = await middleware(healthReq);
    expect(healthRes.status).toBe(200);
  });

  it('redirects unauthenticated requests to protected /dashboard to /login', async () => {
    const { middleware } = await import('../../src/middleware');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/dashboard/orders');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login?redirectedFrom=%2Fdashboard%2Forders');
  });

  it('permits demo-authenticated users and injects demo tenant headers', async () => {
    const { middleware } = await import('../../src/middleware');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'demo-session=true',
      },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-tenant-id')).toBe('00000000-0000-0000-0000-000000000001');
    expect(res.headers.get('x-user-id')).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('never throws unhandled exception even when Supabase environment is empty or invalid', async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

      const { middleware } = await import('../../src/middleware');
      const { NextRequest } = await import('next/server');

      const req = new NextRequest('http://localhost:3000/');
      const res = await middleware(req);
      expect(res.status).toBe(200);
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    }
  });
});

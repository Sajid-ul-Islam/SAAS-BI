import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { extractTenantIdFromJwtClaims } from '@/lib/auth-utils';

export const DEFAULT_DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Derives the active tenant ID for server components.
 * Checks session JWT claims first; falls back to demo tenant for local preview and testing.
 */
export async function resolveActiveTenantId(): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const tenantId = extractTenantIdFromJwtClaims(user);
      if (tenantId) return tenantId;
    }
  } catch {
    // Edge/SSR fallback
  }

  // Find demo tenant from database if available
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ slug: 'dhaka-fashion-hub' }, { status: 'active' }],
      },
      select: { id: true },
    });

    if (tenant) return tenant.id;
  } catch {
    // DB not connected or empty
  }

  return DEFAULT_DEMO_TENANT_ID;
}

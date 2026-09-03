import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { extractTenantIdFromJwtClaims } from '@/modules/tenants/tenants.service';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let tenantData = {
    id: 'demo-tenant-id',
    name: 'Dhaka Fashion Hub',
    slug: 'dhaka-fashion-hub',
    role: 'OWNER',
  };

  let userData = {
    name: 'Rahim Chowdhury',
    email: 'merchant@dhakafashion.com',
  };

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userData = {
        name: (user.user_metadata?.['name'] as string) ?? user.email?.split('@')[0] ?? 'Merchant',
        email: user.email ?? 'merchant@store.com',
      };

      const tenantId = extractTenantIdFromJwtClaims(user);
      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            users: {
              where: { supabaseUserId: user.id },
            },
          },
        });

        if (tenant) {
          tenantData = {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            role: tenant.users[0]?.role ?? 'OWNER',
          };
        }
      }
    }
  } catch {
    // Falls back gracefully to default demo tenant for local preview and testing
  }

  return (
    <DashboardShell tenant={tenantData} user={userData}>
      {children}
    </DashboardShell>
  );
}

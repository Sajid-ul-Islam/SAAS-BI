import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { PlanTier, SubscriptionStatus, TenantRole } from '@prisma/client';

const signupSchema = z.object({
  storeName: z.string().min(2).max(100),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { storeName, name, email, password } = validation.data;

    const supabase = await createServerSupabaseClient();

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          store_name: storeName,
        },
      },
    });

    if (authError || !authData.user) {
      logger.error('Supabase auth signup failed', authError);
      return NextResponse.json(
        { error: authError?.message ?? 'Failed to register account' },
        { status: 400 }
      );
    }

    const supabaseUserId = authData.user.id;
    const slug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Math.random().toString(36).substring(2, 6)}`;

    // 2. Transactionally create Tenant, User, and default Free Subscription
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: storeName,
          slug,
          status: 'active',
          subscriptions: {
            create: {
              planTier: PlanTier.FREE,
              status: SubscriptionStatus.ACTIVE,
              monthlyOrderLimit: 200,
              dailyAiTokenLimit: 100000,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          supabaseUserId,
          email,
          name,
          role: TenantRole.OWNER,
        },
      });

      return { tenant, user };
    });

    logger.info('New merchant registered successfully', {
      tenantId: result.tenant.id,
      userId: result.user.id,
      email,
    });

    return NextResponse.json({
      success: true,
      tenantId: result.tenant.id,
    });
  } catch (error) {
    logger.error('Signup transaction failed', error);
    return NextResponse.json(
      { error: 'An unexpected internal error occurred during registration' },
      { status: 500 }
    );
  }
}

import React from 'react';
import Link from 'next/link';
import { billingService } from '@/modules/billing/billing.service';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { prisma } from '@/lib/prisma';
import { PlanCards } from '@/components/billing/PlanCards';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SettingsPageProps {
  searchParams: Promise<{
    payment?: string;
    tier?: string;
  }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const resolvedParams = await searchParams;
  const tenantId = await resolveActiveTenantId();

  const [subInfo, tenant] = await Promise.all([
    billingService.getSubscriptionInfo(tenantId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        stores: true,
        courierCredentials: true,
        users: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings & Subscription Billing
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage workspace limits, connected stores, team roles, and SSLCommerz plan tiers
        </p>
      </div>

      {/* Payment Feedback Banners */}
      {resolvedParams.payment === 'success' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Payment Verified via SSLCommerz!</p>
            <p className="mt-0.5">
              Your subscription has been upgraded to {resolvedParams.tier || 'Pro'}. Monthly order limits and AI token quotas are now active.
            </p>
          </div>
        </div>
      )}

      {resolvedParams.payment === 'failed' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold">Payment could not be completed.</p>
            <p className="mt-0.5">
              SSLCommerz reported a failed transaction. No charges were made to your account.
            </p>
          </div>
        </div>
      )}

      {/* Workspace & Quotas Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-indigo-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{tenant?.name ?? 'My Merchant Store'}</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {tenantId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
              {subInfo.tier} Tier
            </span>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Onboarding Setup
            </Link>
          </div>
        </div>

        {/* Quotas Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <p className="text-slate-500">Monthly Order Limit</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {subInfo.monthlyOrderLimit.toLocaleString()} Orders / mo
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <p className="text-slate-500">Connected Platforms</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {tenant?.stores.length ?? 0} Stores &bull; {tenant?.courierCredentials.length ?? 0} Couriers
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
            <p className="text-slate-500">Daily AI Token Cap</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {subInfo.dailyAiTokenLimit.toLocaleString()} Tokens / day
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Plans with SSLCommerz */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Subscription Tiers & Upgrades</h3>
          <p className="text-xs text-slate-500">
            Transparent pricing in Bangladeshi Taka (৳) with SSLCommerz payment integration
          </p>
        </div>

        <PlanCards currentTier={subInfo.tier} />
      </div>
    </div>
  );
}

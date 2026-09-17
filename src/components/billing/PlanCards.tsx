'use client';

import React, { useState } from 'react';
import { Check, ShieldCheck, CreditCard } from 'lucide-react';
import { PlanTier } from '@prisma/client';
import { PLAN_CONFIG } from '@/modules/billing/billing.service';
import { formatBDT } from '@/shared/utils/currency';

interface PlanCardsProps {
  currentTier: PlanTier;
}

export function PlanCards({ currentTier }: PlanCardsProps) {
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tier: PlanTier) => {
    if (tier === currentTier || tier === PlanTier.FREE) return;
    setLoadingTier(tier);
    setError(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: tier, billingCycle: 'monthly' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to initiate checkout.');
        return;
      }

      if (data.data?.gatewayUrl) {
        window.location.href = data.data.gatewayUrl;
      }
    } catch {
      setError('Network error while contacting payment gateway.');
    } finally {
      setLoadingTier(null);
    }
  };

  const plans = [
    {
      tier: PlanTier.FREE,
      name: 'Starter Tier',
      badge: 'Free Forever',
      priceBDT: 0,
      limits: PLAN_CONFIG[PlanTier.FREE],
      features: [
        'Up to 200 orders / month',
        '1 connected store (Woo or Shopify)',
        '100K daily AI tokens (cached)',
        'Pathao & Steadfast webhooks',
        'Standard BDT KPI dashboards',
      ],
    },
    {
      tier: PlanTier.PRO,
      name: 'Pro Merchant',
      badge: 'Most Popular',
      priceBDT: PLAN_CONFIG[PlanTier.PRO].priceBDT,
      limits: PLAN_CONFIG[PlanTier.PRO],
      isPopular: true,
      features: [
        'Up to 2,000 orders / month',
        'Up to 3 connected stores',
        '250K daily AI tokens (cached)',
        'Live courier webhooks (all 3 couriers)',
        'Automated anomaly detection cron',
        'Weekly sales velocity forecasting',
      ],
    },
    {
      tier: PlanTier.BUSINESS,
      name: 'Business Enterprise',
      badge: 'High Volume',
      priceBDT: PLAN_CONFIG[PlanTier.BUSINESS].priceBDT,
      limits: PLAN_CONFIG[PlanTier.BUSINESS],
      features: [
        'Up to 10,000 orders / month',
        'Up to 10 connected stores',
        '1,000,000 daily AI tokens',
        'Priority hourly courier status polling',
        'Custom SMS & notification webhooks',
        'Dedicated onboarding support in BD',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isCurrent = p.tier === currentTier;
          const isLoading = loadingTier === p.tier;

          return (
            <div
              key={p.tier}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition bg-white ${
                p.isPopular
                  ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/10'
                  : 'border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      p.isPopular
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {p.priceBDT === 0 ? '৳0' : formatBDT(p.priceBDT)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium"> / month</span>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <div className="rounded-xl bg-slate-100 py-2.5 text-center text-xs font-bold text-slate-700 border border-slate-200">
                    Current Active Plan
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(p.tier)}
                    disabled={isLoading || p.tier === PlanTier.FREE}
                    className={`w-full rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                      p.isPopular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <span>Redirecting to SSLCommerz...</span>
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5" /> Upgrade with SSLCommerz
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>
            Payments secured by <strong>SSLCommerz</strong> (Bangladesh Bank approved).
            Supports bKash, Nagad, Rocket, Upay, Visa, and Mastercard.
          </span>
        </div>
      </div>
    </div>
  );
}

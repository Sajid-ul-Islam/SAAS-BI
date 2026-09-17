import React, { Suspense } from 'react';
import { analyticsService } from '@/modules/analytics/analytics.service';
import { AnalyticsTimeframeOption } from '@/modules/analytics/analytics.types';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { KpiCardsGrid } from '@/components/analytics/KpiCardsGrid';
import { TimeframeSwitcher } from '@/components/analytics/TimeframeSwitcher';
import { DailySalesTrendChart } from '@/components/charts/DailySalesTrendChart';
import { CourierPerformanceChart } from '@/components/charts/CourierPerformanceChart';
import { RegionalDistributionChart } from '@/components/charts/RegionalDistributionChart';
import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AnalyticsPageProps {
  searchParams: Promise<{
    timeframe?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const resolvedParams = await searchParams;
  const tenantId = await resolveActiveTenantId();

  const timeframeOption = (resolvedParams.timeframe as AnalyticsTimeframeOption) || '30d';

  const [kpis, salesTrend, courierPerformance, regionalDistribution] = await Promise.all([
    analyticsService.getDashboardKpis(tenantId, timeframeOption),
    analyticsService.getDailySalesTrend(tenantId, timeframeOption),
    analyticsService.getCourierPerformance(tenantId, timeframeOption),
    analyticsService.getRegionalDistribution(tenantId, timeframeOption),
  ]);

  return (
    <div className="space-y-6">
      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Business Intelligence & Analytics
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <BarChart3 className="h-3.5 w-3.5" /> SQL-First Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment KPIs, BDT revenue tracking, and courier performance across Bangladesh
          </p>
        </div>

        <Suspense fallback={<div className="h-9 w-64 bg-slate-100 rounded-xl animate-pulse" />}>
          <TimeframeSwitcher />
        </Suspense>
      </div>

      {/* Core SQL KPI Cards Grid */}
      <KpiCardsGrid kpis={kpis} />

      {/* Charts Grid: Daily Trend & Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailySalesTrendChart data={salesTrend} />
        </div>
        <div className="lg:col-span-1">
          <RegionalDistributionChart data={regionalDistribution} />
        </div>
      </div>

      {/* Courier Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CourierPerformanceChart data={courierPerformance} />
        </div>

        {/* Operational Highlights Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Logistics Intelligence Summary</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Standard KPIs are computed directly via PostgreSQL aggregated queries.
              No LLM tokens were consumed to generate this financial and courier breakdown.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">COD Settlement Security</p>
                  <p className="text-slate-500">
                    {kpis.codConversionRatePercentage}% of gross Cash on Delivery remittances have settled cleanly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">RTO Risk Management</p>
                  <p className="text-slate-500">
                    Return to origin rate is currently at {kpis.returnRatePercentage}%. Orders outside Dhaka have priority status polling enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Deterministic PostgreSQL Aggregates</span>
            <span className="font-mono">Supabase RLS Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}

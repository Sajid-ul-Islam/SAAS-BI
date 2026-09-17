import React from 'react';
import {
  Banknote,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Truck,
} from 'lucide-react';
import { formatBDT } from '@/shared/utils/currency';
import { KpiMetrics } from '@/modules/analytics/analytics.types';

interface KpiCardsGridProps {
  kpis: KpiMetrics;
}

export function KpiCardsGrid({ kpis }: KpiCardsGridProps) {
  const cards = [
    {
      title: 'Total Gross Revenue',
      value: formatBDT(kpis.totalRevenueBDT),
      compact: formatBDT(kpis.totalRevenueBDT, { compact: true }),
      subtitle: `${kpis.totalOrders} total orders processed`,
      change: kpis.revenueGrowthPercentage ? `+${kpis.revenueGrowthPercentage}% vs prev period` : undefined,
      icon: Banknote,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Average Order Value (AOV)',
      value: formatBDT(kpis.averageOrderValueBDT),
      compact: formatBDT(kpis.averageOrderValueBDT, { compact: true }),
      subtitle: 'Across all verified deliveries',
      change: 'Calculated via SQL aggregate',
      icon: ShoppingBag,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Delivery Success Rate',
      value: `${kpis.deliverySuccessRatePercentage}%`,
      compact: `${kpis.deliverySuccessRatePercentage}%`,
      subtitle: `${kpis.deliveredOrders} delivered of ${kpis.totalOrders} total`,
      change: 'Pathao, Steadfast, RedX',
      icon: PackageCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Return / RTO Rate',
      value: `${kpis.returnRatePercentage}%`,
      compact: `${kpis.returnRatePercentage}%`,
      subtitle: `${kpis.returnedOrders} returned / cancelled orders`,
      change: 'Target threshold: < 15%',
      icon: RotateCcw,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'COD Conversion Rate',
      value: `${kpis.codConversionRatePercentage}%`,
      compact: `${kpis.codConversionRatePercentage}%`,
      subtitle: `Collected: ${formatBDT(kpis.totalCodCollectedBDT, { compact: true })}`,
      change: 'Cash on delivery settlement',
      icon: CreditCard,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
    },
    {
      title: 'Pending COD Inflow',
      value: formatBDT(kpis.pendingCodBDT),
      compact: formatBDT(kpis.pendingCodBDT, { compact: true }),
      subtitle: 'Awaiting courier remittance',
      change: 'In-transit orders',
      icon: Truck,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.title}
              </p>
              <div className={`rounded-lg border p-2 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">({card.compact})</p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="text-slate-500">{card.subtitle}</span>
              {card.change && (
                <span className="flex items-center font-medium text-emerald-600">
                  <TrendingUp className="mr-1 h-3 w-3 inline" />
                  {card.change}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

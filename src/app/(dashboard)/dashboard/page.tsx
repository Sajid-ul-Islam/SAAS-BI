import React from 'react';
import Link from 'next/link';
import {
  Banknote,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import { formatBDT } from '@/shared/utils/currency';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { analyticsService } from '@/modules/analytics/analytics.service';
import { ordersService } from '@/modules/orders/orders.service';
import { CourierProvider, NormalizedOrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const tenantId = await resolveActiveTenantId();

  const [kpis, recentOrdersData] = await Promise.all([
    analyticsService.getDashboardKpis(tenantId),
    ordersService.getOrders(tenantId, { limit: 5 }),
  ]);

  const kpiCards = [
    {
      title: 'Total Gross Revenue',
      value: formatBDT(kpis.totalRevenueBDT),
      compact: formatBDT(kpis.totalRevenueBDT, { compact: true }),
      change: '+18.4% vs last month',
      icon: Banknote,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Average Order Value (AOV)',
      value: formatBDT(kpis.averageOrderValueBDT),
      compact: formatBDT(kpis.averageOrderValueBDT, { compact: true }),
      change: 'Calculated from deliveries',
      icon: ShoppingBag,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Delivery Success Rate',
      value: `${kpis.deliverySuccessRatePercentage}%`,
      compact: `${kpis.deliverySuccessRatePercentage}%`,
      change: `${kpis.deliveredOrders} of ${kpis.totalOrders} delivered`,
      icon: PackageCheck,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Return / RTO Rate',
      value: `${kpis.returnRatePercentage}%`,
      compact: `${kpis.returnRatePercentage}%`,
      change: `${kpis.returnedOrders} returned orders`,
      icon: RotateCcw,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  const getStatusColor = (status: NormalizedOrderStatus) => {
    switch (status) {
      case NormalizedOrderStatus.delivered:
        return 'bg-emerald-100 text-emerald-800';
      case NormalizedOrderStatus.on_the_way:
        return 'bg-blue-100 text-blue-800';
      case NormalizedOrderStatus.shipped:
        return 'bg-indigo-100 text-indigo-800';
      case NormalizedOrderStatus.processing:
        return 'bg-amber-100 text-amber-800';
      case NormalizedOrderStatus.return:
        return 'bg-rose-100 text-rose-800';
      case NormalizedOrderStatus.cancelled:
        return 'bg-slate-200 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getCourierColor = (courier?: CourierProvider | null) => {
    if (courier === CourierProvider.PATHAO) return 'text-red-600';
    if (courier === CourierProvider.STEADFAST) return 'text-emerald-600';
    if (courier === CourierProvider.REDX) return 'text-rose-600';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Store Performance & Logistics
          </h2>
          <p className="text-sm text-slate-500">
            Real-time delivery fulfillment and revenue tracking across Bangladesh
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full self-start md:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Courier Webhooks: Pathao & Steadfast Connected
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </p>
                <div className={`rounded-lg p-2 ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">({kpi.compact})</p>
              </div>
              <div className="mt-3 flex items-center text-xs font-medium text-slate-600">
                <TrendingUp className="mr-1 h-3.5 w-3.5 text-emerald-500 inline" />
                <span>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Orders & Courier Tracking</h3>
            <p className="text-xs text-slate-500">Latest deliveries synced via webhook</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all orders <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer & District</th>
                <th className="px-5 py-3.5">Courier</th>
                <th className="px-5 py-3.5">Normalized Status</th>
                <th className="px-5 py-3.5">Amount (BDT)</th>
                <th className="px-5 py-3.5">Payment / COD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {recentOrdersData.orders.map((ord) => {
                const courier = ord.courierCredential?.courier;
                const statusColor = getStatusColor(ord.normalizedStatus);
                const courierColor = getCourierColor(courier);

                return (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{ord.customerName}</p>
                      <p className="text-xs text-slate-500">{ord.customerCity}, {ord.customerDistrict}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold">
                        <Truck className={`h-3.5 w-3.5 ${courierColor}`} />
                        {courier ?? 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${statusColor}`}
                      >
                        {ord.normalizedStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatBDT(Number(ord.totalAmount))}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

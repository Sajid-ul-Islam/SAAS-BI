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

export default function DashboardOverviewPage() {
  const kpis = [
    {
      title: 'Total Gross Revenue',
      value: formatBDT(2458000),
      compact: formatBDT(2458000, { compact: true }),
      change: '+18.4% vs last month',
      icon: Banknote,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Average Order Value (AOV)',
      value: formatBDT(2850),
      compact: formatBDT(2850, { compact: true }),
      change: '+4.2% in Dhaka zone',
      icon: ShoppingBag,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Delivery Success Rate',
      value: '84.6%',
      compact: '84.6%',
      change: 'Pathao: 88% | Steadfast: 82%',
      icon: PackageCheck,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Return / Return to Origin (RTO)',
      value: '11.8%',
      compact: '11.8%',
      change: '-2.1% lower than market avg',
      icon: RotateCcw,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  const recentOrders = [
    {
      id: 'WOO-1001',
      orderNumber: '#DF-1001',
      customer: 'Tanvir Hasan',
      location: 'Dhanmondi, Dhaka',
      courier: 'Pathao',
      status: 'delivered',
      statusColor: 'bg-emerald-100 text-emerald-800',
      amount: 3450,
      cod: 'Paid',
    },
    {
      id: 'WOO-1002',
      orderNumber: '#DF-1002',
      customer: 'Sadia Islam',
      location: 'Nasirabad, Chittagong',
      courier: 'Steadfast',
      status: 'on_the_way',
      statusColor: 'bg-blue-100 text-blue-800',
      amount: 5200,
      cod: 'Pending (COD)',
    },
    {
      id: 'WOO-1003',
      orderNumber: '#DF-1003',
      customer: 'Kamal Ahmed',
      location: 'Zindabazar, Sylhet',
      courier: 'Steadfast',
      status: 'return',
      statusColor: 'bg-rose-100 text-rose-800',
      amount: 1850,
      cod: 'Failed / Return',
    },
    {
      id: 'WOO-1004',
      orderNumber: '#DF-1004',
      customer: 'Nusrat Jahan',
      location: 'Uttara Sector 11, Dhaka',
      courier: 'Pathao',
      status: 'delivered',
      statusColor: 'bg-emerald-100 text-emerald-800',
      amount: 7600,
      cod: 'Paid (bKash)',
    },
  ];

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
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Orders & Courier Tracking</h3>
            <p className="text-xs text-slate-500">Latest deliveries synced via webhook</p>
          </div>
          <a
            href="/dashboard/orders"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all orders <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Customer & City</th>
                <th className="px-5 py-3.5">Courier</th>
                <th className="px-5 py-3.5">Normalized Status</th>
                <th className="px-5 py-3.5">Amount (BDT)</th>
                <th className="px-5 py-3.5">Payment / COD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {ord.orderNumber}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">{ord.customer}</p>
                    <p className="text-xs text-slate-500">{ord.location}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                      <Truck className="h-3.5 w-3.5 text-slate-400" />
                      {ord.courier}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${ord.statusColor}`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {formatBDT(ord.amount)}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-slate-600">
                    {ord.cod}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatBDT } from '@/shared/utils/currency';
import { DailySalesMetric } from '@/modules/analytics/analytics.types';
import { TrendingUp } from 'lucide-react';

interface DailySalesTrendChartProps {
  data: DailySalesMetric[];
}

export function DailySalesTrendChart({ data }: DailySalesTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        No sales data recorded for this timeframe
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Gross Sales & Volume Trend</h3>
          <p className="text-xs text-slate-500">Daily gross revenue in Bangladeshi Taka (৳)</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Real-time Sync</span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => {
                if (val >= 100000) return `৳${(val / 100000).toFixed(1)}L`;
                if (val >= 1000) return `৳${(val / 1000).toFixed(0)}k`;
                return `৳${val}`;
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const metric = payload[0]?.payload as DailySalesMetric;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                    <p className="font-bold text-slate-800">{label}</p>
                    <p className="text-indigo-600 font-semibold">
                      Revenue: {formatBDT(metric.revenueBDT)}
                    </p>
                    <p className="text-slate-500">
                      Total Orders: <span className="font-medium text-slate-800">{metric.orderCount}</span>
                    </p>
                    <p className="text-emerald-600">
                      Delivered: <span className="font-medium text-slate-800">{metric.deliveredCount}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="revenueBDT"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

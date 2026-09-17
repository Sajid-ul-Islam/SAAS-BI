'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CourierPerformanceMetric } from '@/modules/analytics/analytics.types';
import { Truck } from 'lucide-react';

interface CourierPerformanceChartProps {
  data: CourierPerformanceMetric[];
}

export function CourierPerformanceChart({ data }: CourierPerformanceChartProps) {
  const hasOrders = data.some((d) => d.totalOrders > 0);

  if (!hasOrders) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        No courier deliveries assigned yet
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Courier Performance Comparison</h3>
          <p className="text-xs text-slate-500">Delivery vs Return Rate for Pathao, Steadfast & RedX</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Truck className="h-3.5 w-3.5" />
          <span>Fulfillment Benchmarks</span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="courier"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0]?.payload as CourierPerformanceMetric;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                    <p className="font-bold text-slate-800">{label}</p>
                    <p className="text-slate-500">
                      Total Consignments: <span className="font-semibold text-slate-900">{item.totalOrders}</span>
                    </p>
                    <p className="text-emerald-600 font-medium">
                      Delivery Rate: {item.deliveryRatePercentage}% ({item.deliveredCount} delivered)
                    </p>
                    <p className="text-rose-600 font-medium">
                      Return (RTO) Rate: {item.returnRatePercentage}% ({item.returnedCount} returned)
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="deliveryRatePercentage"
              name="Delivery Rate (%)"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="returnRatePercentage"
              name="Return Rate (%)"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

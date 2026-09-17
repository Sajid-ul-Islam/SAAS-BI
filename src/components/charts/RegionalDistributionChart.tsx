'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RegionalDistributionMetric } from '@/modules/analytics/analytics.types';
import { formatBDT } from '@/shared/utils/currency';
import { MapPin } from 'lucide-react';

interface RegionalDistributionChartProps {
  data: RegionalDistributionMetric[];
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

export function RegionalDistributionChart({ data }: RegionalDistributionChartProps) {
  const filtered = data.filter((d) => d.orderCount > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        No regional sales distribution recorded yet
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Regional Distribution</h3>
          <p className="text-xs text-slate-500">Dhaka vs Outside Dhaka sales penetration</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>Bangladesh Geography</span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered}
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="orderCount"
              nameKey="region"
            >
              {filtered.map((entry, index) => (
                <Cell key={`cell-${entry.region}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0]?.payload as RegionalDistributionMetric;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                    <p className="font-bold text-slate-800">{item.region}</p>
                    <p className="text-slate-600">
                      Orders: <span className="font-semibold text-slate-900">{item.orderCount}</span> ({item.percentage}%)
                    </p>
                    <p className="text-indigo-600 font-medium">
                      Revenue: {formatBDT(item.revenueBDT)}
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

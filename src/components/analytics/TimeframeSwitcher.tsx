'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { AnalyticsTimeframeOption } from '@/modules/analytics/analytics.types';

const TIMEFRAMES: { key: AnalyticsTimeframeOption; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: '1y', label: 'Last 1 Year' },
  { key: 'all', label: 'All Time' },
];

export function TimeframeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentTimeframe = (searchParams.get('timeframe') as AnalyticsTimeframeOption) || '30d';

  const handleSelect = (tf: AnalyticsTimeframeOption) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tf === '30d') {
      params.delete('timeframe');
    } else {
      params.set('timeframe', tf);
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
      <div className="flex items-center gap-1 px-2 text-xs text-slate-400 font-medium">
        <Calendar className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Timeframe:</span>
      </div>
      {TIMEFRAMES.map(({ key, label }) => {
        const isActive = currentTimeframe === key;
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            disabled={isPending}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

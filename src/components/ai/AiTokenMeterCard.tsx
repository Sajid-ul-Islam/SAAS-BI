import React from 'react';
import { Cpu, Zap, Shield } from 'lucide-react';
import { AiUsageStatus } from '@/modules/ai/ai.types';

interface AiTokenMeterCardProps {
  usage: AiUsageStatus;
}

export function AiTokenMeterCard({ usage }: AiTokenMeterCardProps) {
  const percentage = Math.min(
    100,
    Math.round((usage.tokensUsedToday / usage.dailyTokenLimit) * 100)
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-2 text-indigo-600">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Cost Discipline & Token Quota</h3>
            <p className="text-xs text-slate-500">Per-tenant daily metering with prompt hashing</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <Shield className="h-3 w-3" /> Hard Cap Active
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="font-semibold text-slate-700">
            {usage.tokensUsedToday.toLocaleString()} / {usage.dailyTokenLimit.toLocaleString()} Tokens
          </span>
          <span className="font-bold text-indigo-600">{percentage}% Consumed</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentage > 85
                ? 'bg-rose-500'
                : percentage > 60
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Metric Badges */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-center">
        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
          <p className="text-[11px] text-slate-500">Remaining Today</p>
          <p className="text-sm font-bold text-slate-900">
            {usage.remainingTokens.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
          <p className="text-[11px] text-slate-500">Queries Processed</p>
          <p className="text-sm font-bold text-slate-900">{usage.queryCountToday}</p>
        </div>
        <div className="rounded-lg bg-indigo-50/50 p-2 border border-indigo-100">
          <p className="text-[11px] text-indigo-600 font-medium flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" /> Cache Hit Rate
          </p>
          <p className="text-sm font-bold text-indigo-900">
            {usage.cacheHitRatePercentage ?? 0}%
          </p>
        </div>
      </div>
    </div>
  );
}

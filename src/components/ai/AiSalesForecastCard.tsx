import React from 'react';
import { Calendar, TrendingUp, Banknote, ShoppingCart } from 'lucide-react';
import { formatBDT } from '@/shared/utils/currency';
import { AiSalesForecast } from '@/modules/ai/ai.types';

interface AiSalesForecastCardProps {
  forecast: AiSalesForecast;
}

export function AiSalesForecastCard({ forecast }: AiSalesForecastCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Weekly Sales Velocity Forecast</h3>
          <p className="text-xs text-slate-500">Predictive demand model weighted for Bangladesh shopping habits</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+{forecast.growthRatePercentage}% Projected Velocity</span>
        </div>
      </div>

      {/* Overview Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-slate-100 py-3">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5 text-emerald-600" /> 7-Day Projected Revenue
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {formatBDT(forecast.projectedTotalRevenueBDT)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5 text-indigo-600" /> Projected Orders
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {forecast.projectedTotalOrders} Parcels
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-blue-600" /> Estimated COD Inflow
          </p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {formatBDT(forecast.projectedTotalCodBDT)}
          </p>
        </div>
      </div>

      {/* Daily Breakdown Stepper/Pills */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Daily Trajectory Breakdown
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {forecast.days.map((day) => (
            <div
              key={day.date}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-center transition hover:bg-indigo-50/50 hover:border-indigo-200"
            >
              <p className="text-xs font-bold text-slate-800">{day.dayName}</p>
              <p className="text-[10px] text-slate-400">{day.date.slice(5)}</p>
              <p className="text-xs font-bold text-indigo-600 mt-1.5">
                {formatBDT(day.projectedRevenueBDT, { compact: true })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{day.projectedOrderCount} orders</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

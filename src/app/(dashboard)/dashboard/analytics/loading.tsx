import React from 'react';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-slate-200 rounded-md" />
          <div className="h-4 w-96 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-60 bg-slate-200 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-white border border-slate-200 p-5 space-y-3">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-7 w-32 bg-slate-300 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 rounded-xl bg-white border border-slate-200" />
        <div className="lg:col-span-1 h-72 rounded-xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}

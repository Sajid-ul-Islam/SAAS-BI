import React from 'react';

export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 rounded-md" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
      </div>

      <div className="h-28 rounded-xl bg-white border border-slate-200 p-4" />

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        {[1, 2, 3, 4, 6, 7].map((i) => (
          <div key={i} className="h-12 w-full bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

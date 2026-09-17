'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, RotateCcw, Truck, MapPin, Calendar, Download } from 'lucide-react';
import { BANGLADESH_DISTRICTS } from '@/modules/orders/orders.types';
import { CourierProvider, NormalizedOrderStatus } from '@prisma/client';

export function OrdersFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get('status') ?? 'ALL';
  const currentCourier = searchParams.get('courier') ?? 'ALL';
  const currentDistrict = searchParams.get('district') ?? 'ALL';
  const currentSearch = searchParams.get('search') ?? '';
  const currentTimeframe = searchParams.get('timeframe') ?? 'all';

  const [searchInput, setSearchInput] = React.useState(currentSearch);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL' && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 when filters change
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearchInput('');
    startTransition(() => {
      router.push(pathname);
    });
  };

  const isFiltered =
    currentStatus !== 'ALL' ||
    currentCourier !== 'ALL' ||
    currentDistrict !== 'ALL' ||
    Boolean(currentSearch) ||
    (currentTimeframe && currentTimeframe !== 'all');

  const statusTabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: NormalizedOrderStatus.processing, label: 'Processing' },
    { key: NormalizedOrderStatus.shipped, label: 'Shipped' },
    { key: NormalizedOrderStatus.on_the_way, label: 'On The Way' },
    { key: NormalizedOrderStatus.delivered, label: 'Delivered' },
    { key: NormalizedOrderStatus.return, label: 'Returned (RTO)' },
    { key: NormalizedOrderStatus.cancelled, label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Top Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 no-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => updateParam('status', tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Row: Search, Courier, District, Timeframe */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order #, customer, phone (017...), tracking ID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-20 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('search', '');
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 transition"
          >
            Search
          </button>
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Courier Selector */}
          <div className="relative flex items-center">
            <Truck className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={currentCourier}
              onChange={(e) => updateParam('courier', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Couriers</option>
              <option value={CourierProvider.PATHAO}>Pathao</option>
              <option value={CourierProvider.STEADFAST}>Steadfast</option>
              <option value={CourierProvider.REDX}>RedX</option>
            </select>
          </div>

          {/* District Selector */}
          <div className="relative flex items-center">
            <MapPin className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={currentDistrict}
              onChange={(e) => updateParam('district', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All 64 Districts</option>
              {BANGLADESH_DISTRICTS.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selector */}
          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <select
              value={currentTimeframe}
              onChange={(e) => updateParam('timeframe', e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Export CSV */}
          <a
            href={`/api/orders/export?${searchParams.toString()}`}
            download
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Download filtered orders as CSV for Excel"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </a>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              disabled={isPending}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


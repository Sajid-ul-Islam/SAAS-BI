import React, { Suspense } from 'react';
import { ordersService } from '@/modules/orders/orders.service';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { OrdersFilterBar } from '@/components/orders/OrdersFilterBar';
import { OrdersViewClient } from '@/components/orders/OrdersViewClient';
import { OrdersPagination } from '@/components/orders/OrdersPagination';
import { NormalizedOrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    courier?: string;
    district?: string;
    search?: string;
    timeframe?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedParams = await searchParams;
  const tenantId = await resolveActiveTenantId();

  const page = Math.max(1, parseInt(resolvedParams.page ?? '1', 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(resolvedParams.limit ?? '20', 10) || 20), 100);

  const filterStatus =
    resolvedParams.status &&
    resolvedParams.status !== 'ALL' &&
    Object.values(NormalizedOrderStatus).includes(resolvedParams.status as NormalizedOrderStatus)
      ? (resolvedParams.status as NormalizedOrderStatus)
      : undefined;

  const filterCourier =
    resolvedParams.courier && resolvedParams.courier !== 'ALL'
      ? resolvedParams.courier
      : undefined;

  const filterDistrict =
    resolvedParams.district && resolvedParams.district !== 'ALL'
      ? resolvedParams.district
      : undefined;

  const filterSearch = resolvedParams.search?.trim() || undefined;
  const filterTimeframe = (resolvedParams.timeframe as '7d' | '30d' | '90d' | 'all') || undefined;

  const data = await ordersService.getOrders(tenantId, {
    page,
    limit,
    status: filterStatus,
    courier: filterCourier,
    district: filterDistrict,
    search: filterSearch,
    timeframe: filterTimeframe,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Orders & Courier Tracking
            </h2>
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              {data.total} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified logistics status normalizer for Pathao, Steadfast, and RedX across Bangladesh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Webhook Sync
          </div>
        </div>
      </div>

      {/* Filter Bar with Suspense for SearchParams */}
      <Suspense fallback={<div className="h-24 rounded-xl bg-slate-100 animate-pulse" />}>
        <OrdersFilterBar />
      </Suspense>

      {/* Interactive Orders Table & Drawer */}
      <OrdersViewClient orders={data.orders} />

      {/* Pagination Controls */}
      <Suspense fallback={null}>
        <OrdersPagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={data.limit}
        />
      </Suspense>
    </div>
  );
}

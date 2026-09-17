'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export function OrdersPagination({ page, totalPages, total, limit }: OrdersPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs text-xs text-slate-600">
      <div>
        Showing <span className="font-bold text-slate-900">{startRecord}</span> to{' '}
        <span className="font-bold text-slate-900">{endRecord}</span> of{' '}
        <span className="font-bold text-slate-900">{total}</span> total orders
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <div className="flex items-center gap-1 px-2 font-medium">
          Page <span className="font-bold text-slate-900">{page}</span> of{' '}
          <span className="font-bold text-slate-900">{Math.max(1, totalPages)}</span>
        </div>

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages || isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

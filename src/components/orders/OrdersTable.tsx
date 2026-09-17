'use client';

import React from 'react';
import { Truck, Package, ArrowRight } from 'lucide-react';
import { formatBDT } from '@/shared/utils/currency';
import { OrderWithRelations } from '@/modules/orders/orders.types';
import { CourierProvider, NormalizedOrderStatus } from '@prisma/client';

interface OrdersTableProps {
  orders: OrderWithRelations[];
  onSelectOrder: (order: OrderWithRelations) => void;
}

export function OrdersTable({ orders, onSelectOrder }: OrdersTableProps) {
  const getStatusBadge = (status: NormalizedOrderStatus) => {
    switch (status) {
      case NormalizedOrderStatus.delivered:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case NormalizedOrderStatus.on_the_way:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case NormalizedOrderStatus.shipped:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case NormalizedOrderStatus.processing:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case NormalizedOrderStatus.return:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case NormalizedOrderStatus.cancelled:
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCourierColor = (courier?: CourierProvider | null) => {
    if (courier === CourierProvider.PATHAO) return 'bg-red-50 text-red-700 border-red-200';
    if (courier === CourierProvider.STEADFAST) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (courier === CourierProvider.REDX) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
        <Package className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">No matching orders found</h3>
        <p className="mt-1 text-xs text-slate-500">
          Try adjusting your search terms, status tabs, courier, or district filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Order & Store</th>
              <th className="px-5 py-3.5">Customer & District</th>
              <th className="px-5 py-3.5">Logistics / Courier</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Total Amount</th>
              <th className="px-5 py-3.5">Payment / COD</th>
              <th className="px-5 py-3.5">Ordered At</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((ord) => {
              const statusClass = getStatusBadge(ord.normalizedStatus);
              const courier = ord.courierCredential?.courier;
              const courierBadgeClass = getCourierColor(courier);

              return (
                <tr
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  {/* Order & Store */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {ord.orderNumber}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {ord.store?.name ?? 'Store'}
                    </div>
                  </td>

                  {/* Customer & District */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{ord.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{ord.customerPhone}</div>
                    <div className="text-[10px] text-slate-400">
                      {ord.customerCity}, <span className="font-semibold text-slate-600">{ord.customerDistrict}</span>
                    </div>
                  </td>

                  {/* Courier & Tracking */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-1">
                      {courier ? (
                        <span
                          className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold border ${courierBadgeClass}`}
                        >
                          <Truck className="h-3 w-3" />
                          {courier}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                      )}
                      {ord.trackingCode && (
                        <span className="font-mono text-[10px] text-slate-500 tracking-tight">
                          {ord.trackingCode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Normalized Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${statusClass}`}
                    >
                      {ord.normalizedStatus.replace(/_/g, ' ')}
                    </span>
                    {ord.rawCourierStatus && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                        {ord.rawCourierStatus}
                      </p>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">
                      {formatBDT(Number(ord.totalAmount))}
                    </div>
                    {Number(ord.deliveryFee) > 0 && (
                      <div className="text-[10px] text-slate-400">
                        Fee: {formatBDT(Number(ord.deliveryFee))}
                      </div>
                    )}
                  </td>

                  {/* Payment / COD */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ord.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.paymentStatus.toUpperCase()}
                    </span>
                    {Number(ord.codAmount) > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        COD: {formatBDT(Number(ord.codAmount))}
                      </p>
                    )}
                  </td>

                  {/* Ordered At */}
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                    <div>
                      {new Date(ord.orderedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(ord.orderedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(ord);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-xs hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      Timeline <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

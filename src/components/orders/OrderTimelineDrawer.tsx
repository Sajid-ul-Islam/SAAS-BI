'use client';

import React, { useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  Phone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Copy,
  Check,
  Package,
  Send,
  Loader2,
} from 'lucide-react';
import { formatBDT } from '@/shared/utils/currency';
import { OrderWithRelations } from '@/modules/orders/orders.types';
import { CourierProvider, NormalizedOrderStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface OrderTimelineDrawerProps {
  order: OrderWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTimelineDrawer({ order, isOpen, onClose }: OrderTimelineDrawerProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [isDispatching, setIsDispatching] = React.useState(false);
  const [dispatchMsg, setDispatchMsg] = React.useState<string | null>(null);

  const handleDispatch = async (courier: 'PATHAO' | 'STEADFAST' | 'REDX') => {
    if (!order) return;
    setIsDispatching(true);
    setDispatchMsg(null);
    try {
      const res = await fetch('/api/orders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, courier }),
      });
      const data = await res.json();
      if (res.ok) {
        setDispatchMsg(data.message);
        router.refresh();
      } else {
        setDispatchMsg(data.error || 'Failed to dispatch');
      }
    } catch {
      setDispatchMsg('Network error while dispatching');
    } finally {
      setIsDispatching(false);
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const copyTracking = () => {
    if (!order.trackingCode) return;
    navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCourierTrackingUrl = (courier?: CourierProvider | null, trackingCode?: string | null) => {
    if (!trackingCode) return null;
    if (courier === CourierProvider.PATHAO) {
      return `https://merchant.pathao.com/tracking?consignment_id=${encodeURIComponent(trackingCode)}`;
    }
    if (courier === CourierProvider.STEADFAST) {
      return `https://steadfast.com.bd/t/${encodeURIComponent(trackingCode)}`;
    }
    if (courier === CourierProvider.REDX) {
      return `https://redx.com.bd/track-order?trackingId=${encodeURIComponent(trackingCode)}`;
    }
    return null;
  };

  const trackingUrl = getCourierTrackingUrl(order.courierCredential?.courier, order.trackingCode);

  const getStatusBadge = (status: NormalizedOrderStatus) => {
    switch (status) {
      case NormalizedOrderStatus.delivered:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          label: 'Delivered',
        };
      case NormalizedOrderStatus.on_the_way:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Truck,
          label: 'On The Way',
        };
      case NormalizedOrderStatus.shipped:
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Package,
          label: 'Shipped',
        };
      case NormalizedOrderStatus.processing:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: 'Processing',
        };
      case NormalizedOrderStatus.return:
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: RotateCcw,
          label: 'Returned (RTO)',
        };
      case NormalizedOrderStatus.cancelled:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: AlertCircle,
          label: 'Cancelled',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Clock,
          label: status,
        };
    }
  };

  const currentBadge = getStatusBadge(order.normalizedStatus);
  const CurrentIcon = currentBadge.icon;

  const timelineSteps = [
    { key: NormalizedOrderStatus.processing, label: 'Order Placed' },
    { key: NormalizedOrderStatus.shipped, label: 'Picked by Courier' },
    { key: NormalizedOrderStatus.on_the_way, label: 'In Transit' },
    {
      key: order.normalizedStatus === NormalizedOrderStatus.return
        ? NormalizedOrderStatus.return
        : order.normalizedStatus === NormalizedOrderStatus.cancelled
        ? NormalizedOrderStatus.cancelled
        : NormalizedOrderStatus.delivered,
      label:
        order.normalizedStatus === NormalizedOrderStatus.return
          ? 'Returned to Merchant'
          : order.normalizedStatus === NormalizedOrderStatus.cancelled
          ? 'Cancelled'
          : 'Delivered',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{order.orderNumber}</h3>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                {order.store?.name ?? 'Online Store'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              External ID: {order.externalOrderId} &bull; Ordered{' '}
              {new Date(order.orderedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Status Card */}
          <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg border ${currentBadge.bg}`}>
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Status</p>
                <p className="text-base font-bold text-slate-900">{currentBadge.label}</p>
                {order.rawCourierStatus && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Courier Status: <span className="font-mono font-medium text-slate-700">{order.rawCourierStatus}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Amount</p>
              <p className="text-lg font-bold text-slate-900">{formatBDT(Number(order.totalAmount))}</p>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Fulfillment Journey
            </p>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              {timelineSteps.map((step, idx) => {
                const isPassed =
                  step.key === order.normalizedStatus ||
                  (order.normalizedStatus === NormalizedOrderStatus.delivered && idx < 3) ||
                  (order.normalizedStatus === NormalizedOrderStatus.on_the_way && idx < 2) ||
                  (order.normalizedStatus === NormalizedOrderStatus.shipped && idx < 1);

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isPassed
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 mt-1.5 text-center max-w-[80px]">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier & Tracking Details */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Logistics Partner
              </h4>
              {order.courierCredential?.courier && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  <Truck className="h-3.5 w-3.5" />
                  {order.courierCredential.courier}
                </span>
              )}
            </div>

            {order.trackingCode ? (
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Tracking / Consignment ID</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{order.trackingCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyTracking}
                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition"
                    title="Copy tracking code"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline bg-white px-2.5 py-1.5 rounded border border-slate-200 shadow-xs"
                    >
                      Track <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-500">Ready to dispatch this parcel to a courier?</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDispatch('PATHAO')}
                    disabled={isDispatching}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {isDispatching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send via Pathao
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispatch('STEADFAST')}
                    disabled={isDispatching}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {isDispatching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send via Steadfast
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispatch('REDX')}
                    disabled={isDispatching}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition"
                  >
                    {isDispatching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Send via RedX
                  </button>
                </div>

                {dispatchMsg && (
                  <div className="rounded-lg bg-indigo-50 p-2.5 text-[11px] font-medium text-indigo-900 border border-indigo-200">
                    {dispatchMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer & Shipping */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Customer & Delivery Address
            </h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <p className="font-semibold text-slate-900">{order.customerName}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <a href={`tel:${order.customerPhone}`} className="hover:text-indigo-600 font-mono">
                  {order.customerPhone}
                </a>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  {order.customerAddress}, {order.customerCity}, <strong className="text-slate-800">{order.customerDistrict}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-white shadow-sm text-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Payment & COD Details
            </h4>
            <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
              <span>Subtotal & Items</span>
              <span className="font-semibold text-slate-900">
                {formatBDT(Number(order.totalAmount) - Number(order.deliveryFee))}
              </span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-900">{formatBDT(Number(order.deliveryFee))}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-600 border-b border-slate-100">
              <span>Cash on Delivery (COD) Amount</span>
              <span className="font-semibold text-slate-900">{formatBDT(Number(order.codAmount))}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold text-slate-900">
              <span>Grand Total</span>
              <span>{formatBDT(Number(order.totalAmount))}</span>
            </div>
          </div>

          {/* Audit Trail / Status History */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Change Audit Trail
            </h4>

            {order.statusHistory && order.statusHistory.length > 0 ? (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.statusHistory.map((hist) => (
                  <div key={hist.id} className="relative text-xs">
                    <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 uppercase tracking-wide">
                        {hist.previousStatus ? `${hist.previousStatus} → ` : ''}{hist.newStatus}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(hist.changedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {hist.rawCourierStatus && (
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Raw status: <span className="font-medium text-slate-700">{hist.rawCourierStatus}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] rounded bg-slate-100 text-slate-600 px-1.5 py-0.5">
                        Source: {hist.source}
                      </span>
                      {hist.note && <span className="text-[10px] text-slate-500 italic">{hist.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No intermediate transitions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300 transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

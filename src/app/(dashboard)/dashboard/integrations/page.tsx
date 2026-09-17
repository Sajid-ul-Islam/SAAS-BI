import React from 'react';
import Link from 'next/link';
import { integrationsService } from '@/modules/integrations/integrations.service';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import {
  ShoppingBag,
  Truck,
  PlusCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { CourierProvider } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const tenantId = await resolveActiveTenantId();

  const [stores, couriers] = await Promise.all([
    integrationsService.getTenantStores(tenantId),
    integrationsService.getTenantCouriers(tenantId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Store & Courier Integrations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect WooCommerce, Shopify, Pathao, Steadfast, and RedX with encrypted credentials
          </p>
        </div>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add Connection
        </Link>
      </div>

      {/* Security Banner */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
          <span>
            Credentials are encrypted using <strong>AES-256-GCM</strong> with unique initialization vectors before storage.
          </span>
        </div>
      </div>

      {/* Connected Stores Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">E-Commerce Stores</h3>
          <span className="text-xs text-slate-500">{stores.length} connected</span>
        </div>

        {stores.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
            No stores connected yet.{' '}
            <Link href="/onboarding" className="text-indigo-600 font-semibold underline">
              Connect WooCommerce or Shopify now &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stores.map((st) => (
              <div
                key={st.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                        <span className="text-[10px] font-bold uppercase text-indigo-600">
                          {st.platform}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-xs text-slate-600">
                    <p className="truncate font-mono text-[11px] text-slate-500">
                      {st.storeUrl}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sync Status: <span className="font-semibold text-slate-700">{st.syncStatus}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last Synced: {st.lastSyncedAt ? new Date(st.lastSyncedAt).toLocaleTimeString() : 'Recent'}
                  </span>
                  <a
                    href={st.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Open Store <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connected Couriers Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Courier Logistics Partners</h3>
          <span className="text-xs text-slate-500">{couriers.length} active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: CourierProvider.PATHAO, label: 'Pathao Courier', path: 'pathao' },
            { id: CourierProvider.STEADFAST, label: 'Steadfast Courier', path: 'steadfast' },
            { id: CourierProvider.REDX, label: 'RedX Delivery', path: 'redx' },
          ].map((c) => {
            const isConnected = couriers.some((co) => co.courier === c.id);

            return (
              <div
                key={c.id}
                className={`rounded-xl border p-5 shadow-xs flex flex-col justify-between ${
                  isConnected
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 bg-slate-50/50 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <Truck className="h-5 w-5" />
                    </div>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Zap className="h-3 w-3" /> Live Sync
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Not Connected
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-3">{c.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.id === CourierProvider.PATHAO
                      ? 'Dhaka next-day & parcel tracking'
                      : c.id === CourierProvider.STEADFAST
                      ? 'Sub-district nationwide COD'
                      : 'Parcel & reverse logistics'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Webhook Listener
                  </p>
                  <code className="mt-1 block truncate text-[10px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200 text-indigo-600">
                    /api/webhooks/{c.path}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

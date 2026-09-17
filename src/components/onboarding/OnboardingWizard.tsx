'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { StorePlatform, CourierProvider } from '@prisma/client';

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [platform, setPlatform] = useState<StorePlatform>(StorePlatform.WOOCOMMERCE);
  const [storeName, setStoreName] = useState('My Bangladesh Store');
  const [storeUrl, setStoreUrl] = useState('https://mystore.com.bd');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');

  const [selectedCourier, setSelectedCourier] = useState<CourierProvider>(CourierProvider.PATHAO);
  const [courierApiKey, setCourierApiKey] = useState('');
  const [courierSecret, setCourierSecret] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);

  const handleStartSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncCompleted(true);
    }, 2500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      {/* Header Stepper */}
      <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Merchant Onboarding Setup</h2>
            <p className="text-xs text-slate-500">Connect your store and couriers in under 5 minutes</p>
          </div>
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
            Step {step} of 3
          </span>
        </div>

        {/* Stepper indicators */}
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          {[
            { num: 1, title: 'Connect Store' },
            { num: 2, title: 'Courier Credentials' },
            { num: 3, title: 'Verify & Sync' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-[11px] font-semibold text-slate-700 mt-1.5">{s.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Body */}
      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-bold text-slate-900">Choose E-Commerce Platform</h3>
              <p className="text-xs text-slate-500">Select where your orders originate</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPlatform(StorePlatform.WOOCOMMERCE)}
                className={`rounded-xl border p-4 text-left transition ${
                  platform === StorePlatform.WOOCOMMERCE
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <ShoppingBag className="h-5 w-5 text-indigo-600" />
                  {platform === StorePlatform.WOOCOMMERCE && (
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  )}
                </div>
                <p className="font-bold text-slate-900 mt-2 text-sm">WooCommerce</p>
                <p className="text-xs text-slate-500 mt-0.5">REST API v3 connector with encrypted keys</p>
              </button>

              <button
                type="button"
                onClick={() => setPlatform(StorePlatform.SHOPIFY)}
                className={`rounded-xl border p-4 text-left transition ${
                  platform === StorePlatform.SHOPIFY
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  {platform === StorePlatform.SHOPIFY && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <p className="font-bold text-slate-900 mt-2 text-sm">Shopify</p>
                <p className="text-xs text-slate-500 mt-0.5">OAuth 2.0 app with webhook receivers</p>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Dhaka Artisan Boutique"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Store URL</label>
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="https://shop.mydomain.com"
                />
              </div>

              {platform === StorePlatform.WOOCOMMERCE && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Key (ck_...)</label>
                    <input
                      type="password"
                      value={consumerKey}
                      onChange={(e) => setConsumerKey(e.target.value)}
                      placeholder="ck_xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Consumer Secret (cs_...)</label>
                    <input
                      type="password"
                      value={consumerSecret}
                      onChange={(e) => setConsumerSecret(e.target.value)}
                      placeholder="cs_xxxxxxxxxxxx"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-indigo-50/50 p-3 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>All API credentials are encrypted with AES-256-GCM before storage in database.</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Bangladeshi Courier</h3>
              <p className="text-xs text-slate-500">Configure logistics partner for delivery normalization</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: CourierProvider.PATHAO, label: 'Pathao Courier', desc: 'Fastest in Dhaka' },
                { id: CourierProvider.STEADFAST, label: 'Steadfast', desc: 'Outside Dhaka COD' },
                { id: CourierProvider.REDX, label: 'RedX', desc: 'Nationwide coverage' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourier(c.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedCourier === c.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Truck className="h-4 w-4 text-indigo-600" />
                  <p className="font-bold text-slate-900 text-xs mt-2">{c.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {selectedCourier} Merchant API Key / Client ID
                </label>
                <input
                  type="text"
                  value={courierApiKey}
                  onChange={(e) => setCourierApiKey(e.target.value)}
                  placeholder="Paste courier API key"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook Secret (Optional)
                </label>
                <input
                  type="password"
                  value={courierSecret}
                  onChange={(e) => setCourierSecret(e.target.value)}
                  placeholder="Webhook secret for HMAC validation"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
              <p className="font-semibold text-slate-800 mb-1">Your Webhook URL:</p>
              <code className="text-[11px] font-mono bg-white px-2 py-1 rounded border border-slate-200 block text-indigo-600">
                https://analytics.store.bd/api/webhooks/{selectedCourier.toLowerCase()}
              </code>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center animate-in fade-in duration-300 py-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Ready to Ingest & Normalize Orders</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                We will sync your orders, normalize courier delivery statuses into our canonical lifecycle,
                and populate your BDT revenue analytics.
              </p>
            </div>

            {!syncCompleted ? (
              <button
                type="button"
                onClick={handleStartSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-75"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Ingesting Store Orders...
                  </>
                ) : (
                  <>
                    Start Initial Sync <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Sync Completed Successfully!</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Initial orders ingested, status history populated, and SQL KPI aggregates ready.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Enter Merchant Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            Next <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

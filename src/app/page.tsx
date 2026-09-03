import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Truck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 md:px-12">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <BarChart3 className="h-6 w-6" />
          <span>SaaS BI Bangladesh</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            For Bangladeshi E-commerce Merchants
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Real-Time Analytics for <span className="text-indigo-600">Pathao, Steadfast & RedX</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Connect WooCommerce and Shopify in minutes. Track COD cash flow, reduce return rates, and query your business data with AI insights.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Merchant Login
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 text-left">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <Truck className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg text-slate-900">Unified Courier Status</h3>
              <p className="mt-2 text-sm text-slate-600">
                Single canonical tracking state across Pathao, Steadfast, and RedX with automated webhooks.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <BarChart3 className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg text-slate-900">COD & Return Analytics</h3>
              <p className="mt-2 text-sm text-slate-600">
                Accurate BDT (৳) calculations for Cash on Delivery, delivery fees, and regional return ratios.
              </p>
            </div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="font-semibold text-lg text-slate-900">Enterprise Isolation</h3>
              <p className="mt-2 text-sm text-slate-600">
                Strict multi-tenant security backed by Supabase PostgreSQL Row Level Security (RLS).
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SaaS BI Bangladesh. Engineered for local e-commerce stores.
      </footer>
    </div>
  );
}

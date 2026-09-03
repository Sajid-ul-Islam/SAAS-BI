import React from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600">
          <BarChart3 className="h-8 w-8" />
          <span>SaaS BI Bangladesh</span>
        </Link>
        <p className="mt-2 text-sm text-slate-600">
          Bangladeshi E-commerce BI & Courier Tracking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md sm:rounded-xl sm:px-10 border border-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}

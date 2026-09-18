import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Compass className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">404 - Page Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            The page or resource you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
          >
            <Home className="h-3.5 w-3.5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

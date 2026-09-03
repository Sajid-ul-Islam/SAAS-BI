'use client';

import { useState } from 'react';
import { Store, ChevronDown, Check } from 'lucide-react';

interface TenantOption {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface TenantSwitcherProps {
  currentTenant: TenantOption;
  availableTenants?: TenantOption[];
}

export function TenantSwitcher({
  currentTenant,
  availableTenants = [],
}: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tenants = availableTenants.length > 0 ? availableTenants : [currentTenant];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
            <Store className="h-4 w-4" />
          </div>
          <div className="truncate">
            <p className="truncate font-semibold text-slate-900 leading-none">
              {currentTenant.name}
            </p>
            <p className="mt-1 text-xs text-slate-500 capitalize">{currentTenant.role.toLowerCase()}</p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400">
              Workspaces
            </div>
            {tenants.map((t) => {
              const isSelected = t.id === currentTenant.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 text-slate-800"
                >
                  <span className="truncate">{t.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

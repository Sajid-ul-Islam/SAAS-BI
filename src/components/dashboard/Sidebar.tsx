'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  PlugZap,
  Sparkles,
  Settings,
  X,
} from 'lucide-react';
import { TenantSwitcher } from './TenantSwitcher';
import { cn } from '@/shared/utils/cn';

interface SidebarProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders & Tracking', href: '/dashboard/orders', icon: Package },
  { label: 'Analytics & KPIs', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Store & Couriers', href: '/dashboard/integrations', icon: PlugZap },
  { label: 'AI Insights', href: '/dashboard/ai', icon: Sparkles },
  { label: 'Settings & Billing', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar({ tenant, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between border-r border-slate-200 bg-white">
      <div>
        {/* Workspace Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="w-full">
            <TenantSwitcher currentTenant={tenant} />
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="space-y-1 p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Analytics & Operations
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Status */}
      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Market Currency</span>
            <span className="font-bold text-indigo-600">BDT (৳)</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Couriers</span>
            <span className="font-medium text-slate-700">Pathao, Steadfast, RedX</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden w-64 md:flex md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-white shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

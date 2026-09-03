'use client';

import { Menu } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  userName: string;
  userEmail: string;
  onOpenMobileMenu: () => void;
}

export function Header({
  userName,
  userEmail,
  onOpenMobileMenu,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-semibold text-slate-800 text-base md:text-lg">
            Analytics Overview
          </h1>
          <p className="hidden text-xs text-slate-400 md:block">
            BDT Business Intelligence & Logistics Performance
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}

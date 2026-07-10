'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { filterNavItems } from '@/components/nav-config';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Platform',
  buyer: 'Buyer Industri',
  koperasi: 'Ketua Koperasi',
  customer: 'Customer Umum',
  pemerintah: 'Perwakilan Pemerintah',
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, userData, logout } = useAuth();

  const navItems = filterNavItems(!!user, userData?.role ?? null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const roleLabel = userData?.role ? ROLE_LABELS[userData.role] ?? 'Registrasi Peran' : 'Registrasi Peran';

  return (
    <aside className="hidden lg:flex sticky top-[68px] h-[calc(100vh-68px)] w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white">
      <div className="px-4 pt-6 pb-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigasi
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white">
              {(user.displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight text-slate-900">
                {user.displayName}
              </p>
              <p className="truncate text-[9px] font-semibold uppercase tracking-wider text-brand-orange">
                {roleLabel}
              </p>
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

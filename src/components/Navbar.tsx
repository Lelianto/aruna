'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BarChart3, Map, ShoppingBag, Award, Lightbulb, Compass, Presentation, ArrowUpRight } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Peta Potensi', href: '/peta', icon: Map },
    { name: 'Dashboard Nasional', href: '/dashboard', icon: BarChart3 },
    { name: 'Komoditas', href: '/komoditas', icon: Compass },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { name: 'ARUNA Score', href: '/scoring', icon: Award },
    { name: 'AI Insights', href: '/insights', icon: Lightbulb },
    { name: 'Pitch Deck', href: '/pitch', icon: Presentation }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/92 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/92">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-white font-extrabold text-lg shadow-sm ring-1 ring-white/30">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-normal text-brand-navy dark:text-white leading-tight">
                  ARUNA
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-none">
                  Supply Command Center
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-navy text-white shadow-sm dark:bg-brand-red'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/peta"
              className="hidden lg:inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-red px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-red/90 transition-all duration-200"
            >
              Buka Demo <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Buka menu utama</span>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 dark:border-slate-800 dark:bg-slate-950">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold ${
                  isActive
                    ? 'bg-brand-navy text-white dark:bg-brand-red'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-900 mt-2">
            <Link
              href="/peta"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center justify-center rounded-md bg-brand-red py-2.5 text-center text-sm font-bold text-white hover:bg-brand-red/90 transition-all duration-200"
            >
              Buka Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

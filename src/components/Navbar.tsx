'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BarChart3, Map, ShoppingBag, Award, Lightbulb, Compass, Presentation, ArrowUpRight, LogIn, LogOut, UserPlus, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, userData, signInWithGoogle, logout } = useAuth();

  const navItems = [
    { name: 'Peta Potensi', href: '/peta', icon: Map },
    { name: 'Dashboard Nasional', href: '/dashboard', icon: BarChart3 },
    { name: 'Komoditas', href: '/komoditas', icon: Compass },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { name: 'ARUNA Score', href: '/scoring', icon: Award },
    { name: 'AI Insights', href: '/insights', icon: Lightbulb },
    { name: 'Onboarding', href: '/onboarding-mitra', icon: UserPlus },
    { name: 'Portal Saya', href: '/mitra-dashboard', icon: LayoutDashboard }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!user || !userData?.role) {
      return false;
    }
    if (userData.role === 'buyer') {
      return item.href === '/marketplace';
    }
    if (userData.role === 'customer') {
      return item.href === '/marketplace';
    }
    if (userData.role === 'koperasi') {
      return item.href === '/peta' || item.href === '/komoditas' || item.href === '/mitra-dashboard';
    }
    // Admin has access to all
    return true;
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-white font-extrabold text-lg shadow-sm ring-1 ring-white/30">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-normal text-brand-navy leading-tight">
                  ARUNA
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                  Analitik Usaha Rakyat Nusantara
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 items-center justify-center gap-1 overflow-x-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-md text-xs font-bold transition-all duration-200 ${isActive
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right flex flex-col items-end">
                  <span className="text-xs font-black text-slate-950 block leading-tight">
                    {user.displayName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-brand-orange font-bold uppercase tracking-wider block">
                      {userData?.role === 'admin' ? 'Admin Platform' :
                        userData?.role === 'buyer' ? 'Buyer Industri' :
                          userData?.role === 'koperasi' ? 'Ketua Koperasi' : 'Registrasi Peran'}
                    </span>
                    <span className="text-slate-200 text-[9px]">|</span>
                    <Link href="/select-role" className="text-[9px] text-brand-red hover:underline font-extrabold block">
                      Ganti Peran
                    </Link>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-xs cursor-pointer"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="hidden lg:inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-red px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-red/90 transition-all duration-200 cursor-pointer"
              >
                Masuk Google <LogIn className="h-4.5 w-4.5" />
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold ${isActive
                    ? 'bg-brand-navy text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 mt-2 text-center">
            {user ? (
              <div className="space-y-3">
                <div className="text-center space-y-1">
                  <span className="text-sm font-bold text-slate-900 block leading-tight">
                    {user.displayName}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider block">
                      {userData?.role === 'admin' ? 'Admin Platform' :
                        userData?.role === 'buyer' ? 'Buyer Industri' :
                          userData?.role === 'koperasi' ? 'Ketua Koperasi' : 'Registrasi Peran'}
                    </span>
                    <span className="text-slate-300 text-[10px]">|</span>
                    <Link
                      href="/select-role"
                      onClick={() => setIsOpen(false)}
                      className="text-[10px] text-brand-red hover:underline font-extrabold block"
                    >
                      Ganti Peran
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white py-2.5 text-center text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="h-4.5 w-4.5" /> Keluar Akun
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  signInWithGoogle();
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-red py-2.5 text-center text-sm font-bold text-white hover:bg-brand-red/90 transition-all duration-200"
              >
                <LogIn className="h-4.5 w-4.5" /> Masuk Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, MapPin, LogIn, LogOut, User, ChevronRight, ChevronDown, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { filterNavItems } from '@/components/nav-config';

// Max direct destinations in the mobile bottom bar before overflow moves into
// the "Akun" sheet. The bar shows up to this many + 1 "Akun" slot = 5 total.
const MAX_PRIMARY_MOBILE = 4;

// Max direct destinations in the desktop top-nav before overflow moves into a
// right-aligned "Lainnya" dropdown. Keeps the header from getting crowded for
// roles with many destinations (e.g. admin).
const MAX_PRIMARY_DESKTOP = 4;

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Platform',
  buyer: 'Buyer Industri',
  koperasi: 'Ketua Koperasi',
  customer: 'Customer Umum',
  pemerintah: 'Perwakilan Pemerintah',
};

// Preferred ordering of destinations in the mobile bottom bar per role. The
// first MAX_PRIMARY_MOBILE become the visible tabs; the rest fall into the
// "Akun" sheet. Only affects the mobile bar — the desktop nav keeps its own
// (declaration) order. hrefs not listed keep their original relative order.
const MOBILE_NAV_PRIORITY: Record<string, string[]> = {
  // Koperasi: their operational workspace (Portal Saya) comes first.
  koperasi: ['/mitra-dashboard', '/marketplace', '/komoditas', '/insights'],
  // Pemerintah: analytical/oversight tools are primary; catalog/market overflow.
  pemerintah: ['/potensi-desa', '/dashboard', '/scoring', '/insights', '/komoditas', '/marketplace'],
  // Admin: platform-operation tools first. Admin tidak bertransaksi, jadi
  // Pasar Digital (/marketplace) & Portal Saya (/mitra-dashboard) tidak masuk.
  admin: ['/admin', '/dashboard', '/onboarding-mitra', '/potensi-desa', '/komoditas', '/scoring', '/insights'],
  buyer: ['/marketplace', '/komoditas'],
  customer: ['/marketplace'],
};

export default function Navbar() {
  const pathname = usePathname();
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDesktopMore, setShowDesktopMore] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const { user, userData, signInWithGoogle, logout, updateUserAddress } = useAuth();
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const filteredNavItems = filterNavItems(!!user, userData?.role ?? null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Close the desktop "Lainnya" dropdown on outside click or route change.
  useEffect(() => {
    if (!showDesktopMore) return;
    const handleClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowDesktopMore(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDesktopMore]);

  useEffect(() => {
    setShowDesktopMore(false);
  }, [pathname]);

  // Desktop top-nav split: first few items stay inline, the rest fall into a
  // right-aligned dropdown so the header never overflows.
  const desktopPrimary = filteredNavItems.slice(0, MAX_PRIMARY_DESKTOP);
  const desktopOverflow = filteredNavItems.slice(MAX_PRIMARY_DESKTOP);
  const desktopOverflowActive = desktopOverflow.some(item => isActive(item.href));

  // On the dashboard, navigation lives in a dedicated sidebar, so the crowded
  // desktop top-nav is hidden there to declutter the header (logo + profile only).
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  const roleLabel = userData?.role ? ROLE_LABELS[userData.role] ?? 'Registrasi Peran' : 'Registrasi Peran';

  // Mobile bottom-bar split: reorder by the role's priority (falling back to the
  // original order for unlisted items), then take up to 4 as primary tabs and
  // push the rest into the "Akun" sheet.
  const mobilePriority = userData?.role ? MOBILE_NAV_PRIORITY[userData.role] : undefined;
  const rankOf = (href: string) => {
    const idx = mobilePriority?.indexOf(href) ?? -1;
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  const mobileItems = mobilePriority
    ? filteredNavItems
      .map((item, index) => ({ item, index }))
      .sort((a, b) => rankOf(a.item.href) - rankOf(b.item.href) || a.index - b.index)
      .map(({ item }) => item)
    : filteredNavItems;
  const primaryItems = mobileItems.slice(0, MAX_PRIMARY_MOBILE);
  const overflowItems = mobileItems.slice(MAX_PRIMARY_MOBILE);
  // Highlight the Akun tab when the current page lives in the overflow menu.
  const overflowActive = overflowItems.some(item => isActive(item.href));

  const openAddressModal = () => {
    setNewAddress(userData?.address || '');
    setShowAddressModal(true);
    setShowAccountSheet(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[68px] items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex flex-col leading-none">
                <span className="text-2xl font-semibold tracking-tight text-brand-navy leading-none">
                  Aruna<span className="text-brand-orange">.</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wide leading-none mt-1">
                  Menghubungkan Komoditas Desa ke Pasar Nasional
                </span>
              </Link>
            </div>

            {/* Desktop horizontal nav — hidden on the dashboard (uses sidebar) */}
            <nav className={`${isDashboard ? 'hidden' : 'hidden lg:flex'} flex-1 items-center justify-center gap-1`}>
              {desktopPrimary.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-md text-xs font-semibold transition-all duration-200 ${active
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Overflow "Lainnya" dropdown — items 5+ live here */}
              {desktopOverflow.length > 0 && (
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowDesktopMore((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={showDesktopMore}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${desktopOverflowActive || showDesktopMore
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    Lainnya
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showDesktopMore ? 'rotate-180' : ''}`} />
                  </button>

                  {showDesktopMore && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-fade-in z-50"
                    >
                      {desktopOverflow.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setShowDesktopMore(false)}
                            className={`flex items-center gap-2.5 whitespace-nowrap px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${active
                              ? 'bg-brand-navy/5 text-brand-navy'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                              }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Desktop profile / login */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="hidden lg:flex items-center gap-3">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-950 block leading-tight">
                      {user.displayName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-brand-orange font-semibold uppercase tracking-wider block">
                        {roleLabel}
                      </span>
                      {userData?.role === 'customer' && (
                        <>
                          <span className="text-slate-200 text-[9px]">|</span>
                          <button
                            onClick={openAddressModal}
                            className="text-[9px] text-brand-navy hover:underline font-semibold block cursor-pointer"
                          >
                            Atur Alamat
                          </button>
                        </>
                      )}
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
                  onClick={() => signInWithGoogle()}
                  className="hidden lg:inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-red px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-red/90 transition-all duration-200 cursor-pointer"
                >
                  Masuk Google <LogIn className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation bar (app-like) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(18,48,66,0.06)]">
        <div className="flex items-stretch justify-around h-16">
          {primaryItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors ${active ? 'text-brand-navy' : 'text-slate-400 hover:text-slate-700'
                  }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[9px] font-semibold leading-tight truncate max-w-full">{item.name}</span>
              </Link>
            );
          })}

          {/* Akun tab — opens the account/overflow bottom sheet */}
          <button
            onClick={() => setShowAccountSheet(true)}
            aria-label="Buka menu akun"
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors ${overflowActive || showAccountSheet ? 'text-brand-navy' : 'text-slate-400 hover:text-slate-700'
              }`}
          >
            <User className={`h-5 w-5 ${overflowActive || showAccountSheet ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[9px] font-semibold leading-tight">Akun</span>
          </button>
        </div>
      </nav>

      {/* Account bottom sheet */}
      {showAccountSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setShowAccountSheet(false)}
          />

          {/* Sheet panel */}
          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[80vh] flex flex-col animate-slide-up pb-[env(safe-area-inset-bottom)]">
            {/* Grabber + header */}
            <div className="shrink-0 px-5 pt-3 pb-3 border-b border-slate-100">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200 mb-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Akun &amp; Menu</span>
                <button
                  onClick={() => setShowAccountSheet(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Profile block */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-navy text-white font-semibold text-lg">
                    {(user.displayName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-[10px] text-brand-orange font-semibold uppercase tracking-wider">{roleLabel}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Masuk untuk bertransaksi, mengelola koperasi, dan mengakses fitur lengkap.
                  </p>
                  <button
                    onClick={() => {
                      setShowAccountSheet(false);
                      signInWithGoogle();
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-red py-3 text-sm font-semibold text-white hover:bg-brand-red/90 transition-colors cursor-pointer"
                  >
                    <LogIn className="h-4.5 w-4.5" /> Masuk dengan Google
                  </button>
                </div>
              )}

              {/* Overflow menu items ("Menu Lainnya") */}
              {overflowItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Menu Lainnya</span>
                  <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {overflowItems.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowAccountSheet(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${active ? 'bg-brand-navy/5 text-brand-navy' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Account actions */}
              {user && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pengaturan Akun</span>
                  <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    <Link
                      href="/select-role"
                      onClick={() => setShowAccountSheet(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw className="h-5 w-5 shrink-0 text-brand-red" />
                      <span className="flex-1">Ganti Peran</span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </Link>

                    {userData?.role === 'customer' && (
                      <button
                        onClick={openAddressModal}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <MapPin className="h-5 w-5 shrink-0 text-brand-navy" />
                        <span className="flex-1 text-left">Atur Alamat Pengiriman</span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowAccountSheet(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-red hover:bg-red-50/50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">Keluar Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Address Management Modal for General Customer */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans text-slate-800 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <MapPin className="h-5 w-5 text-brand-red animate-bounce" />
                Atur Alamat Utama Pengiriman
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase">Alamat Lengkap Pengiriman</label>
              <textarea
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Masukkan alamat pengiriman utama Anda, cth: Perumahan Indah Permai Blok C No. 4, Gading Serpong, Tangerang"
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddressModal(false)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 font-semibold py-2 rounded-xl text-xs cursor-pointer text-slate-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!newAddress.trim()) {
                    alert("Alamat tidak boleh kosong.");
                    return;
                  }
                  setSavingAddress(true);
                  try {
                    await updateUserAddress(newAddress.trim());
                    setShowAddressModal(false);
                  } catch (err) {
                    console.error("Gagal mengubah alamat:", err);
                    alert("Gagal mengubah alamat utama.");
                  } finally {
                    setSavingAddress(false);
                  }
                }}
                disabled={savingAddress}
                className="flex-2 bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                {savingAddress ? 'Menyimpan...' : 'Simpan Alamat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

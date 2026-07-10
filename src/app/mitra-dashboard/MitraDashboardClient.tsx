'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import {
  collection, query, where, getDocs, doc, getDoc,
  addDoc, updateDoc, deleteDoc, setDoc
} from 'firebase/firestore';
import {
  Cooperative,
  Commodity,
  MarketRequest,
  MarketRequestWithBuyer,
  Buyer,
  Member,
  POSTransaction,
  PurchaseTransaction,
  StockOpname,
  CollaborativeProcurement,
  CooperativeConnectorTrade
} from '@/types';

const INVENTORY_CATEGORIES = ['Pangan', 'Perikanan', 'Peternakan', 'Perkebunan', 'Pupuk/Pakan'];
import { COMMODITY_UNITS, normalizeUnit, normalizeProductName } from '@/lib/constants/units';
const INVENTORY_UNITS = COMMODITY_UNITS;


function generateSKU(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PRD';
  const randNum = Math.floor(100 + Math.random() * 900);
  return `SKU-${cleanName}-${randNum}`;
}


import {
  Building2, PackagePlus, ShoppingCart, Pencil, Trash2, CreditCard,
  Plus, Save, X, CheckCircle2, AlertCircle, Loader2,
  MapPin, Users, TrendingUp, Phone, Warehouse, ChevronRight,
  Coins, Award, Scale, Check, FileCheck, ArrowUpRight, ArrowRight,
  Mic, MicOff, Send, Database, RefreshCw, BarChart3,
  History, UserPlus, FileText, ArrowRightLeft, Gift, ShieldAlert,
  Search, ArrowDownToLine, Tag, Menu, LayoutDashboard, ChevronLeft, LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { uploadDocument } from '@/lib/firebase/upload';
import { CustomSelect } from '@/components/ui/CustomSelect';
import ReceiptModal from '@/components/pos/ReceiptModal';
import ArunaHelpWidget from '@/components/help/ArunaHelpWidget';
import { normalizeWhatsappNumber, isValidWhatsappNumber } from '@/lib/utils/phone';

// Import Offline Services
import { localDb, queueForSync, seedLocalDataIfEmpty } from '@/lib/services/local-db';
import { useSyncStatus, triggerSync, isOnline } from '@/lib/services/sync-manager';
import { executeAICommand, VoiceAssistant } from '@/lib/services/ai-service';

// Import chart components
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

type ActiveTabKey = 'kasir' | 'stok' | 'pembelian' | 'penjualan' | 'anggota' | 'laporan' | 'pesanan' | 'connector' | 'shu' | 'profil';

interface MenuItem {
  key: ActiveTabKey;
  label: string;
  icon: React.ComponentType<any>;
  group: 'operasional' | 'jejaring' | 'profil';
  badge?: number;
}

// ─── Toast helper ────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-20 lg:bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold animate-fade-in-up ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
      }`}>
      {type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MitraDashboardClient() {
  const { user, userData, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const coopId = userData?.associatedId;

  useEffect(() => {
    if (!authLoading) {
      // Portal Saya adalah ruang kerja operasional koperasi (POS, stok, SHU, dll).
      // Admin bukan pelaku transaksi sehingga tidak boleh mengakses portal ini —
      // admin diarahkan ke Dashboard Nasional, peran lain ke beranda.
      if (!user || !userData || userData.role !== 'koperasi') {
        router.push(userData?.role === 'admin' ? '/dashboard' : '/');
      }
    }
  }, [user, userData, authLoading, router]);

  // Sync Manager hook
  const { online, queueCount, syncing, statusText } = useSyncStatus();

  // Navigation Sidebar States
  const [activeTab, setActiveTab] = useState<ActiveTabKey>('kasir');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAIConsoleOpen, setIsAIConsoleOpen] = useState(false);

  // Database states
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [requests, setRequests] = useState<MarketRequestWithBuyer[]>([]);
  const [coopMatches, setCoopMatches] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [salesHistory, setSalesHistory] = useState<POSTransaction[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  // ── Fetch all data (Offline first wrapper) ────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!coopId) { setLoading(false); return; }
    setLoading(true);

    try {
      // 1. Fetch from Firestore if online, otherwise mock/retrieve local profile
      let loadedCoop: Cooperative | null = null;
      if (online) {
        const coopSnap = await getDoc(doc(db, 'cooperatives', coopId));
        if (coopSnap.exists()) {
          loadedCoop = { id: coopSnap.id, ...coopSnap.data() } as Cooperative;
          setCoop(loadedCoop);
        }
      } else {
        // Mock offline cooperative profile
        loadedCoop = {
          id: coopId,
          name: 'KDKMP Desa Merah Putih',
          province: 'Jawa Barat',
          city: 'Garut',
          latitude: -7.227906,
          longitude: 107.908699,
          member_count: 150,
          active_members: 95,
          annual_revenue: 550000000,
          cash_reserve: 85000000,
          nib_status: 'verified',
          sk_status: 'verified'
        };
        setCoop(loadedCoop);
      }

      // 2. Fetch Commodities & seed local DB
      let comList: Commodity[] = [];
      if (online) {
        const comQ = query(collection(db, 'commodities'), where('cooperative_id', '==', coopId));
        const comSnap = await getDocs(comQ);
        comSnap.forEach(d => comList.push({ id: d.id, ...d.data() } as Commodity));

        // Sync local commodities cache
        if (localDb) {
          // Keep ONLY local unsynced commodities whose IDs start with 'new-prod-'
          const localUnsynced = (await localDb.commodities.toArray()).filter((c: any) => c.id.startsWith('new-prod-'));
          await localDb.commodities.clear();
          await localDb.commodities.bulkPut(localUnsynced);
          comList = [...comList, ...localUnsynced];
        }
      } else {
        if (localDb) {
          comList = await localDb.commodities.toArray();
        }
      }
      setCommodities(comList);

      // Fetch other collections based on online/offline state
      let memList: Member[] = [];
      let salesList: POSTransaction[] = [];
      let purchasesList: PurchaseTransaction[] = [];

      if (online) {
        // Fetch members from Firestore
        const memQ = query(collection(db, 'members'), where('cooperative_id', '==', coopId));
        const memSnap = await getDocs(memQ);
        memSnap.forEach(d => memList.push({ id: d.id, ...d.data() } as Member));

        // Fetch sales from Firestore
        const salesQ = query(collection(db, 'sales'), where('cooperative_id', '==', coopId));
        const salesSnap = await getDocs(salesQ);
        salesSnap.forEach(d => salesList.push({ id: d.id, ...d.data() } as POSTransaction));

        // Fetch purchases from Firestore
        const purchasesQ = query(collection(db, 'purchases'), where('cooperative_id', '==', coopId));
        const purchasesSnap = await getDocs(purchasesQ);
        purchasesSnap.forEach(d => purchasesList.push({ id: d.id, ...d.data() } as PurchaseTransaction));

        if (localDb) {
          // Keep only local unsynced items
          const localUnsyncedMembers = (await localDb.members.toArray()).filter((m: any) => m.id.startsWith('mem-'));
          await localDb.members.clear();
          await localDb.members.bulkPut(localUnsyncedMembers);
          memList = [...memList, ...localUnsyncedMembers];

          const localUnsyncedSales = (await localDb.transactions.toArray()).filter((t: any) => t.id.startsWith('sale-'));
          await localDb.transactions.clear();
          await localDb.transactions.bulkPut(localUnsyncedSales);
          salesList = [...salesList, ...localUnsyncedSales];

          const localUnsyncedPurchases = (await localDb.purchases.toArray()).filter((p: any) => p.id.startsWith('purchase-'));
          await localDb.purchases.clear();
          await localDb.purchases.bulkPut(localUnsyncedPurchases);
          purchasesList = [...purchasesList, ...localUnsyncedPurchases];
        }
      } else {
        if (localDb) {
          memList = await localDb.members.toArray();
          salesList = await localDb.transactions.toArray();
          purchasesList = await localDb.purchases.toArray();
        }
      }

      setMembers(memList);
      setSalesHistory(salesList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      setPurchaseHistory(purchasesList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      // 3. Load requests & supply matches (Connector data - online only fallback)
      if (online) {
        const reqSnap = await getDocs(collection(db, 'market_requests'));
        const buyerSnap = await getDocs(collection(db, 'buyers'));
        const buyers: Buyer[] = [];
        buyerSnap.forEach(d => buyers.push({ id: d.id, ...d.data() } as Buyer));

        const commodityNames = new Set(comList.map(c => c.name.toLowerCase()));
        const reqList: MarketRequestWithBuyer[] = [];
        const reqListAll: MarketRequest[] = [];

        reqSnap.forEach(d => {
          const req = { id: d.id, ...d.data() } as MarketRequest;
          reqListAll.push(req);
          if (commodityNames.has(req.commodity_name.toLowerCase())) {
            const buyer = buyers.find(b => b.id === req.buyer_id);
            reqList.push({
              ...req,
              buyer: buyer || { id: req.buyer_id, company_name: 'Industri Nasional', city: 'Indonesia', industry: 'Pangan' }
            });
          }
        });
        setRequests(reqList);

        // Matches
        const matchesQ = query(collection(db, 'supply_matches'), where('cooperative_id', '==', coopId));
        const matchesSnap = await getDocs(matchesQ);
        const matchesList: any[] = [];
        matchesSnap.forEach(d => {
          const matchData = d.data();
          const req = reqListAll.find(r => r.id === matchData.request_id);
          if (req) {
            const buyer = buyers.find(b => b.id === req.buyer_id);
            matchesList.push({
              id: d.id,
              ...matchData,
              request: {
                ...req,
                buyer: buyer || { id: req.buyer_id, company_name: 'Industri Nasional', city: 'Indonesia', industry: 'Pangan' }
              }
            });
          }
        });
        setCoopMatches(matchesList);
      }

    } catch (e) {
      console.error('Error fetching dashboard data:', e);
      showToast('Gagal memuat beberapa data. Menggunakan cache lokal.', 'error');
    } finally {
      setLoading(false);
    }
  }, [coopId, online]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch data when sync finishes to ensure UI has the latest synced IDs/states
  const prevSyncingRef = useRef(syncing);
  useEffect(() => {
    if (prevSyncingRef.current && !syncing && queueCount === 0) {
      fetchData();
    }
    prevSyncingRef.current = syncing;
  }, [syncing, queueCount, fetchData]);

  // Sidebar Menu Items Definition
  const menuItems = useMemo((): MenuItem[] => [
    // Operasional
    { key: 'kasir', label: 'Kasir POS', icon: ShoppingCart, group: 'operasional' },
    { key: 'stok', label: 'Stok & Opname', icon: Warehouse, group: 'operasional', badge: commodities.length },
    { key: 'pembelian', label: 'Pembelian (Stok Masuk)', icon: ArrowDownToLine, group: 'operasional' },
    { key: 'penjualan', label: 'Riwayat Transaksi', icon: History, group: 'operasional' },
    { key: 'anggota', label: 'Anggota Koperasi', icon: Users, group: 'operasional', badge: members.length },
    { key: 'laporan', label: 'Laporan Keuangan', icon: BarChart3, group: 'operasional' },
    // Jejaring
    { key: 'pesanan', label: 'Permintaan Pasar', icon: Tag, group: 'jejaring', badge: requests.filter(r => r.status === 'Menunggu Pemenuhan').length },
    { key: 'connector', label: 'Connector & Pengadaan', icon: ArrowRightLeft, group: 'jejaring' },
    { key: 'shu', label: 'Bagi Hasil (SHU)', icon: Coins, group: 'jejaring' },
    // Profil
    { key: 'profil', label: 'Profil Koperasi', icon: Building2, group: 'profil' }
  ], [commodities, members, requests]);

  if (authLoading || loading) {
    return (
      <div className="page-shell flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  if (!user || !userData || (userData.role !== 'koperasi' && userData.role !== 'admin')) {
    return null;
  }

  if (!coopId) {
    return (
      <div className="page-shell flex-1 flex items-center justify-center py-20 bg-[#f7f8fa]">
        <div className="text-center max-w-sm">
          <Building2 className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Akun Belum Terhubung</h2>
          <p className="text-sm text-slate-500">
            Akun Anda belum dihubungkan ke data koperasi di sistem. Hubungi Admin ARUNA untuk menautkan akun Anda.
          </p>
        </div>
      </div>
    );
  }

  const activeMenu = menuItems.find(m => m.key === activeTab);

  // Render navigation list
  const renderNavLinks = () => {
    const groups = [
      { key: 'operasional', title: 'Operasional Koperasi' },
      { key: 'jejaring', title: 'Jejaring & Pemasaran' },
      { key: 'profil', title: 'Pengaturan' }
    ];

    return (
      <nav className="flex-1 space-y-6 overflow-y-auto px-2">
        {groups.map(group => {
          const items = menuItems.filter(item => item.group === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="space-y-1.5">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest block px-3">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveTab(item.key);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isActive
                        ? 'bg-brand-navy text-white shadow-xs'
                        : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-450'}`} />
                        {item.label}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[9px] font-semibold h-4.5 min-w-4.5 px-1.5 rounded-full flex items-center justify-center ${isActive ? 'bg-brand-red text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="flex-1 bg-[#f7f8fa] min-h-screen relative font-sans py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">

        {/* 1. SIDEBAR (DESKTOP) */}
        <aside className="hidden md:flex flex-col w-72 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-6 shrink-0 h-[calc(100vh-140px)] sticky top-24 z-30 shadow-3xs">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="h-9 w-9 rounded-xl bg-brand-navy text-white flex items-center justify-center font-semibold text-sm">
              A
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-navy block leading-tight">ARUNA Coop OS</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">National Cooperative</span>
            </div>
          </div>

          {/* Navigation list */}
          {renderNavLinks()}

          {/* Sidebar Footer (Profile / Logout) */}
          {coop && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between px-2 text-xs">
              <div className="truncate max-w-[150px]">
                <span className="font-semibold text-slate-900 block truncate">{coop.name}</span>
                <span className="text-[10px] text-slate-500 font-semibold block truncate">{coop.city}</span>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-brand-red rounded-xl transition-colors cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </aside>

        {/* 2. MOBILE MENU DRAWER (LEFT DRAWER OVERLAY) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Laci Geser content */}
            <div className="relative flex flex-col w-72 bg-white h-full p-5 space-y-6 shadow-2xl animate-slide-in-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-navy text-white flex items-center justify-center font-semibold text-xs">A</div>
                  <span className="text-xs font-semibold text-brand-navy block leading-tight">Coop OS</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {renderNavLinks()}

              {coop && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{coop.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">{coop.city}</span>
                  </div>
                  <button onClick={() => logout()} className="text-slate-400 hover:text-brand-red flex items-center gap-1 font-semibold">
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col min-w-0 space-y-6">

          {/* TOP BAR / HEADER CARD */}
          <header className="w-full bg-white border border-slate-200/80 rounded-2xl px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-3xs">
            <div className="flex items-center gap-3">
              {/* Hamburger trigger on mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <Menu className="h-5.5 w-5.5" />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 leading-none">
                  {activeMenu && <activeMenu.icon className="h-4.5 w-4.5 text-brand-navy" />}
                  {activeMenu?.label}
                </h2>
                {coop && activeTab !== 'anggota' && (
                  <p className="text-[10px] text-slate-450 font-semibold mt-2 leading-none">
                    {coop.name} &bull; {coop.city}, {coop.province} &bull; SimkopDes: <span className="font-semibold text-slate-700">{coop.simkopdes_id || '-'}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Compressed Sync status tag */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-full px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-3xs max-w-[240px] truncate">
              <span className={`h-2 w-2 rounded-full shrink-0 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span className="truncate">{statusText}</span>
              {queueCount > 0 && (
                <button
                  onClick={() => triggerSync()}
                  disabled={syncing}
                  className="ml-1 text-[9px] text-brand-navy font-semibold hover:underline shrink-0"
                >
                  Sync ({queueCount})
                </button>
              )}
            </div>
          </header>

          {/* MAIN BODY AREA */}
          <div className="flex-1 space-y-6">

            {/* Document compliance alert */}
            {coop && (coop.nib_status === 'pending' || coop.sk_status === 'pending') && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 shadow-3xs">
                <ShieldAlert className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-amber-950 uppercase tracking-wider">Verifikasi NIB/SK Sedang Diproses</h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Dokumen legalitas koperasi Anda sedang dalam peninjauan kepatuhan ARUNA. Bonus skor +15 poin ARUNA akan langsung aktif setelah dokumen terverifikasi.
                  </p>
                </div>
              </div>
            )}

            {/* Operational Module router */}
            <div className="animate-fade-in-up">
              {activeTab === 'kasir' && (
                <POSModule
                  coopId={coopId}
                  coop={coop}
                  commodities={commodities}
                  members={members}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              )}
              {activeTab === 'stok' && (
                <InventoryModule
                  coopId={coopId}
                  commodities={commodities}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              )}
              {activeTab === 'pembelian' && (
                <PurchaseModule
                  coopId={coopId}
                  commodities={commodities}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              )}
              {activeTab === 'penjualan' && (
                <SalesHistoryModule
                  sales={salesHistory}
                  purchases={purchaseHistory}
                />
              )}
              {activeTab === 'anggota' && (
                <MemberModule
                  coopId={coopId}
                  members={members}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              )}
              {activeTab === 'laporan' && (
                <ReportingModule
                  sales={salesHistory}
                  purchases={purchaseHistory}
                  members={members}
                  commodities={commodities}
                />
              )}
              {activeTab === 'connector' && (
                <ConnectorModule coopId={coopId} showToast={showToast} />
              )}
              {activeTab === 'pesanan' && (
                <PesananTab
                  requests={requests}
                  commodities={commodities}
                  coopId={coopId}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              )}
              {activeTab === 'shu' && coop && (
                <SHUTab
                  coop={coop}
                  coopId={coopId}
                  matches={coopMatches}
                  onRefresh={fetchData}
                  showToast={showToast}
                />
              )}
              {activeTab === 'profil' && coop && (
                <ProfilTab
                  coop={coop}
                  coopId={coopId}
                  onSave={fetchData}
                  showToast={showToast}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 4. FLOATING AI MIC ACTION BUBBLE */}
      <button
        onClick={() => setIsAIConsoleOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 h-14 w-14 rounded-full bg-brand-navy hover:bg-brand-navy/95 text-white shadow-2xl flex items-center justify-center cursor-pointer z-40 transition-transform active:scale-95 group"
        title="Buka AI Command Center"
      >
        <Mic className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        {/* Soft pulsing halo ring */}
        <span className="absolute inset-0 rounded-full border border-brand-navy/30 animate-ping opacity-60 pointer-events-none"></span>
      </button>

      {/* 5. AI OVERLAY SIDE DRAWER CHAT CONSOLE */}
      {isAIConsoleOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsAIConsoleOpen(false)}
          />
          {/* Chat Drawer sliding from right */}
          <div className="relative flex flex-col w-full sm:w-[420px] bg-slate-900 text-white h-full p-5 shadow-2xl animate-slide-in-right z-50">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="h-4.5 w-4.5 text-brand-orange animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-350">AI Command Center</span>
              </div>
              <button
                onClick={() => setIsAIConsoleOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <AIConsolePanel
              coopId={coopId}
              commodities={commodities}
              members={members}
              onClose={() => setIsAIConsoleOpen(false)}
              onActionTriggered={fetchData}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* 6. Floating "Aruna Help" product-knowledge chatbot (chat + voice) */}
      <ArunaHelpWidget activeTab={activeTab} />
    </div>
  );
}

// ─── COMPONENT: AI CONSOLE DRAWER CORE ─────────────────────────────────────────
function AIConsolePanel({ coopId, commodities, members, onClose, onActionTriggered, showToast }: {
  coopId: string; commodities: Commodity[]; members: Member[]; onClose: () => void; onActionTriggered: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [queryText, setQueryText] = useState('');
  const [assistantResponse, setAssistantResponse] = useState<any | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const assistantRef = useRef<VoiceAssistant | null>(null);

  useEffect(() => {
    assistantRef.current = new VoiceAssistant(
      (text) => {
        setQueryText(text);
      },
      (err) => {
        showToast(`Voice Error: ${err}`, 'error');
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  }, []);

  const handleMicToggle = () => {
    if (!assistantRef.current || !assistantRef.current.isSupported()) {
      return showToast('Speech Recognition tidak didukung pada browser Anda.', 'error');
    }

    if (isListening) {
      assistantRef.current.stop();
      setIsListening(false);
    } else {
      setQueryText('');
      assistantRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendText = async () => {
    if (!queryText.trim()) return;

    // Stop voice recording if active when sending text
    if (assistantRef.current) {
      assistantRef.current.stop();
    }
    setIsListening(false);

    setLoading(true);
    const prevContext = assistantResponse?.action === 'need_clarification' ? assistantResponse : null;

    try {
      const response = await executeAICommand(queryText.trim(), prevContext);
      setAssistantResponse(response);
      setQueryText('');
    } catch (e) {
      showToast('Gagal memproses analisis perintah AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!assistantResponse || !localDb) return;
    const { action, payload } = assistantResponse;

    try {
      switch (action) {
        case 'create_sale': {
          const resolvedItems = [];
          for (const item of payload.items) {
            let commodityId = item.commodity_id;
            if (!commodityId) {
              const matched = commodities.find(c => c.name.toLowerCase() === item.commodity_name.toLowerCase());
              commodityId = matched?.id;
            }
            if (!commodityId) {
              commodityId = isOnline() ? doc(collection(db, 'commodities')).id : `new-prod-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
            }

            resolvedItems.push({
              ...item,
              commodity_id: commodityId,
              price_per_kg: item.price_per_kg || 12000
            });
          }

          const saleTx: POSTransaction = {
            id: `sale-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
            cooperative_id: coopId,
            member_id: payload.memberId || undefined,
            items: resolvedItems,
            total_amount: resolvedItems.reduce((sum: number, i: any) => sum + (i.quantity * i.price_per_kg), 0),
            payment_method: payload.paymentMethod || 'Tunai',
            created_at: new Date().toISOString(),
            status: 'pending',
            version: 1
          };

          if (isOnline()) {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entity_type: 'sale', action: 'create', payload: saleTx })
            });
          } else {
            if (localDb) {
              await localDb.transactions.add(saleTx);
              for (const item of resolvedItems) {
                const current = await localDb.commodities.get(item.commodity_id);
                if (current) {
                  await localDb.commodities.update(item.commodity_id, {
                    available_stock: Math.max(0, current.available_stock - item.quantity)
                  });
                }
              }
            }
            await queueForSync('sale', 'create', saleTx);
          }
          break;
        }

        case 'create_purchase': {
          const itemsWithIds = [];
          const newProductsOnline = [];
          for (const item of payload.items) {
            const normalizedName = normalizeProductName(item.commodity_name);
            const matched = commodities.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
            let commodity_id = matched?.id;

            if (!matched) {
              if (isOnline()) {
                commodity_id = doc(collection(db, 'commodities')).id;
                const newProduct = {
                  id: commodity_id,
                  cooperative_id: coopId,
                  name: normalizedName,
                  sku: generateSKU(normalizedName),
                  category: 'Pangan',
                  monthly_capacity: item.quantity * 2,
                  available_stock: item.quantity,
                  unit: normalizeUnit(item.unit || 'Kg'),
                  harvest_period: 'Sepanjang Tahun',
                  created_at: new Date().toISOString()
                };
                newProductsOnline.push(newProduct);
              } else {
                commodity_id = `new-prod-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
                const newProduct = {
                  id: commodity_id,
                  cooperative_id: coopId,
                  name: normalizedName,
                  sku: generateSKU(normalizedName),
                  category: 'Pangan',
                  monthly_capacity: item.quantity * 2,
                  available_stock: item.quantity,
                  unit: normalizeUnit(item.unit || 'Kg'),
                  harvest_period: 'Sepanjang Tahun',
                  created_at: new Date().toISOString()
                };
                if (localDb) {
                  await localDb.commodities.add(newProduct);
                }
                await queueForSync('product', 'create', newProduct);
              }
            } else {
              if (!isOnline() && localDb) {
                await localDb.commodities.update(matched.id, {
                  available_stock: matched.available_stock + item.quantity
                });
              }
            }

            itemsWithIds.push({
              ...item,
              commodity_id,
              commodity_name: normalizedName,
              unit: normalizeUnit(item.unit || 'Kg'),
              price_per_kg: item.price_per_kg || 10000
            });
          }

          const purchaseTx: PurchaseTransaction = {
            id: `purchase-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
            cooperative_id: coopId,
            supplier_name: payload.supplierName,
            items: itemsWithIds,
            total_amount: itemsWithIds.reduce((sum: number, i: any) => sum + (i.quantity * i.price_per_kg), 0),
            created_at: new Date().toISOString(),
            status: 'pending',
            version: 1
          };

          if (isOnline()) {
            for (const prod of newProductsOnline) {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_type: 'product', action: 'create', payload: prod })
              });
            }
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ entity_type: 'purchase', action: 'create', payload: purchaseTx })
            });
          } else {
            if (localDb) {
              await localDb.purchases.add(purchaseTx);
            }
            await queueForSync('purchase', 'create', purchaseTx);
          }
          break;
        }

        case 'update_stock': {
          const normalizedName = normalizeProductName(payload.commodity_name);
          const matched = commodities.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
          if (matched) {
            let nextStock = matched.available_stock;
            if (payload.operation === 'add') nextStock += payload.quantity;
            if (payload.operation === 'reduce') nextStock = Math.max(0, matched.available_stock - payload.quantity);
            if (payload.operation === 'set') nextStock = payload.quantity;

            if (isOnline()) {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  entity_type: 'stock',
                  action: 'update',
                  payload: { id: matched.id, available_stock: nextStock }
                })
              });
            } else {
              if (localDb) {
                await localDb.commodities.update(matched.id, { available_stock: nextStock });
              }
              await queueForSync('stock', 'update', {
                id: matched.id,
                available_stock: nextStock
              });
            }
          } else if (payload.operation === 'add' || payload.operation === 'set') {
            if (isOnline()) {
              const commodity_id = doc(collection(db, 'commodities')).id;
              const newProduct = {
                id: commodity_id,
                cooperative_id: coopId,
                name: normalizedName,
                sku: generateSKU(normalizedName),
                category: 'Pangan',
                monthly_capacity: payload.quantity * 2,
                available_stock: payload.quantity,
                unit: normalizeUnit(payload.unit || 'Kg'),
                harvest_period: 'Sepanjang Tahun',
                created_at: new Date().toISOString()
              };
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_type: 'product', action: 'create', payload: newProduct })
              });
            } else {
              const commodity_id = `new-prod-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
              const newProduct = {
                id: commodity_id,
                cooperative_id: coopId,
                name: normalizedName,
                sku: generateSKU(normalizedName),
                category: 'Pangan',
                monthly_capacity: payload.quantity * 2,
                available_stock: payload.quantity,
                unit: normalizeUnit(payload.unit || 'Kg'),
                harvest_period: 'Sepanjang Tahun',
                created_at: new Date().toISOString()
              };
              if (localDb) {
                await localDb.commodities.add(newProduct);
              }
              await queueForSync('product', 'create', newProduct);
            }
          }
          break;
        }

        case 'edit_product': {
          const matched = commodities.find(c => c.id === payload.commodity_id || c.name.toLowerCase() === payload.commodity_name.toLowerCase());
          if (matched) {
            const updatedProduct = {
              ...matched,
              ...payload.updates,
              name: payload.updates.name ? normalizeProductName(payload.updates.name) : matched.name,
              unit: payload.updates.unit ? normalizeUnit(payload.updates.unit) : matched.unit,
              updated_at: new Date().toISOString()
            };

            if (isOnline()) {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_type: 'product', action: 'update', payload: updatedProduct })
              });
            } else {
              if (localDb) {
                await localDb.commodities.put(updatedProduct);
              }
              await queueForSync('product', 'update', updatedProduct);
            }
          }
          break;
        }

        case 'delete_product': {
          const matched = commodities.find(c => c.id === payload.commodity_id || c.name.toLowerCase() === payload.commodity_name.toLowerCase());
          if (matched) {
            if (isOnline()) {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity_type: 'product', action: 'delete', payload: { id: matched.id } })
              });
            } else {
              if (localDb) {
                await localDb.commodities.delete(matched.id);
              }
              await queueForSync('product', 'delete', { id: matched.id });
            }
          }
          break;
        }
      }

      if (!isOnline()) {
        triggerSync();
      }

      showToast(isOnline() ? 'Aksi AI berhasil dieksekusi!' : 'Aksi AI berhasil dieksekusi secara lokal!');
      setAssistantResponse(null);
      setQueryText('');
      onActionTriggered();
      onClose(); // Auto close console on execution
    } catch (err) {
      console.error(err);
      showToast('Gagal mengeksekusi aksi AI', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 text-xs font-semibold text-slate-300">

      {/* Drawer content chat body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-3 text-center">
        {/* Visual prompt guidelines */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 text-left space-y-2.5">
          <span className="text-[10px] text-brand-orange font-semibold uppercase tracking-wider block">Gunakan Perintah Suara / Teks:</span>
          <ul className="space-y-1.5 text-slate-350 list-disc list-inside leading-relaxed text-[11px]">
            <li><em>"Jual beras 10 kg ke Pak Budi"</em> (POS)</li>
            <li><em>"Tambah stok jagung 50 kilo"</em> (Inventory)</li>
            <li><em>"Terima 20 kg beras dari PT ABC"</em> (Pembelian)</li>
            <li><em>"Berapa omzet penjualan hari ini?"</em> (Laporan)</li>
            <li><em>"Tampilkan stok cabai sekarang"</em> (Tanya Stok)</li>
          </ul>
        </div>

        {/* Dynamic status recording anim */}
        {isListening && (
          <div className="py-4 space-y-2">
            <div className="flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-red animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="h-2 w-2 rounded-full bg-brand-red animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="h-2 w-2 rounded-full bg-brand-red animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <p className="text-[10px] font-semibold text-brand-red uppercase tracking-wider animate-pulse">Sedang Mendengarkan...</p>
          </div>
        )}

        {/* Intent result box */}
        {assistantResponse && (
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left space-y-3 animate-fade-in-up mt-4">
            <div>
              <span className="text-[9px] font-semibold text-brand-orange uppercase tracking-wider block">
                {assistantResponse.action === 'need_clarification' ? 'Klarifikasi Perintah' : 'Konfirmasi Perintah AI'}
              </span>
              <p className="text-slate-200 mt-1 leading-relaxed">
                {assistantResponse.confirmation_message}
              </p>
            </div>
            {assistantResponse.action !== 'query_stock' && assistantResponse.action !== 'reporting' ? (
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => setAssistantResponse(null)}
                  className="bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs h-8 px-3 rounded-lg cursor-pointer"
                >
                  Batal
                </Button>
                {assistantResponse.action !== 'need_clarification' && (
                  <Button
                    size="sm"
                    onClick={handleConfirmAction}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs h-8 px-3 rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Konfirmasi
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    setAssistantResponse(null);
                    setQueryText('');
                  }}
                  className="bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs h-8 px-3 rounded-lg cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input console control box */}
      <div className="space-y-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleMicToggle}
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${isListening ? 'bg-brand-red text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
          >
            {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Mendengarkan..." : "Ketik instruksi di sini..."}
            value={queryText}
            onChange={e => setQueryText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendText();
            }}
            className="flex-1 bg-slate-900 border border-slate-850 px-3 py-2 rounded-xl text-xs text-white focus:outline-none placeholder-slate-500 font-semibold"
            disabled={loading}
          />

          <button
            onClick={handleSendText}
            disabled={!queryText.trim() || loading}
            className="h-10 w-10 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-brand-orange" />}
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── MODULE: POS / KASIR (2-COLUMN DESTKOP / MOBILE BOTTOM SHEET) ─────────────
function POSModule({ coopId, coop, commodities, members, onRefresh, showToast }: {
  coopId: string; coop: Cooperative | null; commodities: Commodity[]; members: Member[]; onRefresh: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [cart, setCart] = useState<Array<{ commodity: Commodity, qty: number, price: number }>>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerWa, setCustomerWa] = useState('');
  const [completedTx, setCompletedTx] = useState<POSTransaction | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer' | 'Simpanan' | 'QRIS'>('Tunai');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisVerifying, setQrisVerifying] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const filteredCommodities = commodities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) && c.available_stock > 0
  );

  const addToCart = (commodity: Commodity) => {
    setCart(prev => {
      const existing = prev.find(item => item.commodity.id === commodity.id);
      if (existing) {
        if (existing.qty >= commodity.available_stock) {
          showToast('Kuantitas melebihi stok yang tersedia', 'error');
          return prev;
        }
        return prev.map(item => item.commodity.id === commodity.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { commodity, qty: 1, price: commodity.price_per_unit || 12000 }];
    });
  };

  const updateCartQty = (id: string, qty: number, max: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.commodity.id !== id));
      return;
    }
    if (qty > max) {
      showToast('Kuantitas melebihi stok yang tersedia', 'error');
      return;
    }
    setCart(prev => prev.map(item => item.commodity.id === id ? { ...item, qty } : item));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Cash-tender helpers (Tunai only): change due + quick "uang diterima"
  // suggestions (exact amount, then rounded up to common rupiah notes).
  const changeDue = amountPaid - totalAmount;
  const cashSuggestions = useMemo<number[]>(() => {
    if (totalAmount <= 0) return [];
    const set = new Set<number>([totalAmount]); // uang pas
    [5000, 10000, 20000, 50000, 100000].forEach(step => {
      set.add(Math.ceil(totalAmount / step) * step);
    });
    return Array.from(set).filter(v => v >= totalAmount).sort((a, b) => a - b).slice(0, 5);
  }, [totalAmount]);

  // Selecting a registered member auto-fills the receipt recipient (name + WA)
  // so the cashier does not retype it. Choosing "Umum" clears the prefill.
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = members.find(m => m.id === memberId);
    if (member) {
      setCustomerName(member.name || '');
      setCustomerWa(member.phone ? normalizeWhatsappNumber(member.phone) : '');
    } else {
      setCustomerName('');
      setCustomerWa('');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return showToast('Keranjang belanja kosong', 'error');

    if (customerWa.trim() && !isValidWhatsappNumber(customerWa)) {
      return showToast('Nomor WhatsApp pembeli tidak valid. Contoh: 081234567890', 'error');
    }

    if (paymentMethod === 'Tunai' && amountPaid < totalAmount) {
      return showToast('Uang diterima kurang dari total tagihan', 'error');
    }

    if (paymentMethod === 'QRIS' && !showQrisModal) {
      setShowQrisModal(true);
      return;
    }

    setSaving(true);

    try {
      const newTransaction: POSTransaction = {
        id: `sale-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        cooperative_id: coopId,
        member_id: selectedMemberId || undefined,
        customer_name: customerName.trim() || undefined,
        customer_wa: customerWa.trim() ? normalizeWhatsappNumber(customerWa) : undefined,
        items: cart.map(item => ({
          commodity_id: item.commodity.id,
          commodity_name: item.commodity.name,
          quantity: item.qty,
          price_per_kg: item.price,
          unit: item.commodity.unit
        })),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'Tunai' ? amountPaid : undefined,
        change: paymentMethod === 'Tunai' ? Math.max(0, amountPaid - totalAmount) : undefined,
        created_at: new Date().toISOString(),
        status: 'pending',
        version: 1
      };

      if (isOnline()) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'sale', action: 'create', payload: newTransaction })
        });
        showToast('Transaksi kasir berhasil dicatat!');
      } else {
        if (localDb) {
          await localDb.transactions.add(newTransaction);
          for (const item of cart) {
            const current = await localDb.commodities.get(item.commodity.id);
            if (current) {
              await localDb.commodities.update(item.commodity.id, {
                available_stock: Math.max(0, current.available_stock - item.qty)
              });
            }
          }
        }
        await queueForSync('sale', 'create', newTransaction);
        triggerSync();
        showToast('Transaksi kasir berhasil dicatat lokal!');
      }
      setCompletedTx(newTransaction);
      setCart([]);
      setSelectedMemberId('');
      setCustomerName('');
      setCustomerWa('');
      setPaymentMethod('Tunai');
      setAmountPaid(0);
      setIsMobileCartOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Transaksi kasir gagal disimpan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmQrisCheckout = async () => {
    setQrisVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const newTransaction: POSTransaction = {
        id: `sale-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        cooperative_id: coopId,
        member_id: selectedMemberId || undefined,
        customer_name: customerName.trim() || undefined,
        customer_wa: customerWa.trim() ? normalizeWhatsappNumber(customerWa) : undefined,
        items: cart.map(item => ({
          commodity_id: item.commodity.id,
          commodity_name: item.commodity.name,
          quantity: item.qty,
          price_per_kg: item.price,
          unit: item.commodity.unit
        })),
        total_amount: totalAmount,
        payment_method: 'QRIS',
        created_at: new Date().toISOString(),
        status: 'pending',
        version: 1
      };

      if (isOnline()) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'sale', action: 'create', payload: newTransaction })
        });
      } else {
        if (localDb) {
          await localDb.transactions.add(newTransaction);
          for (const item of cart) {
            const current = await localDb.commodities.get(item.commodity.id);
            if (current) {
              await localDb.commodities.update(item.commodity.id, {
                available_stock: Math.max(0, current.available_stock - item.qty)
              });
            }
          }
        }
        await queueForSync('sale', 'create', newTransaction);
        triggerSync();
      }

      showToast('Pembayaran QRIS Kasir Berhasil!');
      setCompletedTx(newTransaction);
      setCart([]);
      setSelectedMemberId('');
      setCustomerName('');
      setCustomerWa('');
      setPaymentMethod('Tunai');
      setAmountPaid(0);
      setShowQrisModal(false);
      setIsMobileCartOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast('Pembayaran QRIS gagal diproses', 'error');
    } finally {
      setQrisVerifying(false);
    }
  };

  // Shared Cart Panel Element to reuse
  const renderCartContent = () => (
    <div className="space-y-4 text-xs font-semibold text-slate-700">
      <div className="min-h-[140px] max-h-[300px] overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-semibold">Keranjang kosong.</div>
        ) : (
          cart.map(item => (
            <div key={item.commodity.id} className="flex justify-between items-center border-b border-slate-105 pb-2 last:border-0 last:pb-0">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 block truncate max-w-[130px]">{item.commodity.name}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">Rp {item.price.toLocaleString('id-ID')} / {item.commodity.unit}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.qty}
                  onChange={e => updateCartQty(item.commodity.id, parseFloat(e.target.value) || 0, item.commodity.available_stock)}
                  className="w-12 px-1 py-1 text-center border border-slate-250 rounded-md text-xs font-semibold bg-white focus:outline-none"
                />
                <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider w-8">{item.commodity.unit}</span>
                <span className="font-semibold text-slate-800 w-16 text-right">
                  Rp {(item.qty * item.price).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CustomSelect
          label="Anggota:"
          options={[
            { value: '', label: '-- Umum --' },
            ...members.map(m => ({ value: m.id, label: m.name }))
          ]}
          value={selectedMemberId}
          onChange={handleSelectMember}
        />
        <CustomSelect
          label="Pembayaran:"
          options={[
            { value: 'Tunai', label: 'Tunai' },
            { value: 'Transfer', label: 'Transfer' },
            { value: 'Simpanan', label: 'Simpanan' },
            { value: 'QRIS', label: 'QRIS (GPN)' }
          ]}
          value={paymentMethod}
          onChange={(val) => setPaymentMethod(val as any)}
        />
      </div>

      {/* Buyer identity for the WhatsApp digital receipt (struk). Optional —
          leave blank for walk-in buyers who don't want a receipt. */}
      <div className="space-y-2 bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
        <span className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="h-3 w-3" /> Struk WhatsApp (opsional)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-slate-450 block">Nama Pembeli</label>
            <input
              type="text"
              placeholder="cth: Ibu Sari"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-slate-450 block">No. WhatsApp</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="cth: 081234567890"
              value={customerWa}
              onChange={e => setCustomerWa(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>
        </div>
      </div>

      {/* Cash tendered + change (Tunai only) */}
      {paymentMethod === 'Tunai' && (
        <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="h-3 w-3 text-brand-orange" /> Uang Diterima
            </label>
            <span className="text-[9px] font-semibold text-slate-400">Total: Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={amountPaid || ''}
            onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy text-right"
          />
          <div className="flex flex-wrap gap-1.5">
            {cashSuggestions.map((amt, i) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountPaid(amt)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${amountPaid === amt ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
              >
                {i === 0 ? 'Uang Pas' : `Rp ${amt.toLocaleString('id-ID')}`}
              </button>
            ))}
          </div>
          {amountPaid > 0 && (
            <div className={`flex justify-between items-center pt-1.5 border-t border-slate-200 text-xs font-semibold ${changeDue < 0 ? 'text-brand-red' : 'text-emerald-600'}`}>
              <span className="uppercase tracking-wider text-[10px]">{changeDue < 0 ? 'Uang Kurang' : 'Kembalian'}</span>
              <span>Rp {Math.abs(changeDue).toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
        <div>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Total Tagihan</span>
          <span className="text-base font-semibold text-brand-navy">Rp {totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <Button
          onClick={handleCheckout}
          disabled={cart.length === 0 || saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1"
        >
          {saving ? 'Proses...' : 'Bayar Sekarang'} <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

      {/* 1. Commodities Picker list */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Produk Tersedia</CardTitle>
            <CardDescription className="text-xs">Sentuh kartu komoditas untuk memasukkan ke keranjang</CardDescription>
          </div>
          <div className="relative w-48 shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-y-auto pr-2">
          {filteredCommodities.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold uppercase">
              Tidak ada produk dengan stok tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCommodities.map(c => {
                const inCart = cart.find(item => item.commodity.id === c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => addToCart(c)}
                    className="p-3.5 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100/50 hover:border-slate-200 transition-all cursor-pointer flex justify-between items-center relative overflow-hidden group active:scale-[0.98]"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-slate-800">{c.name}</h4>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase block">{c.category}</span>
                      <span className="text-[10px] font-semibold text-brand-orange pt-1.5 block">Rp {(c.price_per_unit || 12000).toLocaleString('id-ID')} / {c.unit}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-450 font-semibold uppercase tracking-wider block">Stok</span>
                      <span className="text-xs font-semibold text-slate-700">{c.available_stock.toLocaleString('id-ID')} {c.unit}</span>
                    </div>
                    {inCart && (
                      <span className="absolute top-0 right-0 bg-brand-red text-white text-[9px] font-semibold px-2 py-0.5 rounded-bl-lg shadow-sm">
                        {inCart.qty.toLocaleString('id-ID')} {c.unit}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Desktop Cart panel (sidebar) */}
      <Card className="hidden lg:block border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <ShoppingCart className="h-4.5 w-4.5 text-brand-red" /> Keranjang Belanja ({totalItemsCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {renderCartContent()}
        </CardContent>
      </Card>

      {/* 3. Mobile Cart Trigger bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:hidden z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Total</span>
            <span className="text-base font-semibold text-brand-orange">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <Button
            onClick={() => setIsMobileCartOpen(true)}
            className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1"
          >
            Lihat Keranjang ({totalItemsCount}) <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* 4. Mobile Bottom Sheet Cart overlay */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileCartOpen(false)}
          />
          {/* Bottom Sheet drawer panel */}
          <div className="relative bg-white rounded-t-3xl p-5 shadow-2xl space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="h-4.5 w-4.5 text-brand-red" /> Detail Keranjang
              </h3>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderCartContent()}
          </div>
        </div>
      )}

      {/* 5. QRIS Payment Gateway Modal for POS */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-sans text-slate-800 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <CreditCard className="h-5 w-5 text-brand-navy animate-pulse" />
                QRIS Dinamis Kasir (POS)
              </h3>
              {!qrisVerifying && (
                <button onClick={() => setShowQrisModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* QRIS Simulated QR Code Graphic */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-3">
              <div className="bg-[#E52A30] px-4 py-1 rounded-full flex items-center justify-center gap-1 text-white font-semibold text-[9px] tracking-widest uppercase shadow-xs">
                <span>QRIS</span>
                <span className="text-[7px] font-medium opacity-80">GPN</span>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=003049&data=aruna-pos-qris-${totalAmount}`}
                  alt="QRIS QR Code"
                  className="w-40 h-40 rounded-lg object-contain"
                />
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-[9px] text-slate-400 block font-semibold uppercase">Sisa Waktu Pembayaran</span>
                <span className="text-xs font-semibold text-brand-navy font-mono animate-pulse">02:59</span>
              </div>
            </div>

            {/* Total Amount Box */}
            <div className="bg-brand-navy/5 border border-brand-navy/10 p-3.5 rounded-xl flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500 uppercase text-[9px] font-semibold">Total Tagihan POS</span>
              <span className="text-base font-semibold text-brand-orange tabular-nums">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowQrisModal(false)}
                disabled={qrisVerifying}
                variant="outline"
                className="flex-1 text-xs cursor-pointer rounded-xl h-11"
              >
                Batal
              </Button>
              <Button
                onClick={confirmQrisCheckout}
                disabled={qrisVerifying}
                className="flex-2 bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
              >
                {qrisVerifying ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin text-brand-cream" />
                    Memproses...
                  </>
                ) : (
                  'Sudah Scan & Bayar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Digital receipt (struk) modal — send PDF to buyer via WhatsApp */}
      {completedTx && (
        <ReceiptModal
          tx={completedTx}
          coop={coop}
          onClose={() => setCompletedTx(null)}
        />
      )}

    </div>
  );
}

// ─── MODULE: INVENTORY & STOCK OPNAME ──────────────────────────────────────────
function InventoryModule({ coopId, commodities, onRefresh, showToast }: {
  coopId: string; commodities: Commodity[]; onRefresh: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showOpname, setShowOpname] = useState(false);
  const [saving, setSaving] = useState(false);

  // New commodity form state
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Pangan',
    monthly_capacity: 0,
    available_stock: 0,
    minimum_stock: 0,
    price_per_unit: 0,
    unit: 'Ton',
    harvest_period: '',
    description: ''
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [editProductImage, setEditProductImage] = useState<File | null>(null);

  // Stock opname audit state
  const [selectedCommId, setSelectedCommId] = useState('');
  const [actualStock, setActualStock] = useState(0);
  const [opnameReason, setOpnameReason] = useState('');

  const activeCommodity = commodities.find(c => c.id === selectedCommId);

  // Edit commodity form state
  const [editingComm, setEditingComm] = useState<Commodity | null>(null);
  const [deletingComm, setDeletingComm] = useState<Commodity | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    category: 'Pangan',
    monthly_capacity: 0,
    available_stock: 0,
    minimum_stock: 0,
    price_per_unit: 0,
    unit: 'Kg',
    harvest_period: '',
    description: ''
  });

  const startEdit = (c: Commodity) => {
    setEditingComm(c);
    setEditProductImage(null);
    setEditForm({
      name: c.name,
      sku: c.sku,
      category: c.category,
      monthly_capacity: c.monthly_capacity,
      available_stock: c.available_stock,
      minimum_stock: c.minimum_stock || 0,
      price_per_unit: c.price_per_unit || 0,
      unit: c.unit,
      harvest_period: c.harvest_period || '',
      description: c.description || ''
    });
  };

  const handleEditProduct = async () => {
    if (!editingComm) return;
    if (!editForm.name.trim()) return showToast('Nama komoditas wajib diisi', 'error');
    if (editForm.monthly_capacity <= 0) return showToast('Kapasitas bulanan harus lebih besar dari 0', 'error');
    if (editForm.available_stock < 0) return showToast('Stok tersedia tidak boleh kurang dari 0', 'error');
    setSaving(true);
    try {
      const normalizedName = normalizeProductName(editForm.name);

      let imageUrl = editingComm.image_url || '';
      if (editProductImage) {
        imageUrl = await uploadDocument(editProductImage, `products/${coopId}/${Date.now()}_${editProductImage.name}`);
      }

      const updatedProduct = {
        ...editingComm,
        name: normalizedName,
        sku: editForm.sku.trim() || generateSKU(normalizedName),
        category: editForm.category,
        monthly_capacity: editForm.monthly_capacity,
        available_stock: editForm.available_stock,
        minimum_stock: editForm.minimum_stock || undefined,
        price_per_unit: editForm.price_per_unit || undefined,
        unit: normalizeUnit(editForm.unit),
        harvest_period: editForm.harvest_period || 'Sepanjang Tahun',
        description: editForm.description.trim() || undefined,
        image_url: imageUrl || undefined
      };

      if (isOnline()) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'product', action: 'update', payload: updatedProduct })
        });
        showToast('Komoditas berhasil diperbarui!');
      } else {
        if (localDb) {
          await localDb.commodities.put(updatedProduct);
        }
        await queueForSync('product', 'update', updatedProduct);
        triggerSync();
        showToast('Komoditas diperbarui secara lokal!');
      }

      setEditingComm(null);
      onRefresh();
    } catch (e) {
      showToast('Gagal memperbarui produk', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingComm) return;
    setSaving(true);
    try {
      if (isOnline()) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'product', action: 'delete', payload: { id: deletingComm.id } })
        });
        showToast('Komoditas berhasil dihapus!');
      } else {
        if (localDb) {
          await localDb.commodities.delete(deletingComm.id);
        }
        await queueForSync('product', 'delete', { id: deletingComm.id });
        triggerSync();
        showToast('Komoditas dihapus secara lokal!');
      }
      setDeletingComm(null);
      onRefresh();
    } catch (e) {
      showToast('Gagal menghapus produk', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    const commodity = commodities.find(c => c.id === id);
    if (commodity) {
      setDeletingComm(commodity);
    }
  };

  const handleAddProduct = async () => {
    if (!form.name.trim()) return showToast('Nama komoditas wajib diisi', 'error');
    if (form.monthly_capacity <= 0) return showToast('Kapasitas bulanan harus lebih besar dari 0', 'error');
    if (form.available_stock < 0) return showToast('Stok awal tidak boleh kurang dari 0', 'error');
    setSaving(true);
    try {
      const normalizedName = normalizeProductName(form.name);
      const generatedSku = form.sku.trim() || generateSKU(normalizedName);

      let imageUrl = '';
      if (productImage) {
        imageUrl = await uploadDocument(productImage, `products/${coopId}/${Date.now()}_${productImage.name}`);
      }

      if (isOnline()) {
        const commodity_id = doc(collection(db, 'commodities')).id;
        const newProduct = {
          id: commodity_id,
          cooperative_id: coopId,
          name: normalizedName,
          sku: generatedSku,
          category: form.category,
          monthly_capacity: form.monthly_capacity,
          available_stock: form.available_stock,
          minimum_stock: form.minimum_stock || undefined,
          price_per_unit: form.price_per_unit || undefined,
          unit: normalizeUnit(form.unit),
          harvest_period: form.harvest_period || 'Sepanjang Tahun',
          description: form.description.trim() || undefined,
          image_url: imageUrl || undefined,
          created_at: new Date().toISOString()
        };
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'product', action: 'create', payload: newProduct })
        });
        showToast('Komoditas baru berhasil ditambahkan!');
      } else {
        const newProduct: Commodity = {
          id: `new-prod-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
          cooperative_id: coopId,
          name: normalizedName,
          sku: generatedSku,
          category: form.category,
          monthly_capacity: form.monthly_capacity,
          available_stock: form.available_stock,
          minimum_stock: form.minimum_stock || undefined,
          price_per_unit: form.price_per_unit || undefined,
          unit: normalizeUnit(form.unit),
          harvest_period: form.harvest_period || 'Sepanjang Tahun',
          description: form.description.trim() || undefined,
          image_url: imageUrl || undefined,
          created_at: new Date().toISOString()
        };
        if (localDb) {
          await localDb.commodities.add(newProduct);
        }
        await queueForSync('product', 'create', newProduct);
        triggerSync();
        showToast('Komoditas baru ditambahkan lokal!');
      }

      setForm({
        name: '',
        sku: '',
        category: 'Pangan',
        monthly_capacity: 0,
        available_stock: 0,
        minimum_stock: 0,
        price_per_unit: 0,
        unit: 'Ton',
        harvest_period: '',
        description: ''
      });
      setProductImage(null);
      setShowForm(false);
      onRefresh();
    } catch (e) {
      showToast('Gagal menambahkan produk', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStockOpname = async () => {
    if (!selectedCommId || !activeCommodity) return showToast('Pilih komoditas terlebih dahulu', 'error');
    if (actualStock < 0) return showToast('Stok aktual tidak boleh kurang dari 0', 'error');
    if (!opnameReason.trim()) return showToast('Alasan penyesuaian harus diisi', 'error');

    setSaving(true);
    try {
      const systemStock = activeCommodity.available_stock;
      const difference = actualStock - systemStock;

      const opnameRecord: StockOpname = {
        id: `opname-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        cooperative_id: coopId,
        commodity_id: selectedCommId,
        commodity_name: activeCommodity.name,
        system_stock: systemStock,
        actual_stock: actualStock,
        difference: difference,
        reason: opnameReason,
        created_at: new Date().toISOString(),
        status: 'pending'
      };

      if (isOnline()) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'stock_opname', action: 'create', payload: opnameRecord })
        });
        showToast(`Stock Opname berhasil dicatat! Selisih ${difference > 0 ? '+' : ''}${difference} ${activeCommodity.unit} disesuaikan.`);
      } else {
        if (localDb) {
          await localDb.stock_opnames.add(opnameRecord);
          await localDb.commodities.update(selectedCommId, { available_stock: actualStock });
        }
        await queueForSync('stock_opname', 'create', opnameRecord);
        triggerSync();
        showToast(`Stock Opname berhasil dicatat! Selisih ${difference > 0 ? '+' : ''}${difference} ${activeCommodity.unit} disesuaikan. (lokal)`);
      }

      setSelectedCommId('');
      setActualStock(0);
      setOpnameReason('');
      setShowOpname(false);
      onRefresh();
    } catch (e) {
      showToast('Gagal mencatat Stock Opname', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top action triggers */}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          onClick={() => { setShowOpname(false); setShowForm(!showForm); }}
          className="bg-brand-navy hover:bg-brand-navy/95 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-xl h-9"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Tutup Form' : 'Tambah Komoditas Baru'}
        </Button>
        <Button
          size="sm"
          onClick={() => { setShowForm(false); setShowOpname(!showOpname); }}
          className="bg-brand-orange hover:bg-brand-orange/95 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-xl h-9"
        >
          {showOpname ? <X className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
          {showOpname ? 'Tutup Opname' : 'Stock Opname (Audit)'}
        </Button>
      </div>

      {/* Product Form */}
      {showForm && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 mb-4">
            <CardTitle className="text-sm font-semibold text-brand-navy">Tambah Produk Baru ke Koperasi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal text-slate-700">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Nama Komoditas <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="cth: Jagung Hibrida Pioneer"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                SKU (Stock Keeping Unit) <span className="text-slate-400 font-medium lowercase">(opsional)</span>:
              </label>
              <input
                type="text"
                placeholder="cth: BRS-PMR-001 (Kosongkan untuk auto-generate)"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <CustomSelect
              label={
                <>
                  Kategori <span className="text-red-500">*</span>:
                </>
              }
              options={INVENTORY_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
              value={form.category}
              onChange={val => setForm({ ...form, category: val })}
            />
            <CustomSelect
              label={
                <>
                  Satuan Ukur <span className="text-red-500">*</span>:
                </>
              }
              options={INVENTORY_UNITS.map(un => ({ value: un, label: un }))}
              value={form.unit}
              onChange={val => setForm({ ...form, unit: val })}
            />
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Kapasitas Bulanan ({form.unit}) <span className="text-red-500">*</span>:
              </label>
              <input
                type="number"
                value={form.monthly_capacity}
                onChange={e => setForm({ ...form, monthly_capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Stok Awal ({form.unit}) <span className="text-red-500">*</span>:
              </label>
              <input
                type="number"
                value={form.available_stock}
                onChange={e => setForm({ ...form, available_stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Harga Satuan Standar (Rp) <span className="text-slate-400 font-medium lowercase">(opsional)</span>:
              </label>
              <input
                type="number"
                placeholder="cth: 12000"
                value={form.price_per_unit || ''}
                onChange={e => setForm({ ...form, price_per_unit: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Ambang Batas Stok Minimum <span className="text-slate-400 font-medium lowercase">(opsional)</span>:
              </label>
              <input
                type="number"
                placeholder="cth: 5"
                value={form.minimum_stock || ''}
                onChange={e => setForm({ ...form, minimum_stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Musim Panen / Keterangan <span className="text-slate-400 font-medium lowercase">(opsional)</span>:
              </label>
              <input
                type="text"
                placeholder="cth: April - Juni"
                value={form.harvest_period}
                onChange={e => setForm({ ...form, harvest_period: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Deskripsi / Spesifikasi Produk <span className="text-slate-400 font-medium lowercase">(opsional)</span>:
              </label>
              <input
                type="text"
                placeholder="cth: Beras organik lokal premium, kadar air < 14%"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Foto Produk <span className="text-slate-400 font-medium lowercase">(opsional)</span>:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setProductImage(e.target.files[0]);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button
                onClick={handleAddProduct}
                disabled={saving}
                className="bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold px-6 py-2.5 rounded-xl text-xs cursor-pointer h-10"
              >
                {saving ? 'Menyimpan...' : 'Simpan Komoditas'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Opname Form */}
      {showOpname && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 mb-4">
            <CardTitle className="text-sm font-semibold text-brand-orange">Stock Opname / Rekonsiliasi Audit</CardTitle>
            <CardDescription className="text-xs">Sesuaikan data stok sistem dengan perhitungan fisik di koperasi</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-normal text-slate-700">
            <CustomSelect
              label={
                <>
                  Pilih Komoditas <span className="text-red-500">*</span>:
                </>
              }
              options={[
                { value: '', label: '-- Pilih --' },
                ...commodities.map(c => ({ value: c.id, label: `${c.name} (Sistem: ${c.available_stock} ${c.unit})` }))
              ]}
              value={selectedCommId}
              onChange={val => {
                setSelectedCommId(val);
                const selected = commodities.find(c => c.id === val);
                setActualStock(selected ? selected.available_stock : 0);
              }}
            />

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Jumlah Fisik Aktual <span className="text-red-500">*</span>:
              </label>
              <input
                type="number"
                value={actualStock}
                onChange={e => setActualStock(parseInt(e.target.value) || 0)}
                disabled={!selectedCommId}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none disabled:opacity-50"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Alasan Penyesuaian (Audit Log) <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="cth: Penyusutan berat beras karena kadar air menyusut"
                value={opnameReason}
                onChange={e => setOpnameReason(e.target.value)}
                disabled={!selectedCommId}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none disabled:opacity-50"
              />
            </div>

            {activeCommodity && (
              <div className="sm:col-span-2 bg-slate-100 p-3.5 rounded-xl text-xs font-semibold text-slate-700 flex justify-between">
                <span>Stok Terdaftar: {activeCommodity.available_stock.toLocaleString('id-ID')} {activeCommodity.unit}</span>
                <span>Perhitungan Fisik: {actualStock} {activeCommodity.unit}</span>
                <span className={`font-semibold ${actualStock - activeCommodity.available_stock >= 0 ? 'text-emerald-700' : 'text-brand-red'}`}>
                  Selisih: {(actualStock - activeCommodity.available_stock).toLocaleString('id-ID')} {activeCommodity.unit}
                </span>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end">
              <Button
                onClick={handleStockOpname}
                disabled={saving || !selectedCommId}
                className="bg-brand-orange hover:bg-brand-orange/95 text-white font-semibold px-6 py-2.5 rounded-xl text-xs cursor-pointer h-10 disabled:opacity-50"
              >
                {saving ? 'Memproses...' : 'Kunci Penyesuaian Stok'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid listing products */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900">Daftar Stok Inventori Koperasi</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {commodities.map(c => {
              const isLowStock = c.minimum_stock !== undefined && c.available_stock <= c.minimum_stock;
              return (
                <div key={c.id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${isLowStock ? 'border-red-200 bg-red-50/10' : 'border-slate-100 bg-slate-50'
                  }`}>
                  <div className="flex justify-between items-start gap-3">
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-semibold uppercase text-slate-450 bg-slate-200/50 px-2 py-0.5 rounded-full">{c.category}</span>
                        <span className="text-[9px] font-semibold uppercase text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full font-mono">SKU: {c.sku || 'N/A'}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800">{c.name}</h4>
                      {c.description && <p className="text-[10px] text-slate-550 font-medium leading-normal line-clamp-2">{c.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-700 block">{c.available_stock.toLocaleString('id-ID')} {c.unit}</span>
                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Kap: {c.monthly_capacity} {c.unit}</span>
                      {c.price_per_unit && (
                        <span className="text-[9.5px] text-brand-orange font-semibold block mt-0.5">
                          Rp {c.price_per_unit.toLocaleString('id-ID')} / {c.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {isLowStock && (
                    <div className="text-[9.5px] font-semibold text-brand-red bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 animate-pulse">
                      <ShieldAlert className="h-3.5 w-3.5" /> Stok Menipis (Batas: {(c.minimum_stock ?? 0).toLocaleString('id-ID')} {c.unit})
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-semibold text-slate-500 shrink-0">
                    <span>Panen: {c.harvest_period}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-slate-450 hover:text-brand-navy transition-colors p-0.5 rounded cursor-pointer"
                        title="Edit Detail Produk"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(c.id, c.name)}
                        className="text-slate-450 hover:text-brand-red transition-colors p-0.5 rounded cursor-pointer"
                        title="Hapus Produk"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-brand-orange font-semibold flex items-center gap-0.5 ml-1">
                        <Database className="h-3 w-3" /> Lokal
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Edit Produk */}
      {editingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setEditingComm(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-w-lg w-full z-50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Pencil className="h-4.5 w-4.5 text-brand-navy" /> Edit Komoditas: {editingComm.name}
              </h3>
              <button
                onClick={() => setEditingComm(null)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Nama Komoditas <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  SKU / Kode Unik:
                </label>
                <input
                  type="text"
                  placeholder="Opsional (Otomatis jika kosong)"
                  value={editForm.sku}
                  onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <CustomSelect
                label="Kategori Produk *:"
                options={INVENTORY_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                value={editForm.category}
                onChange={val => setEditForm({ ...editForm, category: val })}
              />

              <CustomSelect
                label="Satuan Ukur *:"
                options={INVENTORY_UNITS.map(un => ({ value: un, label: un }))}
                value={editForm.unit}
                onChange={val => setEditForm({ ...editForm, unit: val })}
              />

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Kapasitas Bulanan ({editForm.unit}) *:
                </label>
                <input
                  type="number"
                  value={editForm.monthly_capacity}
                  onChange={e => setEditForm({ ...editForm, monthly_capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Stok Tersedia ({editForm.unit}) *:
                </label>
                <input
                  type="number"
                  value={editForm.available_stock}
                  onChange={e => setEditForm({ ...editForm, available_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Harga Satuan Standar (Rp) (opsional):
                </label>
                <input
                  type="number"
                  placeholder="cth: 12000"
                  value={editForm.price_per_unit || ''}
                  onChange={e => setEditForm({ ...editForm, price_per_unit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Batas Stok Minimum (opsional):
                </label>
                <input
                  type="number"
                  placeholder="cth: 5"
                  value={editForm.minimum_stock || ''}
                  onChange={e => setEditForm({ ...editForm, minimum_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Musim Panen / Keterangan (opsional):
                </label>
                <input
                  type="text"
                  placeholder="cth: April - Juni"
                  value={editForm.harvest_period}
                  onChange={e => setEditForm({ ...editForm, harvest_period: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Deskripsi Singkat (opsional):
                </label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none resize-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block font-semibold">
                  Ganti Foto Produk (opsional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setEditProductImage(e.target.files[0]);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <Button
                onClick={() => setEditingComm(null)}
                variant="outline"
                className="text-xs px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={handleEditProduct}
                disabled={saving}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs px-5 py-2 rounded-xl shadow-md font-semibold"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Produk */}
      {deletingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
            onClick={() => setDeletingComm(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-w-sm w-full z-50 border border-slate-200 animate-scale-up">
            <div className="flex items-center gap-2 text-brand-red">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">
                Konfirmasi Hapus Produk
              </h3>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus komoditas <span className="font-semibold text-slate-800">"{deletingComm.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
              <Button
                onClick={() => setDeletingComm(null)}
                variant="outline"
                className="text-xs px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-pointer hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                onClick={confirmDeleteProduct}
                disabled={saving}
                className="bg-brand-red hover:bg-brand-red/90 text-white text-xs px-5 py-2 rounded-xl shadow-md font-semibold cursor-pointer"
              >
                {saving ? 'Menghapus...' : 'Hapus Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── MODULE: PEMBELIAN (PENGADAAN/STOK MASUK) ─────────────────────────────────
function PurchaseModule({ coopId, commodities, onRefresh, showToast }: {
  coopId: string; commodities: Commodity[]; onRefresh: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [selectedCommId, setSelectedCommId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [saving, setSaving] = useState(false);

  const activeCommodity = commodities.find(c => c.id === selectedCommId);

  const handlePurchase = async () => {
    if (!selectedCommId || !activeCommodity) return showToast('Pilih produk terlebih dahulu', 'error');
    if (purchaseQty <= 0) return showToast('Kuantitas pembelian harus lebih dari 0', 'error');
    if (!supplierName.trim()) return showToast('Nama petani atau pemasok wajib diisi', 'error');

    setSaving(true);
    try {
      const pricePerKg = 8000;
      const totalAmount = purchaseQty * pricePerKg;

      const newPurchase: PurchaseTransaction = {
        id: `purchase-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        cooperative_id: coopId,
        supplier_name: supplierName.trim(),
        items: [{
          commodity_id: selectedCommId,
          commodity_name: activeCommodity.name,
          quantity: purchaseQty,
          price_per_kg: pricePerKg,
          unit: activeCommodity.unit
        }],
        total_amount: totalAmount,
        created_at: new Date().toISOString(),
        status: 'pending',
        version: 1
      };

      if (isOnline()) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'purchase', action: 'create', payload: newPurchase })
        });
        showToast(`Pencatatan pembelian ${purchaseQty} ${activeCommodity.unit} dari ${supplierName} berhasil!`);
      } else {
        if (localDb) {
          await localDb.purchases.add(newPurchase);
          await localDb.commodities.update(selectedCommId, {
            available_stock: activeCommodity.available_stock + purchaseQty
          });
        }
        await queueForSync('purchase', 'create', newPurchase);
        triggerSync();
        showToast(`Pencatatan pembelian ${purchaseQty} ${activeCommodity.unit} dari ${supplierName} berhasil! (lokal/offline)`);
      }
      setSelectedCommId('');
      setPurchaseQty(0);
      setSupplierName('');
      onRefresh();
    } catch (e) {
      showToast('Gagal mencatat pembelian', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 mb-4">
        <CardTitle className="text-sm font-semibold text-slate-900">Catat Pembelian Stok Masuk dari Petani / Supplier</CardTitle>
        <CardDescription className="text-xs">Sistem akan secara otomatis mendebit pengadaan dan meningkatkan volume ketersediaan stok produk.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-normal text-slate-700">
        <CustomSelect
          label={
            <>
              Pilih Produk <span className="text-red-500">*</span>:
            </>
          }
          options={[
            { value: '', label: '-- Pilih --' },
            ...commodities.map(c => ({ value: c.id, label: `${c.name} (Stok: ${c.available_stock} ${c.unit})` }))
          ]}
          value={selectedCommId}
          onChange={setSelectedCommId}
        />

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 block">
            Kuantitas Masuk <span className="text-red-500">*</span>:
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={purchaseQty}
            onChange={e => setPurchaseQty(parseFloat(e.target.value) || 0)}
            disabled={!selectedCommId}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 block">
            Nama Petani / Supplier <span className="text-red-500">*</span>:
          </label>
          <input
            type="text"
            placeholder="cth: Kelompok Tani Budi"
            value={supplierName}
            onChange={e => setSupplierName(e.target.value)}
            disabled={!selectedCommId}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <Button
            onClick={handlePurchase}
            disabled={saving || !selectedCommId}
            className="bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold px-6 py-2.5 rounded-xl text-xs cursor-pointer h-10 disabled:opacity-50"
          >
            {saving ? 'Mencatat...' : 'Catat Stok Masuk'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MODULE: SALES & PURCHASES HISTORY ────────────────────────────────────────
function SalesHistoryModule({ sales, purchases }: {
  sales: POSTransaction[]; purchases: PurchaseTransaction[];
}) {
  const [tab, setTab] = useState<'sales' | 'purchases'>('sales');

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-4 mb-4">
        <CardTitle className="text-sm font-semibold text-slate-900">Riwayat Pembukuan Transaksi</CardTitle>
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold shrink-0">
          <button
            onClick={() => setTab('sales')}
            className={`px-3 py-1.5 rounded ${tab === 'sales' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-500'}`}
          >
            Penjualan (Kasir)
          </button>
          <button
            onClick={() => setTab('purchases')}
            className={`px-3 py-1.5 rounded ${tab === 'purchases' ? 'bg-white text-brand-navy shadow-xs' : 'text-slate-500'}`}
          >
            Pembelian (Pemasok)
          </button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto pr-2">
        {tab === 'sales' ? (
          sales.length === 0 ? (
            <div className="text-center py-12 text-slate-450 font-semibold uppercase text-xs">Belum ada riwayat transaksi penjualan.</div>
          ) : (
            <div className="space-y-2">
              {sales.map(s => (
                <div key={s.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-800">
                      Sale #{s.id.split('-')[1] || s.id.substring(0, 8)}
                    </h5>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">
                      {new Date(s.created_at).toLocaleString('id-ID')} &bull; {s.payment_method}
                    </span>
                    <span className="text-[10px] text-slate-600 mt-1 block">
                      {s.items.map(i => `${i.commodity_name} x ${i.quantity} ${i.unit}`).join(', ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900 block">Rp {s.total_amount.toLocaleString('id-ID')}</span>
                    <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded uppercase mt-1.5 ${s.status === 'synced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                      {s.status === 'synced' ? 'Synced' : 'Local'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          purchases.length === 0 ? (
            <div className="text-center py-12 text-slate-455 font-semibold uppercase text-xs">Belum ada riwayat pembelian.</div>
          ) : (
            <div className="space-y-2">
              {purchases.map(p => (
                <div key={p.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-800">
                      Pemasok: {p.supplier_name}
                    </h5>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block mt-0.5">
                      {new Date(p.created_at).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-650 mt-1 block">
                      {p.items.map(i => `${i.commodity_name} x ${i.quantity} ${i.unit}`).join(', ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900 block">Rp {p.total_amount.toLocaleString('id-ID')}</span>
                    <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded uppercase mt-1.5 ${p.status === 'synced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                      {p.status === 'synced' ? 'Synced' : 'Local'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

// ─── MODULE: MEMBER MANAGEMENT ────────────────────────────────────────────────
function MemberModule({ coopId, members, onRefresh, showToast }: {
  coopId: string; members: Member[]; onRefresh: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const handleAddMember = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return showToast('Nama, telepon, dan alamat anggota wajib diisi', 'error');

    setSaving(true);
    try {
      const newMember: Member = {
        id: `mem-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        cooperative_id: coopId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || 'Desa Merah Putih',
        joined_at: new Date().toISOString()
      };

      if (isOnline()) {
        const docRef = doc(collection(db, 'members'));
        const onlineMember = {
          ...newMember,
          id: docRef.id
        };
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: 'member', action: 'create', payload: onlineMember })
        });
        showToast(`Anggota baru ${form.name} berhasil ditambahkan!`);
      } else {
        if (localDb) {
          await localDb.members.add(newMember);
        }
        await queueForSync('member', 'create', newMember);
        triggerSync();
        showToast(`Anggota baru ${form.name} berhasil ditambahkan lokal!`);
      }
      setForm({ name: '', phone: '', address: '' });
      setShowAdd(false);
      onRefresh();
    } catch (e) {
      showToast('Gagal menambahkan anggota', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top action trigger */}
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="bg-brand-navy hover:bg-brand-navy/95 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-xl h-9"
        >
          {showAdd ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showAdd ? 'Tutup Formulir' : 'Daftarkan Anggota Baru'}
        </Button>
      </div>

      {/* Register form */}
      {showAdd && (
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 mb-4">
            <CardTitle className="text-sm font-semibold text-brand-navy">Pendaftaran Anggota Koperasi Baru</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-normal text-slate-700">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Nama Lengkap Anggota Tani <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="cth: Pak Subarjo"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                No. Telepon / WA <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="cth: 08123456789"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 block">
                Alamat Rumah <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                placeholder="cth: RT 03 Dusun Tani Makmur"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button
                onClick={handleAddMember}
                disabled={saving}
                className="bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold px-6 py-2.5 rounded-xl text-xs cursor-pointer h-10"
              >
                {saving ? 'Mendaftar...' : 'Daftarkan Anggota'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member lists table */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900">Daftar Keanggotaan Gotong Royong Desa</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase text-slate-400 bg-slate-50">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">No. Telepon</th>
                  <th className="py-3 px-4">Alamat Rumah</th>
                  <th className="py-3 px-4">Tanggal Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{m.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-650">{m.phone}</td>
                    <td className="py-3.5 px-4 text-slate-500">{m.address}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold">{new Date(m.joined_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// ─── MODULE: REPORTING & ANALYTICS (LOCAL GRAPHS) ─────────────────────────────
function ReportingModule({ sales, purchases, members, commodities }: {
  sales: POSTransaction[]; purchases: PurchaseTransaction[]; members: Member[]; commodities: Commodity[];
}) {
  const chartData = sales.reduce((acc: any[], current) => {
    const dateStr = new Date(current.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    const existing = acc.find(x => x.name === dateStr);
    if (existing) {
      existing.omzet += current.total_amount;
      existing.transaksi += 1;
    } else {
      acc.push({ name: dateStr, omzet: current.total_amount, transaksi: 1 });
    }
    return acc;
  }, []).reverse().slice(-7);

  const totalOmzet = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalPurchase = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const netEarnings = totalOmzet - totalPurchase;

  return (
    <div className="space-y-6">

      {/* Visual financial metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Total Penjualan (Omzet)</span>
              <span className="text-base font-semibold text-slate-900">Rp {totalOmzet.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-brand-red/5 text-brand-red flex items-center justify-center border border-brand-red/10">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Total Pembelian (Modal)</span>
              <span className="text-base font-semibold text-slate-900">Rp {totalPurchase.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-brand-orange/5 text-brand-orange flex items-center justify-center border border-brand-orange/10">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Surplus Operasional</span>
              <span className={`text-base font-semibold ${netEarnings >= 0 ? 'text-emerald-700' : 'text-brand-red'}`}>
                Rp {netEarnings.toLocaleString('id-ID')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 mb-4">
            <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Tren Penjualan Harian (Omzet)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">Belum ada data kasir.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={600} />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight={600} />
                  <Tooltip />
                  <Line type="monotone" dataKey="omzet" stroke="#123042" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 mb-4">
            <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Kapasitas Bulanan vs Tersedia (Inventori)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {commodities.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold font-sans">Belum ada komoditas.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commodities.slice(0, 5).map(c => ({ name: c.name, stok: c.available_stock, kapasitas: c.monthly_capacity }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={600} />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight={600} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stok" fill="#ea7a12" radius={[4, 4, 0, 0]} name="Stok Tersedia" />
                  <Bar dataKey="kapasitas" fill="#123042" radius={[4, 4, 0, 0]} name="Kapasitas Bulanan" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ─── MODULE: CONNECTOR & PROCUREMENT MODULE (Layer 2 & 3) ───────────────────────────
function ConnectorModule({ coopId, showToast }: { coopId: string; showToast: (m: string, t?: 'success' | 'error') => void; }) {
  const [trades, setTrades] = useState<CooperativeConnectorTrade[]>([]);
  const [procurements, setProcurements] = useState<CollaborativeProcurement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnectorData = useCallback(async () => {
    if (!localDb) return;
    setLoading(true);
    try {
      const localTrades = await localDb.connector_trades.toArray();
      setTrades(localTrades);

      const localProcs = await localDb.procurements.toArray();
      setProcurements(localProcs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectorData();
  }, [fetchConnectorData]);

  const handleActionTrade = async (id: string, action: 'proses' | 'tolak') => {
    if (!localDb) return;
    try {
      if (action === 'proses') {
        await localDb.connector_trades.update(id, { status: 'Diproses' });
        showToast('Rekomendasi transfer stok disetujui.');
      } else {
        await localDb.connector_trades.delete(id);
        showToast('Rekomendasi transfer stok diarsipkan.');
      }
      fetchConnectorData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinProcurement = async (id: string) => {
    if (!localDb) return;
    try {
      const active = await localDb.procurements.get(id);
      if (active) {
        await localDb.procurements.update(id, {
          current_quantity: Math.min(active.target_quantity, active.current_quantity + 10)
        });
        showToast(`Koperasi Anda berhasil mengajukan kuota 10 ${active.unit}!`);
        fetchConnectorData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-xs font-semibold text-slate-700">

      {/* Stock Connector Trades Recommendations */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 mb-4">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <ArrowRightLeft className="h-4.5 w-4.5 text-brand-orange" /> ARUNA Smart Stock Connector
          </CardTitle>
          <CardDescription className="text-xs">
            Rekomendasi otomatis perdagangan dan transfer kelebihan stok antar-koperasi terdekat untuk optimasi demand nasional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-semibold">Tidak ada rekomendasi transfer stok saat ini.</div>
          ) : (
            trades.map(t => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-block text-[9px] font-semibold px-2.5 py-0.5 rounded-full ${t.status === 'Rekomendasi' ? 'bg-amber-100 text-brand-orange' : 'bg-blue-100 text-brand-navy'
                      }`}>
                      {t.status}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-800 mt-2">
                      Transfer Komoditas: {t.commodity_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Dari: <strong className="text-slate-700">{t.source_name}</strong>
                      <br />Ke: <strong className="text-slate-700">{t.target_name}</strong>
                    </p>
                  </div>
                  <div className="text-right font-semibold">
                    <span className="text-xs text-slate-900 block">{t.quantity.toLocaleString('id-ID')} {t.unit}</span>
                  </div>
                </div>

                {t.status === 'Rekomendasi' && (
                  <div className="pt-2 border-t border-slate-200/60 flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleActionTrade(t.id, 'tolak')}
                      className="bg-transparent border border-slate-300 text-slate-500 hover:bg-slate-100 font-semibold text-[10px] h-7 px-3 rounded-lg cursor-pointer"
                    >
                      Abaikan
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleActionTrade(t.id, 'proses')}
                      className="bg-brand-orange hover:bg-brand-orange/95 text-white font-semibold text-[10px] h-7 px-3 rounded-lg cursor-pointer"
                    >
                      Setujui Pengiriman
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Collective Procurement module */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 mb-4">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <Gift className="h-4.5 w-4.5 text-brand-red" /> Collective Procurement (Pembelian Bersama)
          </CardTitle>
          <CardDescription className="text-xs">
            Ikuti konsorsium PO besar bersama ratusan KDMP nasional untuk mendapatkan potongan harga bulk-pricing dari produsen/pabrik utama.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {procurements.map(p => {
            const pct = Math.round((p.current_quantity / p.target_quantity) * 100);
            return (
              <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">{p.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">{p.description}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                    <span>Kuota Terkumpul: {p.current_quantity.toLocaleString('id-ID')} / {p.target_quantity.toLocaleString('id-ID')} {p.unit}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-red rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Harga Grosir:</span>
                    <span className="font-semibold text-brand-navy">Rp {p.price_per_unit.toLocaleString('id-ID')} / {p.unit}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoinProcurement(p.id)}
                    disabled={p.current_quantity >= p.target_quantity}
                    className="bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold text-[10px] h-7.5 px-3 rounded-lg cursor-pointer font-sans"
                  >
                    Ikut Pengadaan (+10)
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}

// ─── TAB 1: Profil (VERIFICATION LOGIC PRESERVED) ──────────────────────────────
function ProfilTab({ coop, coopId, onSave, showToast }: {
  coop: Cooperative; coopId: string;
  onSave: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    member_count: coop.member_count,
    active_members: coop.active_members,
    annual_revenue: coop.annual_revenue,
    phone: coop.phone || '',
    head: coop.head || '',
    address: coop.address || '',
  });

  const [editingKyc, setEditingKyc] = useState(false);
  const [kycSaving, setKycSaving] = useState(false);
  const [kycForm, setKycForm] = useState({
    nib: coop.nib || '',
    sk_number: coop.sk_number || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'cooperatives', coopId), form);
      showToast('Profil koperasi berhasil diperbarui.');
      setEditing(false);
      onSave();
    } catch {
      showToast('Gagal memperbarui profil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKyc = async () => {
    setKycSaving(true);
    try {
      await updateDoc(doc(db, 'cooperatives', coopId), {
        nib: kycForm.nib,
        nib_status: kycForm.nib ? 'pending' : 'unsubmitted',
        sk_number: kycForm.sk_number,
        sk_status: kycForm.sk_number ? 'pending' : 'unsubmitted',
      });
      showToast('Dokumen legalitas berhasil dikirim untuk verifikasi.');
      setEditingKyc(false);
      onSave();
    } catch {
      showToast('Gagal memperbarui dokumen legalitas.', 'error');
    } finally {
      setKycSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-700">

      {/* Primary profile parameters */}
      <Card className="md:col-span-2 border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between mb-4">
          <CardTitle className="text-sm font-semibold text-slate-900 font-sans">Informasi Dasar Koperasi</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(!editing)}
            className="text-xs h-8 cursor-pointer rounded-xl font-sans"
          >
            {editing ? 'Batal' : 'Edit Profil'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">ID SimkopDes</span>
              <span className="text-xs font-semibold text-slate-700">{coop.simkopdes_id || '-'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Provinsi / Kota</span>
              <span className="text-xs font-semibold text-slate-700">{coop.province} / {coop.city}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Nama Ketua Koperasi</span>
              {editing ? (
                <input
                  type="text"
                  value={form.head}
                  onChange={e => setForm({ ...form, head: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-sans"
                />
              ) : (
                <span className="text-xs font-semibold text-slate-700">{coop.head || '-'}</span>
              )}
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">No. Telepon Kontak</span>
              {editing ? (
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-sans"
                />
              ) : (
                <span className="text-xs font-semibold text-slate-700">{coop.phone || '-'}</span>
              )}
            </div>
            <div className="col-span-2">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Alamat Koperasi Utama</span>
              {editing ? (
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-sans"
                />
              ) : (
                <span className="text-xs text-slate-700 leading-normal">{coop.address || '-'}</span>
              )}
            </div>
          </div>

          {editing && (
            <div className="flex justify-end pt-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer h-10 font-sans"
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance / KYC verification card */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between mb-4">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 font-sans">
            <FileCheck className="h-4.5 w-4.5 text-brand-orange" /> Legalitas & Kepatuhan
          </CardTitle>
          {!editingKyc && (coop.nib_status !== 'verified' || coop.sk_status !== 'verified') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setKycForm({
                  nib: coop.nib || '',
                  sk_number: coop.sk_number || '',
                });
                setEditingKyc(true);
              }}
              className="text-xs h-8 cursor-pointer rounded-xl font-sans"
            >
              Update Dokumen
            </Button>
          )}
          {editingKyc && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingKyc(false)}
              className="text-xs h-8 cursor-pointer rounded-xl font-sans"
            >
              Batal
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editingKyc ? (
            <div className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block uppercase">Nomor NIB Koperasi</label>
                <input
                  type="text"
                  value={kycForm.nib}
                  onChange={e => setKycForm({ ...kycForm, nib: e.target.value })}
                  placeholder="Masukkan 13 digit nomor NIB..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 block uppercase">Nomor SK Kementerian</label>
                <input
                  type="text"
                  value={kycForm.sk_number}
                  onChange={e => setKycForm({ ...kycForm, sk_number: e.target.value })}
                  placeholder="Masukkan nomor SK Koperasi..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-semibold"
                />
              </div>

              <div className="bg-brand-red/5 border border-brand-red/15 text-slate-600 p-3 rounded-lg text-[10px] leading-relaxed">
                <strong className="text-brand-red font-semibold">Informasi:</strong> Setelah disimpan, berkas legalitas Anda akan memasuki status <span className="font-semibold text-amber-600">Pending Review</span> dan akan diverifikasi oleh Admin ARUNA.
              </div>

              <Button
                onClick={handleSaveKyc}
                disabled={kycSaving || (!kycForm.nib && !kycForm.sk_number)}
                className="w-full bg-brand-navy hover:bg-brand-navy/95 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                {kycSaving ? 'Mengirim Data...' : 'Kirim Berkas Verifikasi'}
              </Button>
            </div>
          ) : (
            <>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Nomor NIB:</span>
                  <span className="font-semibold text-slate-500">{coop.nib || 'Belum Terdaftar'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Status KYC NIB:</span>
                  <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[9px] ${coop.nib_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    coop.nib_status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                    {coop.nib_status || 'unsubmitted'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Nomor SK:</span>
                  <span className="font-semibold text-slate-500">{coop.sk_number || 'Belum Terdaftar'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">Status KYC SK:</span>
                  <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[9px] ${coop.sk_status === 'verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    coop.sk_status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                    {coop.sk_status || 'unsubmitted'}
                  </span>
                </div>
              </div>

              {/* Status info bar */}
              {(coop.nib_status === 'pending' || coop.sk_status === 'pending') && (
                <div className="bg-amber-50 border border-amber-250/20 text-amber-950 p-3 rounded-xl text-[10px] leading-relaxed flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping mt-1 shrink-0"></span>
                  <p>
                    <strong className="font-semibold">Verifikasi Diproses:</strong> Admin ARUNA sedang meninjau berkas NIB/SK Anda. Mohon tunggu proses ini selesai.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ─── TAB 2: Komoditas (VALUED-ADDED HILIRISASI PRESERVED) ─────────────────────
// Since it's no longer the main tab, we can let user access it via specific modules or merge
// However, the dashboard tabs handles standard components.

// ─── TAB 3: Permintaan Pasar (PESANAN) ────────────────────────────────────────
function PesananTab({ requests, commodities, coopId, onRefresh, showToast }: {
  requests: MarketRequestWithBuyer[]; commodities: Commodity[]; coopId: string; onRefresh: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleProcessOffer = async (req: MarketRequestWithBuyer) => {
    const matchedCom = commodities.find(c => c.name.toLowerCase() === req.commodity_name.toLowerCase());
    if (!matchedCom || matchedCom.available_stock <= 0) {
      return showToast('Stok komoditas Anda tidak mencukupi untuk memenuhi penawaran ini.', 'error');
    }

    setProcessingId(req.id);
    try {
      const matchQty = Math.min(req.quantity, matchedCom.available_stock);

      const matchRef = collection(db, 'supply_matches');
      await addDoc(matchRef, {
        request_id: req.id,
        cooperative_id: coopId,
        allocated_quantity: matchQty,
        matched_at: new Date().toISOString()
      });

      const commRef = doc(db, 'commodities', matchedCom.id);
      await updateDoc(commRef, {
        available_stock: Math.max(0, matchedCom.available_stock - matchQty)
      });

      const reqRef = doc(db, 'market_requests', req.id);
      await updateDoc(reqRef, {
        status: matchQty === req.quantity ? 'Terpenuhi' : 'Terpenuhi Sebagian'
      });

      showToast(`Berhasil menyetujui pemenuhan pasar! Mengalokasikan ${matchQty} ${req.unit} komoditas.`);
      onRefresh();
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses alokasi pemenuhan', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 mb-4">
        <CardTitle className="text-sm font-semibold text-slate-900">Permintaan Of-taker Industri Aktif Nasional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-semibold text-xs">Tidak ada permintaan offtaker industri yang cocok.</div>
        ) : (
          requests.map(req => {
            const hasStock = commodities.find(c => c.name.toLowerCase() === req.commodity_name.toLowerCase());
            return (
              <div key={req.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <span className="bg-brand-navy text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase">{req.status}</span>
                  <h4 className="font-semibold text-slate-800 mt-2 text-sm">
                    {req.commodity_name} (Kebutuhan: {req.quantity.toLocaleString('id-ID')} {req.unit})
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-450" /> Buyer: {req.buyer?.company_name} ({req.buyer?.city})
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 font-semibold block uppercase">Stok Anda:</span>
                    <span className="font-semibold text-slate-700">{hasStock ? `${hasStock.available_stock.toLocaleString('id-ID')} ${hasStock.unit}` : 'Tidak ada'}</span>
                  </div>
                  {req.status !== 'Terpenuhi' && (
                    <Button
                      size="sm"
                      onClick={() => handleProcessOffer(req)}
                      disabled={processingId !== null || !hasStock || hasStock.available_stock <= 0}
                      className="bg-brand-red hover:bg-brand-red/90 text-white font-semibold text-[10px] h-9.5 px-4.5 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {processingId === req.id ? 'Memproses...' : 'Pasok Kontrak'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── TAB 4: Bagi Hasil (SHU / SURPLUS SURVIVAL) ──────────────────────────────
function SHUTab({ coop, coopId, matches, onRefresh, showToast }: {
  coop: Cooperative; coopId: string; matches: any[]; onRefresh: () => void; showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const totalRevenueAllocated = matches.reduce((sum, m) => sum + (m.allocated_quantity * 12000), 0);
  const reserveFund = Math.round(totalRevenueAllocated * 0.4);
  const shuFund = Math.round(totalRevenueAllocated * 0.6);

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-700">

      {/* SHU Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-450 font-semibold block uppercase tracking-wider">Tabungan Cadangan Kas Desa (40%)</span>
              <span className="text-base font-semibold text-slate-900">Rp {reserveFund.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-455 font-semibold block uppercase tracking-wider">Dana SHU Anggota Tani (60%)</span>
              <span className="text-base font-semibold text-emerald-700">Rp {shuFund.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocations History */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-900">Kontribusi Penjualan Gotong Royong Terpasok</CardTitle>
          <CardDescription className="text-xs">Catatan pengiriman pasokan komoditas yang menghasilkan bagi hasil untuk kas desa.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-semibold">Belum ada penyaluran gotong royong terpasok.</div>
          ) : (
            matches.map(m => (
              <div key={m.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-semibold text-slate-800">{m.request?.commodity_name}</h5>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    Diperoleh: {new Date(m.matched_at).toLocaleDateString('id-ID')} &bull; Pembeli: {m.request?.buyer?.company_name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900 block">{m.allocated_quantity.toLocaleString('id-ID')} {m.request?.unit}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                    Rp {(m.allocated_quantity * 12000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}

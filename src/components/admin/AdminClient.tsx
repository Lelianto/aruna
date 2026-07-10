'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { buyerRepository } from '@/lib/repositories/buyer.repository';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import { Cooperative, Buyer, MarketRequestWithBuyer } from '@/types';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert, Users, Building2, Landmark, Check, XCircle, FileText,
  CheckCircle2, UserPlus, ArrowRight, ShoppingBag, MapPin
} from 'lucide-react';

interface AppUser {
  uid: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'buyer' | 'koperasi' | 'customer' | 'pemerintah' | null;
  associatedId?: string;
  address?: string;
}

type AdminTab = 'antrean' | 'koperasi' | 'buyer' | 'customer';
type DocStatus = 'unsubmitted' | 'pending' | 'verified' | 'rejected' | undefined;

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-brand-navy/10 text-brand-navy border-brand-navy/20',
  koperasi: 'bg-orange-50 text-brand-orange border-orange-200',
  buyer: 'bg-red-50 text-brand-red border-red-200',
  customer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pemerintah: 'bg-blue-50 text-blue-700 border-blue-200'
};

function DocBadge({ label, status }: { label: string; status: DocStatus }) {
  const map: Record<string, string> = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-brand-orange border-amber-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    unsubmitted: 'bg-slate-100 text-slate-400 border-slate-200'
  };
  const key = status || 'unsubmitted';
  const text: Record<string, string> = {
    verified: 'Terverifikasi', pending: 'Menunggu', rejected: 'Ditolak', unsubmitted: 'Belum ada'
  };
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border uppercase ${map[key]}`}>
      {label}: {text[key]}
    </span>
  );
}

function StatCard({ label, value, sub, accent, icon }: { label: string; value: number | string; sub: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${accent}`}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

export default function AdminClient() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [requests, setRequests] = useState<MarketRequestWithBuyer[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<AdminTab>('antrean');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [coopSearch, setCoopSearch] = useState('');
  const [coopVisible, setCoopVisible] = useState(30);
  const [buyerSearch, setBuyerSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  const loadedRef = useRef(false);

  // Guard: hanya admin
  useEffect(() => {
    if (!loading) {
      if (!user || (userData && userData.role !== 'admin')) {
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  // Muat data hanya untuk admin (setState terjadi setelah await, bukan sinkron di body effect)
  useEffect(() => {
    if (loading || !user || userData?.role !== 'admin' || loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const [coopList, buyerList, reqList, usersSnap] = await Promise.all([
          cooperativeRepository.getAll(),
          buyerRepository.getAll(),
          marketRequestRepository.getAllWithBuyer(),
          getDocs(collection(db, 'users'))
        ]);
        if (cancelled) return;
        const userList: AppUser[] = [];
        usersSnap.forEach((d) => userList.push({ uid: d.id, ...(d.data() as Record<string, unknown>) } as AppUser));
        setCoops(coopList);
        setBuyers(buyerList);
        setRequests(reqList);
        setUsers(userList);
      } catch (e) {
        console.error('Gagal memuat data admin:', e);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loading, user, userData]);

  // Derived queues
  const pendingKyc = useMemo(
    () => coops.filter((c) => c.nib_status === 'pending' || c.sk_status === 'pending'),
    [coops]
  );
  const pendingPayments = useMemo(
    () => requests.filter((r) => r.status === 'Menunggu Pembayaran'),
    [requests]
  );
  const unverifiedBuyers = useMemo(() => buyers.filter((b) => !b.verified), [buyers]);

  const filteredCoops = useMemo(() => {
    const q = coopSearch.trim().toLowerCase();
    if (!q) return coops;
    return coops.filter((c) =>
      [c.name, c.city, c.province, c.head].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [coops, coopSearch]);

  const filteredBuyers = useMemo(() => {
    const q = buyerSearch.trim().toLowerCase();
    if (!q) return buyers;
    return buyers.filter((b) =>
      [b.company_name, b.city, b.industry].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [buyers, buyerSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = userRoleFilter === 'all' || (u.role || 'unassigned') === userRoleFilter;
      const matchesQuery = !q || [u.name, u.email, u.address].some((v) => (v || '').toLowerCase().includes(q));
      return matchesRole && matchesQuery;
    });
  }, [users, userSearch, userRoleFilter]);

  // Actions (optimistic local update)
  const handleVerifyDoc = async (coop: Cooperative, type: 'nib' | 'sk', status: 'verified' | 'rejected') => {
    const key = `${coop.id}-${type}`;
    setBusyId(key);
    try {
      await cooperativeRepository.verifyCooperativeDocs(coop.id, type, status);
      setCoops((prev) =>
        prev.map((c) =>
          c.id === coop.id
            ? { ...c, [type === 'nib' ? 'nib_status' : 'sk_status']: status }
            : c
        )
      );
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui status dokumen.');
    } finally {
      setBusyId(null);
    }
  };

  const handleApprovePayment = async (req: MarketRequestWithBuyer) => {
    if (!confirm(`Verifikasi pembayaran untuk ${req.commodity_name} sebanyak ${req.quantity} ${req.unit}?`)) return;
    setBusyId(req.id);
    try {
      await marketRequestRepository.approvePayment(req);
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: 'Terpenuhi' } : r)));
    } catch (e) {
      console.error(e);
      alert('Gagal memverifikasi pembayaran.');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleBuyer = async (b: Buyer) => {
    setBusyId(b.id);
    try {
      const next = !b.verified;
      await buyerRepository.setVerified(b.id, next);
      setBuyers((prev) => prev.map((x) => (x.id === b.id ? { ...x, verified: next } : x)));
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui status buyer.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !user || !userData || userData.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-[#f7f8fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-semibold">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; count?: number }[] = [
    { key: 'antrean', label: 'Antrean Tindakan', count: pendingKyc.length + pendingPayments.length },
    { key: 'koperasi', label: 'Koperasi', count: coops.length },
    { key: 'buyer', label: 'Buyer', count: buyers.length },
    { key: 'customer', label: 'Pengguna', count: users.length }
  ];

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] bg-brand-navy text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Pusat Kendali Admin
            </span>
            <h1 className="text-2xl font-semibold text-slate-900 leading-tight">Administrasi Platform ARUNA</h1>
            <p className="text-xs text-slate-500">
              Pantau seluruh data mitra & pengguna, validasi dokumen kepatuhan, dan setujui pembayaran gotong royong.
            </p>
          </div>
          <Link href="/onboarding-mitra">
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs flex items-center gap-1.5 rounded-xl">
              <UserPlus className="h-4 w-4" /> Onboarding Mitra Baru
            </Button>
          </Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Koperasi" value={coops.length} sub="Total penyedia terdaftar" accent="bg-brand-orange/10 text-brand-orange" icon={<Landmark className="h-4.5 w-4.5" />} />
          <StatCard label="Buyer" value={buyers.length} sub={`${unverifiedBuyers.length} belum terverifikasi`} accent="bg-brand-red/10 text-brand-red" icon={<Building2 className="h-4.5 w-4.5" />} />
          <StatCard label="Pengguna" value={users.length} sub="Akun terdaftar (semua peran)" accent="bg-emerald-500/10 text-emerald-600" icon={<Users className="h-4.5 w-4.5" />} />
          <StatCard label="KYC Menunggu" value={pendingKyc.length} sub="Dokumen perlu divalidasi" accent="bg-amber-500/10 text-amber-600" icon={<FileText className="h-4.5 w-4.5" />} />
          <StatCard label="Pembayaran" value={pendingPayments.length} sub="Menunggu persetujuan" accent="bg-brand-navy/10 text-brand-navy" icon={<ShoppingBag className="h-4.5 w-4.5" />} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === t.key ? 'border-brand-navy text-brand-navy' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-navy mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-semibold">Memuat data platform...</p>
          </div>
        ) : (
          <>
            {/* ============ TAB: ANTREAN TINDAKAN ============ */}
            {activeTab === 'antrean' && (
              <div className="space-y-6">

                {/* KYC Queue */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Validasi Dokumen KYC
                    </h2>
                    <span className="text-[10px] font-semibold text-slate-400">{pendingKyc.length} menunggu</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingKyc.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada dokumen yang menunggu validasi.</p>
                    ) : (
                      pendingKyc.map((coop) => (
                        <div key={coop.id} className="p-4 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-xs text-slate-800">{coop.name}</h4>
                            <span className="text-[10px] text-slate-400">{coop.city}, {coop.province}</span>
                          </div>

                          {coop.nib_status === 'pending' && (
                            <div className="flex items-center justify-between gap-3 bg-orange-50/40 border border-orange-100 rounded-lg p-2.5">
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold text-slate-700 block">NIB: {coop.nib || '-'}</span>
                                {coop.nib_document_url && (
                                  <a href={coop.nib_document_url} target="_blank" rel="noreferrer" className="text-[9px] text-brand-orange font-semibold hover:underline">Lihat Dokumen NIB &rarr;</a>
                                )}
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button disabled={busyId === `${coop.id}-nib`} onClick={() => handleVerifyDoc(coop, 'nib', 'verified')} className="p-1 px-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"><Check className="h-3 w-3" /> Setujui</button>
                                <button disabled={busyId === `${coop.id}-nib`} onClick={() => handleVerifyDoc(coop, 'nib', 'rejected')} className="p-1 px-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"><XCircle className="h-3 w-3" /> Tolak</button>
                              </div>
                            </div>
                          )}

                          {coop.sk_status === 'pending' && (
                            <div className="flex items-center justify-between gap-3 bg-orange-50/40 border border-orange-100 rounded-lg p-2.5">
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold text-slate-700 block">SK Pendirian: {coop.sk_number || '-'}</span>
                                {coop.sk_document_url && (
                                  <a href={coop.sk_document_url} target="_blank" rel="noreferrer" className="text-[9px] text-brand-orange font-semibold hover:underline">Lihat Dokumen SK &rarr;</a>
                                )}
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button disabled={busyId === `${coop.id}-sk`} onClick={() => handleVerifyDoc(coop, 'sk', 'verified')} className="p-1 px-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"><Check className="h-3 w-3" /> Setujui</button>
                                <button disabled={busyId === `${coop.id}-sk`} onClick={() => handleVerifyDoc(coop, 'sk', 'rejected')} className="p-1 px-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"><XCircle className="h-3 w-3" /> Tolak</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Payment Queue */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4" /> Persetujuan Pembayaran
                    </h2>
                    <span className="text-[10px] font-semibold text-slate-400">{pendingPayments.length} menunggu</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendingPayments.length === 0 ? (
                      <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada pembayaran yang menunggu persetujuan.</p>
                    ) : (
                      pendingPayments.map((req) => (
                        <div key={req.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-slate-800 truncate">{req.buyer.company_name}</h4>
                            <p className="text-[10px] text-slate-500">{req.commodity_name} — <strong className="text-brand-red">{req.quantity} {req.unit}</strong></p>
                          </div>
                          <Button
                            disabled={busyId === req.id}
                            onClick={() => handleApprovePayment(req)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] py-2 px-3 flex items-center gap-1.5 rounded-xl shrink-0"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Setujui Pembayaran
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============ TAB: KOPERASI ============ */}
            {activeTab === 'koperasi' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-orange">Data Koperasi ({filteredCoops.length})</h2>
                  <input
                    type="text"
                    placeholder="Cari nama / kota / provinsi / ketua..."
                    value={coopSearch}
                    onChange={(e) => { setCoopSearch(e.target.value); setCoopVisible(30); }}
                    className="w-full sm:w-72 p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredCoops.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada koperasi cocok.</p>
                  ) : (
                    filteredCoops.slice(0, coopVisible).map((coop) => (
                      <div key={coop.id} className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-xs text-slate-800">{coop.name}</h4>
                            {coop.simkopdes_id && (
                              <span className="text-[9px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase">SimkopDes</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {coop.city}, {coop.province}
                          </p>
                          <p className="text-[9px] text-slate-400">Ketua: <strong className="text-slate-600">{coop.head || '-'}</strong> · {coop.phone || '-'} · Anggota: {coop.member_count ?? '-'}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <DocBadge label="NIB" status={coop.nib_status} />
                            <DocBadge label="SK" status={coop.sk_status} />
                          </div>
                        </div>
                        {(coop.nib_status === 'pending' || coop.sk_status === 'pending') && (
                          <span className="text-[9px] font-semibold bg-amber-50 border border-amber-200 text-brand-orange px-2 py-1 rounded-full uppercase shrink-0">Perlu Validasi</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {coopVisible < filteredCoops.length && (
                  <div className="p-4 text-center border-t border-slate-100">
                    <Button variant="outline" size="sm" onClick={() => setCoopVisible((v) => v + 30)} className="text-xs">
                      Muat lebih banyak ({filteredCoops.length - coopVisible} lagi)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ============ TAB: BUYER ============ */}
            {activeTab === 'buyer' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-red">Data Buyer ({filteredBuyers.length})</h2>
                  <input
                    type="text"
                    placeholder="Cari perusahaan / kota / industri..."
                    value={buyerSearch}
                    onChange={(e) => setBuyerSearch(e.target.value)}
                    className="w-full sm:w-72 p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredBuyers.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada buyer cocok.</p>
                  ) : (
                    filteredBuyers.map((b) => (
                      <div key={b.id} className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-xs text-slate-800">{b.company_name}</h4>
                            {b.buyer_type === 'umkm' ? (
                              <span className="text-[9px] font-semibold bg-orange-50 border border-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full uppercase">UMKM</span>
                            ) : (
                              <span className="text-[9px] font-semibold bg-red-50 border border-red-200 text-brand-red px-1.5 py-0.5 rounded-full uppercase">Industri</span>
                            )}
                            {b.verified ? (
                              <span className="text-[9px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase">Terverifikasi</span>
                            ) : (
                              <span className="text-[9px] font-semibold bg-slate-100 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded-full uppercase">Belum</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold">{b.industry} — {b.city}</p>
                          <p className="text-[9px] text-slate-400">NIB: <strong className="text-slate-600">{b.nib || '-'}</strong> · SIUP: <strong className="text-slate-600">{b.siup || '-'}</strong></p>
                        </div>
                        <Button
                          disabled={busyId === b.id}
                          onClick={() => handleToggleBuyer(b)}
                          variant={b.verified ? 'outline' : 'default'}
                          size="sm"
                          className={`text-[11px] shrink-0 ${b.verified ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                        >
                          {b.verified ? 'Cabut Verifikasi' : 'Verifikasi'}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ============ TAB: PENGGUNA / CUSTOMER ============ */}
            {activeTab === 'customer' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Data Pengguna ({filteredUsers.length})</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
                    >
                      <option value="all">Semua peran</option>
                      <option value="customer">Customer</option>
                      <option value="buyer">Buyer</option>
                      <option value="koperasi">Koperasi</option>
                      <option value="pemerintah">Pemerintah</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Cari nama / email / alamat..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="flex-1 sm:w-56 p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada pengguna cocok.</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.uid} className="p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-xs text-slate-800">{u.name || 'Tanpa Nama'}</h4>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border uppercase ${ROLE_BADGE[u.role || ''] || 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                              {u.role || 'belum pilih'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold">{u.email || '-'}</p>
                          {u.address && <p className="text-[9px] text-slate-400">Alamat: {u.address}</p>}
                          {u.associatedId && <p className="text-[9px] text-slate-400">Terkait ID: {u.associatedId}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <ArrowRight className="h-3 w-3" /> Butuh mendaftarkan mitra baru atau menghapus data? Buka <Link href="/onboarding-mitra" className="text-brand-navy font-semibold hover:underline">Onboarding Mitra</Link>.
        </p>

      </div>
    </div>
  );
}

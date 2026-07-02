'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/config';
import {
  collection, query, where, getDocs, doc, getDoc,
  addDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { Cooperative, Commodity, MarketRequest, Buyer } from '@/types';
import { 
  Building2, PackagePlus, ShoppingCart, Pencil, Trash2, 
  Plus, Save, X, CheckCircle2, AlertCircle, Loader2,
  MapPin, Users, TrendingUp, Phone, Warehouse, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Tab = 'profil' | 'komoditas' | 'pesanan';

interface DashboardTab {
  key: Tab;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

interface MarketRequestWithBuyer extends MarketRequest {
  buyer?: Buyer;
}

// ─── Toast helper ────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold animate-fade-in-up ${
      type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MitraDashboardClient() {
  const { userData } = useAuth();
  const coopId = userData?.associatedId;

  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [requests, setRequests] = useState<MarketRequestWithBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!coopId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Cooperative profile
      const coopSnap = await getDoc(doc(db, 'cooperatives', coopId));
      if (coopSnap.exists()) setCoop({ id: coopSnap.id, ...coopSnap.data() } as Cooperative);

      // Commodities
      const comQ = query(collection(db, 'commodities'), where('cooperative_id', '==', coopId));
      const comSnap = await getDocs(comQ);
      const comList: Commodity[] = [];
      comSnap.forEach(d => comList.push({ id: d.id, ...d.data() } as Commodity));
      setCommodities(comList);

      // Market requests + buyers
      const reqSnap = await getDocs(collection(db, 'market_requests'));
      const buyerSnap = await getDocs(collection(db, 'buyers'));
      const buyers: Buyer[] = [];
      buyerSnap.forEach(d => buyers.push({ id: d.id, ...d.data() } as Buyer));

      const commodityNames = new Set(comList.map(c => c.name.toLowerCase()));
      const reqList: MarketRequestWithBuyer[] = [];
      reqSnap.forEach(d => {
        const req = { id: d.id, ...d.data() } as MarketRequest;
        if (commodityNames.has(req.commodity_name.toLowerCase())) {
          const buyer = buyers.find(b => b.id === req.buyer_id);
          reqList.push({ ...req, buyer });
        }
      });
      setRequests(reqList);
    } catch (e) {
      console.error(e);
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [coopId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!userData) return null;

  if (!coopId) {
    return (
      <div className="page-shell flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-sm">
          <Building2 className="h-14 w-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-black text-slate-800 mb-2">Akun Belum Terhubung</h2>
          <p className="text-sm text-slate-500">
            Akun Anda belum dihubungkan ke data koperasi di sistem. Hubungi Admin ARUNA untuk menautkan akun Anda dengan koperasi yang Anda pimpin.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-brand-red" />
              Portal Koperasi
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola profil, komoditas, dan permintaan pasar koperasi Anda
            </p>
          </div>
          
          {coop && (
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900">{coop.name}</div>
              <div className="text-xs text-slate-500">{coop.city}, {coop.province}</div>
            </div>
          )}
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(
            [
              { key: 'profil', label: 'Profil Koperasi', icon: Building2 },
              { key: 'komoditas', label: 'Komoditas', icon: Warehouse, badge: commodities.length },
              { key: 'pesanan', label: 'Permintaan Pasar', icon: ShoppingCart, badge: requests.filter(r => r.status === 'Menunggu Pemenuhan').length },
            ] as DashboardTab[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-white text-brand-navy shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-brand-red text-white' : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profil' && coop && (
          <ProfilTab coop={coop} coopId={coopId} onSave={fetchData} showToast={showToast} />
        )}
        {activeTab === 'komoditas' && (
          <KomoditasTab coopId={coopId} commodities={commodities} onRefresh={fetchData} showToast={showToast} />
        )}
        {activeTab === 'pesanan' && (
          <PesananTab requests={requests} commodities={commodities} coopId={coopId} onRefresh={fetchData} showToast={showToast} />
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ─── TAB 1: Profil ────────────────────────────────────────────────────────────
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'cooperatives', coopId), form);
      showToast('Profil koperasi berhasil disimpan!');
      setEditing(false);
      onSave();
    } catch {
      showToast('Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-400 italic">Belum diisi</span>}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Read-only info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-red" /> Informasi Wilayah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nama Koperasi" value={coop.name} />
          <Field label="Provinsi" value={coop.province} />
          <Field label="Kota / Kabupaten" value={coop.city} />
          <Field label="Alamat" value={coop.address} />
        </CardContent>
      </Card>

      {/* Editable stats */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-navy" /> Data Operasional
            </CardTitle>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-xs font-bold text-brand-navy hover:text-brand-red transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1"><X className="h-3.5 w-3.5" />Batal</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-xs font-bold text-white bg-brand-navy px-2.5 py-1 rounded-lg hover:bg-brand-navy/90 disabled:opacity-60 transition-all">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Simpan
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              {[
                { label: 'Nama Ketua', key: 'head', type: 'text' },
                { label: 'Nomor Telepon', key: 'phone', type: 'text' },
                { label: 'Jumlah Anggota Total', key: 'member_count', type: 'number' },
                { label: 'Anggota Aktif', key: 'active_members', type: 'number' },
                { label: 'Pendapatan Tahunan (Rp)', key: 'annual_revenue', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy"
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              <Field label="Nama Ketua" value={coop.head} />
              <Field label="Nomor Telepon" value={coop.phone} />
              <Field label="Jumlah Anggota" value={`${(coop.member_count || 0).toLocaleString('id-ID')} orang`} />
              <Field label="Anggota Aktif" value={`${(coop.active_members || 0).toLocaleString('id-ID')} orang`} />
              <Field label="Pendapatan Tahunan" value={`Rp ${(coop.annual_revenue || 0).toLocaleString('id-ID')}`} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── TAB 2: Komoditas ─────────────────────────────────────────────────────────
const CATEGORIES = ['Pangan', 'Perkebunan', 'Hortikultura', 'Perikanan', 'Peternakan', 'Lainnya'];
const UNITS = ['Ton', 'Kg', 'Kwintal', 'Liter'];

function KomoditasTab({ coopId, commodities, onRefresh, showToast }: {
  coopId: string;
  commodities: Commodity[];
  onRefresh: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Pangan', monthly_capacity: 0, available_stock: 0, unit: 'Ton', harvest_period: '' });

  const handleAdd = async () => {
    if (!form.name.trim()) return showToast('Nama komoditas wajib diisi', 'error');
    setSaving(true);
    try {
      await addDoc(collection(db, 'commodities'), { ...form, cooperative_id: coopId, created_at: new Date().toISOString() });
      showToast('Komoditas berhasil ditambahkan!');
      setForm({ name: '', category: 'Pangan', monthly_capacity: 0, available_stock: 0, unit: 'Ton', harvest_period: '' });
      setShowForm(false);
      onRefresh();
    } catch {
      showToast('Gagal menambah komoditas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStock = async (id: string) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'commodities', id), { available_stock: editStock[id] ?? 0 });
      showToast('Stok berhasil diperbarui!');
      setEditingId(null);
      onRefresh();
    } catch {
      showToast('Gagal memperbarui stok', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus komoditas ini?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'commodities', id));
      showToast('Komoditas dihapus.');
      onRefresh();
    } catch {
      showToast('Gagal menghapus komoditas', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-semibold">{commodities.length} komoditas terdaftar</p>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold flex items-center gap-1.5"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Tutup Form' : 'Tambah Komoditas'}
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-brand-navy/20 bg-brand-navy/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black text-brand-navy flex items-center gap-2">
              <PackagePlus className="h-4 w-4" /> Tambah Komoditas Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nama Komoditas', key: 'name', type: 'text', placeholder: 'cth: Jagung Hibrida' },
                { label: 'Musim Panen', key: 'harvest_period', type: 'text', placeholder: 'cth: April – Juni' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={form[f.key as 'name' | 'harvest_period']}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy" />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kategori</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Satuan</label>
                <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Kapasitas Bulanan ({form.unit})</label>
                <input type="number" min={0} value={form.monthly_capacity}
                  onChange={e => setForm(p => ({ ...p, monthly_capacity: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Stok Tersedia Saat Ini ({form.unit})</label>
                <input type="number" min={0} value={form.available_stock}
                  onChange={e => setForm(p => ({ ...p, available_stock: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-navy" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleAdd} disabled={saving} className="bg-brand-red hover:bg-brand-red/90 text-white text-xs font-bold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Simpan Komoditas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {commodities.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm font-semibold border-2 border-dashed border-slate-200 rounded-xl">
          Belum ada komoditas. Klik "Tambah Komoditas" untuk mulai.
        </div>
      ) : (
        <div className="space-y-2">
          {commodities.map(com => (
            <Card key={com.id} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm">{com.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{com.category}</span>
                    {com.harvest_period && <span className="text-[10px] text-slate-400 font-medium">Panen: {com.harvest_period}</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span>Cap: <span className="font-bold text-slate-700">{com.monthly_capacity} {com.unit}/bln</span></span>
                    <span className="text-slate-300">|</span>
                    {editingId === com.id ? (
                      <div className="flex items-center gap-2">
                        <span>Stok:</span>
                        <input
                          type="number" min={0}
                          defaultValue={com.available_stock}
                          onChange={e => setEditStock(p => ({ ...p, [com.id]: Number(e.target.value) }))}
                          className="w-20 px-2 py-0.5 border border-brand-navy rounded text-xs font-bold focus:outline-none"
                          autoFocus
                        />
                        <span className="font-medium">{com.unit}</span>
                        <button onClick={() => handleUpdateStock(com.id)} disabled={saving} className="text-emerald-600 hover:text-emerald-800">
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <span>Stok: <span className="font-bold text-brand-red">{com.available_stock} {com.unit}</span></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {editingId !== com.id && (
                    <button
                      onClick={() => { setEditingId(com.id); setEditStock(p => ({ ...p, [com.id]: com.available_stock })); }}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-navy transition-colors"
                      title="Edit stok"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(com.id)}
                    disabled={deleting === com.id}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-brand-red transition-colors"
                    title="Hapus"
                  >
                    {deleting === com.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: Permintaan Pasar ──────────────────────────────────────────────────
function PesananTab({ requests, commodities, coopId, onRefresh, showToast }: {
  requests: MarketRequestWithBuyer[];
  commodities: Commodity[];
  coopId: string;
  onRefresh: () => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});

  const handleFulfill = async (req: MarketRequestWithBuyer) => {
    const allocated = allocations[req.id] || 0;
    if (allocated <= 0) return showToast('Masukkan jumlah yang bisa dipenuhi', 'error');
    setFulfillingId(req.id);
    try {
      // Write supply match
      await addDoc(collection(db, 'supply_matches'), {
        request_id: req.id,
        cooperative_id: coopId,
        allocated_quantity: allocated,
        matched_at: new Date().toISOString(),
      });
      // Update request status
      await updateDoc(doc(db, 'market_requests', req.id), {
        status: allocated >= req.quantity ? 'Terpenuhi' : 'Terpenuhi Sebagian',
      });
      showToast(`Berhasil sanggup penuhi ${allocated} ${req.unit}!`);
      setAllocations(p => ({ ...p, [req.id]: 0 }));
      onRefresh();
    } catch {
      showToast('Gagal memproses pemenuhan', 'error');
    } finally {
      setFulfillingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'Menunggu Pemenuhan');
  const others = requests.filter(r => r.status !== 'Menunggu Pemenuhan');

  const statusColor = (s: string) => {
    if (s === 'Terpenuhi') return 'bg-emerald-100 text-emerald-700';
    if (s === 'Terpenuhi Sebagian') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  const RequestCard = ({ req }: { req: MarketRequestWithBuyer }) => {
    const matchingCom = commodities.find(c => c.name.toLowerCase() === req.commodity_name.toLowerCase());
    const canFulfill = req.status === 'Menunggu Pemenuhan';

    return (
      <Card className={`border-slate-200 ${canFulfill ? 'hover:border-brand-navy/30 hover:shadow-sm' : 'opacity-75'} transition-all`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-sm text-slate-900">{req.buyer?.company_name || 'Buyer'}</p>
              <p className="text-xs text-slate-400 font-medium">{req.buyer?.city} · {req.buyer?.industry}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor(req.status)}`}>{req.status}</span>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 text-xs">
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[9px]">Komoditas</span>
              <span className="font-bold text-slate-800">{req.commodity_name}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <div>
              <span className="text-slate-400 block font-bold uppercase text-[9px]">Dibutuhkan</span>
              <span className="font-black text-brand-red">{req.quantity} {req.unit}</span>
            </div>
            {matchingCom && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Stok Kamu</span>
                  <span className="font-bold text-emerald-600">{matchingCom.available_stock} {matchingCom.unit}</span>
                </div>
              </>
            )}
          </div>

          {canFulfill && (
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={matchingCom?.available_stock ?? undefined}
                placeholder="Jumlah sanggup penuhi"
                value={allocations[req.id] || ''}
                onChange={e => setAllocations(p => ({ ...p, [req.id]: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
              <span className="text-xs text-slate-400 font-medium shrink-0">{req.unit}</span>
              <Button
                size="sm"
                onClick={() => handleFulfill(req)}
                disabled={fulfillingId === req.id}
                className="bg-brand-red hover:bg-brand-red/90 text-white text-xs font-bold shrink-0"
              >
                {fulfillingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Sanggup Penuhi
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Menunggu Pemenuhan ({pending.length})
          </h3>
          {pending.map(r => <RequestCard key={r.id} req={r} />)}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Riwayat ({others.length})
          </h3>
          {others.map(r => <RequestCard key={r.id} req={r} />)}
        </div>
      )}
      {requests.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm font-semibold border-2 border-dashed border-slate-200 rounded-xl">
          Belum ada permintaan pasar yang cocok dengan komoditas koperasi Anda.
        </div>
      )}
    </div>
  );
}

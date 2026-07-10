'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, MapPin, Compass, ShieldAlert, Check, Plus, Trash2, ArrowRight, FileText, XCircle, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import PinpointMapWrapper from '@/components/map/PinpointMapWrapper';
import { Cooperative, Buyer } from '@/types';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';

export default function OnboardingMitraPage() {
  const { userData, user, loading } = useAuth();
  const router = useRouter();

  // Active tab state
  const [activeTab, setActiveTab] = useState<'koperasi' | 'buyer' | 'list'>('koperasi');

  // List of cooperatives and buyers loaded in real-time
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);

  // Cooperative Form State
  const [coopData, setCoopData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    head: '',
    phone: ''
  });
  const [coopCoords, setCoopCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Buyer Form State
  const [buyerData, setBuyerData] = useState({
    company_name: '',
    city: '',
    industry: '',
    address: '',
    nib: '',
    siup: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Guard access: only admin can access this page
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (userData && userData.role !== 'admin') {
        // Halaman ini eksklusif admin; peran lain langsung dipulangkan ke beranda.
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  // Load real-time cooperatives and buyers list
  useEffect(() => {
    const unsubCoops = onSnapshot(collection(db, 'cooperatives'), (snapshot) => {
      const list: Cooperative[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Cooperative);
      });
      setCoops(list);
    });

    const unsubBuyers = onSnapshot(collection(db, 'buyers'), (snapshot) => {
      const list: Buyer[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Buyer);
      });
      setBuyers(list);
    });

    return () => {
      unsubCoops();
      unsubBuyers();
    };
  }, []);

  // HTML5 Browser Geolocation for Admin initial pinpoint positioning
  useEffect(() => {
    if (activeTab === 'koperasi' && !coopCoords && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoopCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn(error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [activeTab, coopCoords]);

  // Submit Cooperative
  const handleCoopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coopData.name || !coopData.city || !coopData.province || !coopData.address || !coopData.head || !coopData.phone) {
      alert("Harap lengkapi semua data koperasi.");
      return;
    }
    if (!coopCoords) {
      alert("Harap tentukan lokasi koordinat koperasi pada peta.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Add to cooperatives
      const coopRef = await addDoc(collection(db, 'cooperatives'), {
        name: coopData.name,
        address: coopData.address,
        city: coopData.city,
        province: coopData.province,
        head: coopData.head,
        phone: coopData.phone,
        latitude: coopCoords.lat,
        longitude: coopCoords.lng
      });

      // 2. Add Scorecard
      await cooperativeRepository.upsertCooperativeScore(coopRef.id, {
        final_score: 75,
        health_score: 80,
        growth_score: 70,
        supply_score: 75,
        grade: 'B',
      });

      // 3. Add default Jagung commodity
      await addDoc(collection(db, 'commodities'), {
        cooperative_id: coopRef.id,
        name: 'Jagung',
        category: 'Biji-bijian',
        available_stock: 0,
        monthly_capacity: 50,
        price_per_kg: 4800,
        unit: 'Ton'
      });

      // Reset
      setCoopData({ name: '', address: '', city: '', province: '', head: '', phone: '' });
      setCoopCoords(null);
      alert("Koperasi berhasil didaftarkan ke platform!");
      setActiveTab('list');
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Buyer
  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerData.company_name || !buyerData.city || !buyerData.industry || !buyerData.address) {
      alert("Harap lengkapi nama perusahaan, kota, industri, dan alamat kirim buyer.");
      return;
    }

    setSubmitting(true);
    try {
      const isVerified = !!(buyerData.nib && buyerData.siup);

      await addDoc(collection(db, 'buyers'), {
        company_name: buyerData.company_name,
        city: buyerData.city,
        industry: buyerData.industry,
        address: buyerData.address,
        nib: buyerData.nib || '',
        siup: buyerData.siup || '',
        verified: isVerified
      });

      // Reset
      setBuyerData({ company_name: '', city: '', industry: '', address: '', nib: '', siup: '' });
      alert("Perusahaan buyer berhasil didaftarkan!");
      setActiveTab('list');
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete cooperative
  const handleDeleteCoop = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus koperasi ini? Seluruh data stok dan skor juga akan dihapus.")) {
      try {
        await deleteDoc(doc(db, 'cooperatives', id));
        await cooperativeRepository.deleteCooperativeScore(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Delete buyer
  const handleDeleteBuyer = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus buyer ini?")) {
      try {
        await deleteDoc(doc(db, 'buyers', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading || (userData && userData.role !== 'admin')) {
    return (
      <div className="flex h-[calc(100vh-68px)] items-center justify-center bg-[#f7f8fa]">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider animate-pulse">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] bg-brand-navy text-white px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
          Panel Administrator
        </span>
        <h1 className="text-2xl font-semibold text-slate-900 leading-tight">
          Onboarding Kemitraan Gotong Royong
        </h1>
        <p className="text-xs text-slate-505">
          Daftarkan, kelola, dan verifikasi profil koperasi tani desa (penyedia) serta perusahaan industri (buyer) ke dalam ekosistem ARUNA.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('koperasi')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'koperasi' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          Koperasi Baru
        </button>
        <button
          onClick={() => setActiveTab('buyer')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'buyer' ? 'border-brand-red text-brand-red' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          Buyer Baru
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'list' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
        >
          Daftar Mitra ({coops.length + buyers.length})
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'koperasi' && (
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 uppercase tracking-wider">
              <Users className="h-4.5 w-4.5 text-brand-orange" /> Tambah Koperasi Tani Desa Baru
            </CardTitle>
            <CardDescription className="text-[11px]">
              Daftarkan koperasi dan data administratif pengurus koperasi desa sebagai penyedia pasok komoditas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCoopSubmit} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">Nama Koperasi <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="Koperasi Tani Makmur"
                    value={coopData.name}
                    onChange={(e) => setCoopData({ ...coopData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">Nama Ketua Koperasi <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Sukirman"
                    value={coopData.head}
                    onChange={(e) => setCoopData({ ...coopData, head: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">Kabupaten / Kota <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="Lombok Barat"
                    value={coopData.city}
                    onChange={(e) => setCoopData({ ...coopData, city: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">Provinsi <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="NTB"
                    value={coopData.province}
                    onChange={(e) => setCoopData({ ...coopData, province: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">No. Telepon Pengurus <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={coopData.phone}
                    onChange={(e) => setCoopData({ ...coopData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-slate-500">Alamat Lengkap Koperasi <span className="text-red-500">*</span>:</label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Raya Pertanian No. 100, Kecamatan Gerung"
                  value={coopData.address}
                  onChange={(e) => setCoopData({ ...coopData, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                />
              </div>

              {/* Pinpoint Map Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold text-slate-500 block">Lokasi Koperasi (Peta Pinpoint) <span className="text-red-500">*</span>:</label>
                <div className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs relative">
                  <PinpointMapWrapper
                    onLocationSelect={(lat, lng) => setCoopCoords({ lat, lng })}
                    initialLocation={coopCoords ? [coopCoords.lat, coopCoords.lng] : undefined}
                  />
                </div>
                {coopCoords && (
                  <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                    <Check className="h-3.5 w-3.5" /> Koordinat Terkunci: {coopCoords.lat.toFixed(6)}, {coopCoords.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                {submitting ? 'Menyimpan Koperasi...' : 'Daftarkan Koperasi Desa'}
                <Plus className="h-4.5 w-4.5 text-brand-cream" />
              </Button>

            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'buyer' && (
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-slate-900 uppercase tracking-wider">
              <Building2 className="h-4.5 w-4.5 text-brand-red" /> Tambah Perusahaan Buyer Baru
            </CardTitle>
            <CardDescription className="text-[11px]">
              Daftarkan perusahaan industri/offtaker nasional yang memposting permintaan pasokan komoditas skala besar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuyerSubmit} className="space-y-4">

              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-slate-500">Nama Perusahaan / Pabrik <span className="text-red-500">*</span>:</label>
                <input
                  type="text"
                  required
                  placeholder="PT Indofood CBP Sukses Makmur Tbk"
                  value={buyerData.company_name}
                  onChange={(e) => setBuyerData({ ...buyerData, company_name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">Kota Lokasi Pabrik <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="Semarang"
                    value={buyerData.city}
                    onChange={(e) => setBuyerData({ ...buyerData, city: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">Sektor Industri <span className="text-red-500">*</span>:</label>
                  <input
                    type="text"
                    required
                    placeholder="Makanan Olahan / FMCG"
                    value={buyerData.industry}
                    onChange={(e) => setBuyerData({ ...buyerData, industry: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-slate-500">Alamat Lengkap Pabrik / Gudang Penerima <span className="text-red-500">*</span>:</label>
                <textarea
                  required
                  placeholder="Contoh: Jl. Industri Raya No. 45, Kawasan Industri Jababeka, Cikarang, Bekasi"
                  value={buyerData.address}
                  onChange={(e) => setBuyerData({ ...buyerData, address: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">NIB (Nomor Induk Berusaha) <span className="text-slate-400 font-medium lowercase">(opsional)</span>:</label>
                  <input
                    type="text"
                    placeholder="12 digit nomor NIB"
                    value={buyerData.nib}
                    onChange={(e) => setBuyerData({ ...buyerData, nib: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-500">SIUP / Nomor Akta Pendirian <span className="text-slate-400 font-medium lowercase">(opsional)</span>:</label>
                  <input
                    type="text"
                    placeholder="AHU-xxxxxx.AH.xx.xx"
                    value={buyerData.siup}
                    onChange={(e) => setBuyerData({ ...buyerData, siup: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
              </div>

              <p className="text-[9px] text-slate-400 italic">
                *Jika NIB dan SIUP diisi lengkap, perusahaan buyer ini akan langsung menyandang lencana status **Terverifikasi** secara resmi.
              </p>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-semibold text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                {submitting ? 'Menyimpan Buyer...' : 'Daftarkan Buyer Industri'}
                <Plus className="h-4.5 w-4.5 text-brand-cream" />
              </Button>

            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'list' && (
        <div className="space-y-6">

          {/* Cooperatives List */}
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold uppercase text-brand-orange tracking-wider">Daftar Koperasi Desa Terdaftar</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Total: {coops.length} Koperasi Desa</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {coops.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada koperasi terdaftar.</p>
              ) : (
                coops.map((coop) => (
                  <div key={coop.id} className="p-4 flex items-start justify-between hover:bg-slate-50/50 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-xs text-slate-800">{coop.name}</h4>
                        {coop.simkopdes_id ? (
                          <span className="text-[9px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.2 rounded-full uppercase">SimkopDes</span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-slate-55 border border-slate-250 text-slate-400 px-1.5 py-0.2 rounded-full uppercase">Offline</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{coop.address} — {coop.city}, {coop.province}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Ketua: <strong className="text-slate-600">{coop.head || '-'}</strong> | Kontak: <strong className="text-slate-650">{coop.phone || '-'}</strong></p>

                      {/* Document Compliance Verification Action Panel */}
                      {(coop.nib_status === 'pending' || coop.sk_status === 'pending') && (
                        <div className="mt-3 p-3 bg-orange-50/30 rounded-xl border border-brand-orange/20 space-y-2 max-w-lg">
                          <span className="text-[9px] font-semibold text-brand-orange uppercase tracking-wider block">Verifikasi Dokumen Kepatuhan (KYC)</span>

                          {/* NIB Verification */}
                          {coop.nib_status === 'pending' && (
                            <div className="flex items-center justify-between gap-3 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                              <div>
                                <span className="font-semibold text-slate-700 block">NIB: {coop.nib}</span>
                                {coop.nib_document_url && (
                                  <a href={coop.nib_document_url} target="_blank" rel="noreferrer" className="text-[9px] text-brand-orange font-semibold hover:underline block mt-0.5">
                                    Lihat Dokumen NIB &rarr;
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={async () => {
                                    await cooperativeRepository.verifyCooperativeDocs(coop.id, 'nib', 'verified');
                                    alert('Dokumen NIB terverifikasi. Nilai ARUNA Score koperasi diperbarui!');
                                  }}
                                  className="p-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Check className="h-3 w-3" /> Setujui
                                </button>
                                <button
                                  onClick={async () => {
                                    await cooperativeRepository.verifyCooperativeDocs(coop.id, 'nib', 'rejected');
                                    alert('Dokumen NIB ditolak.');
                                  }}
                                  className="p-1 px-2 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <XCircle className="h-3 w-3" /> Tolak
                                </button>
                              </div>
                            </div>
                          )}

                          {/* SK Verification */}
                          {coop.sk_status === 'pending' && (
                            <div className="flex items-center justify-between gap-3 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                              <div>
                                <span className="font-semibold text-slate-700 block">SK Pendirian: {coop.sk_number}</span>
                                {coop.sk_document_url && (
                                  <a href={coop.sk_document_url} target="_blank" rel="noreferrer" className="text-[9px] text-brand-orange font-semibold hover:underline block mt-0.5">
                                    Lihat Dokumen SK &rarr;
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={async () => {
                                    await cooperativeRepository.verifyCooperativeDocs(coop.id, 'sk', 'verified');
                                    alert('Dokumen SK Pendirian terverifikasi. Nilai ARUNA Score koperasi diperbarui!');
                                  }}
                                  className="p-1 px-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Check className="h-3 w-3" /> Setujui
                                </button>
                                <button
                                  onClick={async () => {
                                    await cooperativeRepository.verifyCooperativeDocs(coop.id, 'sk', 'rejected');
                                    alert('Dokumen SK Pendirian ditolak.');
                                  }}
                                  className="p-1 px-2 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <XCircle className="h-3 w-3" /> Tolak
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoop(coop.id)}
                      className="border-red-100 hover:bg-red-50 hover:text-brand-red text-[11px] p-2 h-8 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Buyers List */}
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold uppercase text-brand-red tracking-wider">Daftar Buyer Terdaftar</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Total: {buyers.length} Buyer Terdaftar</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {buyers.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada buyer terdaftar.</p>
              ) : (
                buyers.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-slate-800">{b.company_name}</h4>
                        {b.buyer_type === 'umkm' ? (
                          <span className="text-[9px] font-semibold bg-orange-50 border border-orange-200 text-orange-700 px-1.5 py-0.2 rounded-full uppercase">Mitra UMKM</span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-red-50 border border-red-200 text-brand-red px-1.5 py-0.2 rounded-full uppercase">Offtaker Industri</span>
                        )}
                        {b.verified ? (
                          <span className="text-[9px] font-semibold bg-emerald-50 border border-emerald-250 text-emerald-700 px-1.5 py-0.2 rounded-full uppercase">Verified</span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-slate-100 border border-slate-200 text-slate-400 px-1.5 py-0.2 rounded-full uppercase">Unverified</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{b.industry} — {b.city}</p>
                      {(b.nib || b.siup) && (
                        <p className="text-[9px] text-slate-400 mt-1">NIB: <strong className="text-slate-600">{b.nib || '-'}</strong> | SIUP: <strong className="text-slate-600">{b.siup || '-'}</strong></p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBuyer(b.id)}
                      className="border-red-100 hover:bg-red-50 hover:text-brand-red text-[11px] p-2 h-8 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, MapPin, Compass, ShieldAlert, Check, Plus, Trash2, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import PinpointMapWrapper from '@/components/map/PinpointMapWrapper';
import { Cooperative, Buyer } from '@/types';

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
        router.push('/dashboard');
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
      await setDoc(doc(db, 'scores', coopRef.id), {
        cooperative_id: coopRef.id,
        final_score: 75,
        health_score: 80,
        growth_score: 70,
        supply_score: 75,
        grade: 'B'
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
    if (!buyerData.company_name || !buyerData.city || !buyerData.industry) {
      alert("Harap lengkapi nama perusahaan, kota, dan industri buyer.");
      return;
    }

    setSubmitting(true);
    try {
      const isVerified = !!(buyerData.nib && buyerData.siup);

      await addDoc(collection(db, 'buyers'), {
        company_name: buyerData.company_name,
        city: buyerData.city,
        industry: buyerData.industry,
        nib: buyerData.nib || '',
        siup: buyerData.siup || '',
        verified: isVerified
      });

      // Reset
      setBuyerData({ company_name: '', city: '', industry: '', nib: '', siup: '' });
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
        await deleteDoc(doc(db, 'scores', id));
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
      <div className="flex h-[calc(100vh-68px)] items-center justify-center bg-[#faf9f6]">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider animate-pulse">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 font-sans">
      
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] bg-brand-navy text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
          Panel Administrator
        </span>
        <h1 className="text-2xl font-black text-slate-900 leading-tight">
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
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'koperasi' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Koperasi Baru
        </button>
        <button
          onClick={() => setActiveTab('buyer')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'buyer' ? 'border-brand-red text-brand-red' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Buyer Baru
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'list' ? 'border-brand-navy text-brand-navy' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Daftar Mitra ({coops.length + buyers.length})
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'koperasi' && (
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-black flex items-center gap-1.5 text-slate-900 uppercase tracking-wider">
              <Users className="h-4.5 w-4.5 text-brand-orange" /> Tambah Koperasi Tani Desa Baru
            </CardTitle>
            <CardDescription className="text-[11px]">
              Daftarkan gudang dan data administratif pengurus koperasi desa sebagai penyedia pasok komoditas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCoopSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Koperasi:</label>
                  <input
                    type="text"
                    required
                    placeholder="Koperasi Tani Makmur"
                    value={coopData.name}
                    onChange={(e) => setCoopData({ ...coopData, name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Ketua Koperasi:</label>
                  <input
                    type="text"
                    required
                    placeholder="Bpk. Sukirman"
                    value={coopData.head}
                    onChange={(e) => setCoopData({ ...coopData, head: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Kabupaten / Kota:</label>
                  <input
                    type="text"
                    required
                    placeholder="Lombok Barat"
                    value={coopData.city}
                    onChange={(e) => setCoopData({ ...coopData, city: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Provinsi:</label>
                  <input
                    type="text"
                    required
                    placeholder="NTB"
                    value={coopData.province}
                    onChange={(e) => setCoopData({ ...coopData, province: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">No. Telepon Pengurus:</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={coopData.phone}
                    onChange={(e) => setCoopData({ ...coopData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Alamat Lengkap Gudang:</label>
                <input
                  type="text"
                  required
                  placeholder="Jl. Raya Pertanian No. 100, Kecamatan Gerung"
                  value={coopData.address}
                  onChange={(e) => setCoopData({ ...coopData, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                />
              </div>

              {/* Pinpoint Map Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Lokasi Gudang Koperasi (Peta Pinpoint):</label>
                <div className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs relative">
                  <PinpointMapWrapper
                    onLocationSelect={(lat, lng) => setCoopCoords({ lat, lng })}
                    initialLocation={coopCoords ? [coopCoords.lat, coopCoords.lng] : undefined}
                  />
                </div>
                {coopCoords && (
                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <Check className="h-3.5 w-3.5" /> Koordinat Terkunci: {coopCoords.lat.toFixed(6)}, {coopCoords.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
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
            <CardTitle className="text-xs font-black flex items-center gap-1.5 text-slate-900 uppercase tracking-wider">
              <Building2 className="h-4.5 w-4.5 text-brand-red" /> Tambah Perusahaan Buyer Baru
            </CardTitle>
            <CardDescription className="text-[11px]">
              Daftarkan perusahaan industri/offtaker nasional yang memposting permintaan pasokan komoditas skala besar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBuyerSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Perusahaan / Pabrik:</label>
                <input
                  type="text"
                  required
                  placeholder="PT Indofood CBP Sukses Makmur Tbk"
                  value={buyerData.company_name}
                  onChange={(e) => setBuyerData({ ...buyerData, company_name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Kota Lokasi Pabrik:</label>
                  <input
                    type="text"
                    required
                    placeholder="Semarang"
                    value={buyerData.city}
                    onChange={(e) => setBuyerData({ ...buyerData, city: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Sektor Industri:</label>
                  <input
                    type="text"
                    required
                    placeholder="Makanan Olahan / FMCG"
                    value={buyerData.industry}
                    onChange={(e) => setBuyerData({ ...buyerData, industry: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">NIB (Nomor Induk Berusaha) - Opsional:</label>
                  <input
                    type="text"
                    placeholder="12 digit nomor NIB"
                    value={buyerData.nib}
                    onChange={(e) => setBuyerData({ ...buyerData, nib: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">SIUP / Nomor Akta Pendirian - Opsional:</label>
                  <input
                    type="text"
                    placeholder="AHU-xxxxxx.AH.xx.xx"
                    value={buyerData.siup}
                    onChange={(e) => setBuyerData({ ...buyerData, siup: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                  />
                </div>
              </div>

              <p className="text-[9px] text-slate-400 italic">
                *Jika NIB dan SIUP diisi lengkap, perusahaan buyer ini akan langsung menyandang lencana status **Terverifikasi** secara resmi.
              </p>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
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
                <CardTitle className="text-xs font-black uppercase text-brand-orange tracking-wider">Daftar Koperasi Desa Terdaftar</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Total: {coops.length} Koperasi Desa</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {coops.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400 italic">Tidak ada koperasi terdaftar.</p>
              ) : (
                coops.map((coop) => (
                  <div key={coop.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">{coop.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{coop.address} — {coop.city}, {coop.province}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Ketua: <strong className="text-slate-600">{coop.head || '-'}</strong> | Kontak: <strong className="text-slate-650">{coop.phone || '-'}</strong></p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoop(coop.id)}
                      className="border-red-100 hover:bg-red-50 hover:text-brand-red text-[11px] p-2 h-8 cursor-pointer"
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
                <CardTitle className="text-xs font-black uppercase text-brand-red tracking-wider">Daftar Buyer Industri Terdaftar</CardTitle>
                <CardDescription className="text-[10px] mt-0.5">Total: {buyers.length} Buyer Industri</CardDescription>
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
                        <h4 className="font-extrabold text-xs text-slate-800">{b.company_name}</h4>
                        {b.verified ? (
                          <span className="text-[9px] font-black bg-emerald-50 border border-emerald-200 text-emerald-700 px-1.5 py-0.2 rounded-full uppercase">Verified</span>
                        ) : (
                          <span className="text-[9px] font-black bg-slate-55 border border-slate-250 text-slate-500 px-1.5 py-0.2 rounded-full uppercase">Unverified</span>
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
                      className="border-red-100 hover:bg-red-50 hover:text-brand-red text-[11px] p-2 h-8 cursor-pointer"
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

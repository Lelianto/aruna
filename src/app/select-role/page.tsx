'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ShieldAlert, CheckCircle2, ArrowRight, Check, Loader2, ShoppingCart, Landmark, Lock } from 'lucide-react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { buyerRepository } from '@/lib/repositories/buyer.repository';
import { Cooperative, Buyer } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import PinpointMapWrapper from '@/components/map/PinpointMapWrapper';
import { uploadDocument } from '@/lib/firebase/upload';

export default function SelectRolePage() {
  const { user, userData, setRoleForUser, loading } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'buyer' | 'koperasi' | 'customer' | 'pemerintah' | null>(null);
  const [associatedId, setAssociatedId] = useState<string>('');
  
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New cooperative registration states
  const [isNewCoop, setIsNewCoop] = useState(false);
  const [newCoopData, setNewCoopData] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    head: '',
    phone: '',
    simkopdes_id: '',
    nib: '',
    sk_number: ''
  });
  const [nibFile, setNibFile] = useState<File | null>(null);
  const [skFile, setSkFile] = useState<File | null>(null);
  const [coopCoords, setCoopCoords] = useState<{ lat: number; lng: number } | null>(null);

  // New buyer registration states
  const [isNewBuyer, setIsNewBuyer] = useState(false);
  const [newBuyerData, setNewBuyerData] = useState({
    company_name: '',
    city: '',
    industry: '',
    address: '',
    nib: '',
    siup: '',
    buyer_type: 'industri' as 'industri' | 'umkm'
  });

  const buyerOptions = useMemo(() => {
    return buyers.map(b => ({ value: b.id, label: `${b.company_name} (${b.city})` }));
  }, [buyers]);

  const coopOptions = useMemo(() => {
    return coops.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }));
  }, [coops]);

  // Pre-fill fields if user already has a role set
  useEffect(() => {
    if (userData?.role) {
      setSelectedRole(userData.role);
      if (userData.associatedId) {
        setAssociatedId(userData.associatedId);
      }
    }
  }, [userData]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Auto-detect user current location for pinpoint default on pendaftaran baru
  useEffect(() => {
    if (isNewCoop && !coopCoords && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoopCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation access denied or failed, using default center.", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isNewCoop, coopCoords]);

  // Load lists for selection dropdowns
  useEffect(() => {
    async function loadData() {
      try {
        const cList = await cooperativeRepository.getAll();
        const bList = await buyerRepository.getAll();
        setCoops(cList);
        setBuyers(bList);
        
        if (cList.length > 0) setAssociatedId(cList[0].id);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      }
    }
    loadData();
  }, []);

  // Update associated ID automatically when role changes
  useEffect(() => {
    if (selectedRole === 'koperasi' && coops.length > 0) {
      setAssociatedId(coops[0].id);
    } else if (selectedRole === 'buyer' && buyers.length > 0) {
      setAssociatedId(buyers[0].id);
    } else {
      setAssociatedId('');
    }
  }, [selectedRole, coops, buyers]);

  const handleSubmit = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      let finalAssociatedId = associatedId;

      if (selectedRole === 'koperasi' && isNewCoop) {
        // Validate input fields
        if (!newCoopData.name || !newCoopData.city || !newCoopData.province || !newCoopData.address || !newCoopData.head || !newCoopData.phone) {
          alert("Harap lengkapi semua formulir data dasar koperasi baru Anda.");
          setSubmitting(false);
          return;
        }

        // Validate SimkopDes ID
        if (newCoopData.simkopdes_id) {
          const simkopdesRegex = /^KDKMP-\d{5}$/;
          if (!simkopdesRegex.test(newCoopData.simkopdes_id.trim())) {
            alert("ID SimkopDes tidak valid! Harus berformat: KDKMP-XXXXX (contoh: KDKMP-10482)");
            setSubmitting(false);
            return;
          }
        }

        // Validate NIB if entered
        if (newCoopData.nib.trim()) {
          const nibRegex = /^\d{13}$/;
          if (!nibRegex.test(newCoopData.nib.trim())) {
            alert("Nomor NIB tidak valid! Harus berupa 13 digit angka.");
            setSubmitting(false);
            return;
          }
          if (!nibFile) {
            alert("Harap unggah berkas foto/dokumen NIB Anda.");
            setSubmitting(false);
            return;
          }
        }

        // Validate SK if entered
        if (newCoopData.sk_number.trim()) {
          const skRegex = /^[a-zA-Z0-9.\-/]{5,50}$/;
          if (!skRegex.test(newCoopData.sk_number.trim())) {
            alert("Nomor SK Pendirian tidak valid! Format: 5-50 karakter alfanumerik, titik, strip, atau garis miring.");
            setSubmitting(false);
            return;
          }
          if (!skFile) {
            alert("Harap unggah berkas foto/dokumen SK Pendirian Anda.");
            setSubmitting(false);
            return;
          }
        }

        if (!coopCoords) {
          alert("Harap tentukan titik lokasi gudang koperasi Anda pada peta pinpoint.");
          setSubmitting(false);
          return;
        }

        // Upload documents if selected
        let nibUrl = '';
        let nibStatus: 'unsubmitted' | 'pending' = 'unsubmitted';
        if (newCoopData.nib.trim() && nibFile) {
          nibUrl = await uploadDocument(nibFile, `kyc/nib_${Date.now()}_${nibFile.name}`);
          nibStatus = 'pending';
        }

        let skUrl = '';
        let skStatus: 'unsubmitted' | 'pending' = 'unsubmitted';
        if (newCoopData.sk_number.trim() && skFile) {
          skUrl = await uploadDocument(skFile, `kyc/sk_${Date.now()}_${skFile.name}`);
          skStatus = 'pending';
        }

        // 1. Create cooperative in Firestore
        const coopCol = collection(db, 'cooperatives');
        const newCoopDoc = await addDoc(coopCol, {
          name: newCoopData.name,
          address: newCoopData.address,
          city: newCoopData.city,
          province: newCoopData.province,
          head: newCoopData.head,
          phone: newCoopData.phone,
          latitude: coopCoords.lat,
          longitude: coopCoords.lng,
          simkopdes_id: newCoopData.simkopdes_id.trim() || null,
          nib: newCoopData.nib.trim() || null,
          nib_document_url: nibUrl || null,
          nib_status: nibStatus,
          sk_number: newCoopData.sk_number.trim() || null,
          sk_document_url: skUrl || null,
          sk_status: skStatus,
          cash_reserve: 100000000, // Default Rp 100jt reserve
          member_count: 50,
          active_members: 35,
          annual_revenue: 120000000
        });
        finalAssociatedId = newCoopDoc.id;

        // 2. Create ARUNA Score document
        await cooperativeRepository.upsertCooperativeScore(finalAssociatedId, {
          final_score: 75,
          health_score: 80,
          growth_score: 70,
          supply_score: 75,
          grade: 'B',
        });

        // 3. Create default Jagung commodity
        const commodityCol = collection(db, 'commodities');
        await addDoc(commodityCol, {
          cooperative_id: finalAssociatedId,
          name: 'Jagung',
          category: 'Pangan',
          available_stock: 0,
          monthly_capacity: 50,
          price_per_kg: 4800,
          unit: 'Ton'
        });
      }

      if (selectedRole === 'buyer' && isNewBuyer) {
        // Validate basic required fields
        if (!newBuyerData.company_name || !newBuyerData.city || !newBuyerData.industry || !newBuyerData.address) {
          alert("Harap lengkapi nama perusahaan, kota pabrik, sektor industri, dan alamat pengiriman Anda.");
          setSubmitting(false);
          return;
        }

        // SIUP is required only for 'industri' scale
        if (newBuyerData.buyer_type === 'industri' && !newBuyerData.siup) {
          alert("Nomor SIUP Kemenkumham wajib diisi untuk skala Offtaker Industri.");
          setSubmitting(false);
          return;
        }

        const isVerified = newBuyerData.buyer_type === 'umkm' 
          ? !!newBuyerData.nib 
          : !!(newBuyerData.nib && newBuyerData.siup);

        // Create buyer in Firestore
        const buyerCol = collection(db, 'buyers');
        const newBuyerDoc = await addDoc(buyerCol, {
          company_name: newBuyerData.company_name,
          city: newBuyerData.city,
          industry: newBuyerData.industry,
          address: newBuyerData.address,
          nib: newBuyerData.nib || '',
          siup: newBuyerData.siup || '',
          buyer_type: newBuyerData.buyer_type,
          verified: isVerified
        });
        finalAssociatedId = newBuyerDoc.id;
      }

      await setRoleForUser(selectedRole, finalAssociatedId || undefined);
      if (selectedRole === 'koperasi') {
        router.push('/mitra-dashboard');
      } else if (selectedRole === 'pemerintah') {
        router.push('/potensi-desa');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error("Error setting role:", err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-cream/20">
        <div className="text-center space-y-2">
          <div className="pulsing-dot mx-auto"></div>
          <p className="text-xs text-slate-500 font-bold animate-pulse">Menghubungkan sesi autentikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6">
        
        {/* Title Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] bg-brand-navy text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Registrasi Akun Baru
          </span>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            Pilih Peran Akses Anda
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Selamat datang, <strong className="text-slate-700">{user?.displayName}</strong>. Pilih peran untuk menyesuaikan hak akses visualisasi data gotong royong Anda.
          </p>
        </div>

        {/* Roles List Selection */}
        <div className="space-y-4">
          
          {/* 1. Admin Role */}
          {userData?.role === 'admin' ? (
            <div 
              onClick={() => setSelectedRole('admin')}
              className={`cursor-pointer p-4 bg-white border rounded-2xl transition-all duration-200 flex gap-4 items-start ${
                selectedRole === 'admin' 
                  ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md bg-brand-cream/5' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedRole === 'admin' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-slate-900">Administrator ARUNA (Admin)</h3>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Akses penuh untuk mengelola Command Center, membagi kuota logsitik secara gotong royong, dan memantau analitik nasional.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-4 items-start opacity-60 cursor-not-allowed">
              <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-slate-400">Administrator ARUNA (Admin)</h3>
                  <span className="text-[9px] bg-slate-200 text-slate-500 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    🔒 Terkunci
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Peran ini hanya dapat disematkan secara manual oleh Pengelola/Admin Platform.
                </p>
              </div>
            </div>
          )}

          {/* 2. Buyer Role */}
          <div 
            onClick={() => setSelectedRole('buyer')}
            className={`cursor-pointer p-4 bg-white border rounded-2xl transition-all duration-200 flex gap-4 items-start ${
              selectedRole === 'buyer' 
                ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md bg-brand-cream/5' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedRole === 'buyer' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 w-full">
              <h3 className="font-black text-sm text-slate-900">Buyer Industri (Offtaker)</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Posting kuota permintaan pangan skala besar, tandatangani berkas SPK digital, dan unduh bukti kuitansi transfer.
              </p>
              
              {selectedRole === 'buyer' && (
                <div className="pt-3 border-t border-slate-100 mt-2 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="new-buyer-chk"
                      checked={isNewBuyer}
                      onChange={(e) => setIsNewBuyer(e.target.checked)}
                      className="rounded text-brand-red focus:ring-brand-red h-4.5 w-4.5 cursor-pointer accent-brand-red"
                    />
                    <label htmlFor="new-buyer-chk" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      Perusahaan saya belum terdaftar (Daftarkan Baru)
                    </label>
                  </div>

                  {!isNewBuyer ? (
                    <CustomSelect
                      label="Pilih Perusahaan Terdaftar:"
                      options={buyerOptions}
                      value={associatedId}
                      onChange={(val) => setAssociatedId(val)}
                    />
                  ) : (
                    <div className="space-y-2.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-brand-red uppercase tracking-wider block">Registrasi & Verifikasi Pembeli Baru</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">Skala / Tipe Bisnis:</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="buyer_type" 
                              checked={newBuyerData.buyer_type === 'industri'}
                              onChange={() => setNewBuyerData({...newBuyerData, buyer_type: 'industri'})}
                              className="text-brand-red focus:ring-brand-red accent-brand-red h-4 w-4" 
                            />
                            Offtaker Industri (Besar)
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                            <input 
                              type="radio" 
                              name="buyer_type" 
                              checked={newBuyerData.buyer_type === 'umkm'}
                              onChange={() => setNewBuyerData({...newBuyerData, buyer_type: 'umkm'})}
                              className="text-brand-red focus:ring-brand-red accent-brand-red h-4 w-4" 
                            />
                            Mitra UMKM (Kecil/Menengah)
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">
                          {newBuyerData.buyer_type === 'industri' ? 'Nama Perusahaan / Pabrik:' : 'Nama Usaha / Toko:'}
                        </label>
                        <input 
                          type="text"
                          placeholder={newBuyerData.buyer_type === 'industri' ? 'Contoh: PT Indofood Tbk' : 'Contoh: Katering Rasa Sayang'}
                          value={newBuyerData.company_name}
                          onChange={(e) => setNewBuyerData({...newBuyerData, company_name: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Kota Pabrik/Gudang:</label>
                          <input 
                            type="text"
                            placeholder="Contoh: Surabaya"
                            value={newBuyerData.city}
                            onChange={(e) => setNewBuyerData({...newBuyerData, city: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Sektor Industri:</label>
                          <input 
                            type="text"
                            placeholder="Contoh: FMCG / Pakan Ternak"
                            value={newBuyerData.industry}
                            onChange={(e) => setNewBuyerData({...newBuyerData, industry: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">Alamat Lengkap Pengiriman (Pabrik / Gudang):</label>
                        <textarea 
                          placeholder="Contoh: Jl. Industri Raya No. 45, Kawasan Industri Jababeka, Cikarang, Bekasi"
                          value={newBuyerData.address}
                          onChange={(e) => setNewBuyerData({...newBuyerData, address: e.target.value})}
                          rows={2}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800 resize-none font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">NIB (Nomor Induk Berusaha):</label>
                          <input 
                            type="text"
                            placeholder="12 digit nomor NIB"
                            value={newBuyerData.nib}
                            onChange={(e) => setNewBuyerData({...newBuyerData, nib: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">
                            SIUP / Akta {newBuyerData.buyer_type === 'umkm' ? '(Opsional):' : 'Kemenkumham:'}
                          </label>
                          <input 
                            type="text"
                            placeholder="AHU-xxxxxx.AH.xx.xx"
                            value={newBuyerData.siup}
                            onChange={(e) => setNewBuyerData({...newBuyerData, siup: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800"
                          />
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-400 italic leading-relaxed">
                        {newBuyerData.buyer_type === 'umkm' 
                          ? '*Bagi Mitra UMKM, cukup menyantumkan NIB untuk mendapatkan status Terverifikasi oleh sistem kepatuhan ARUNA.'
                          : '*Dengan menginput NIB & Akta SIUP, akun Offtaker Anda akan langsung terverifikasi secara otomatis oleh sistem kepatuhan ARUNA.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Cooperative Role */}
          <div 
            onClick={() => setSelectedRole('koperasi')}
            className={`cursor-pointer p-4 bg-white border rounded-2xl transition-all duration-200 flex gap-4 items-start ${
              selectedRole === 'koperasi' 
                ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md bg-brand-cream/5' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedRole === 'koperasi' ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 w-full">
              <h3 className="font-black text-sm text-slate-900">Ketua Koperasi Desa (Penyedia)</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Laporkan ketersediaan stok panen, terima surat tugas pengiriman logistik gotong royong, dan monitor pencairan kas.
              </p>
              
              {selectedRole === 'koperasi' && (
                <div className="pt-3 border-t border-slate-100 mt-2 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="new-coop-chk"
                      checked={isNewCoop}
                      onChange={(e) => setIsNewCoop(e.target.checked)}
                      className="rounded text-brand-orange focus:ring-brand-orange h-4.5 w-4.5 cursor-pointer accent-brand-orange"
                    />
                    <label htmlFor="new-coop-chk" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      Koperasi saya belum terdaftar (Daftarkan Baru)
                    </label>
                  </div>

                  {!isNewCoop ? (
                    <CustomSelect
                      label="Pilih Koperasi Terdaftar:"
                      options={coopOptions}
                      value={associatedId}
                      onChange={(val) => setAssociatedId(val)}
                    />
                  ) : (
                    <div className="space-y-2.5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] font-black text-brand-orange uppercase tracking-wider block">Registrasi Koperasi Desa Baru</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">Nama Koperasi:</label>
                        <input 
                          type="text"
                          placeholder="Contoh: Koperasi Tani Makmur"
                          value={newCoopData.name}
                          onChange={(e) => setNewCoopData({...newCoopData, name: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Kabupaten/Kota:</label>
                          <input 
                            type="text"
                            placeholder="Contoh: Lombok Barat"
                            value={newCoopData.city}
                            onChange={(e) => setNewCoopData({...newCoopData, city: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Provinsi:</label>
                          <input 
                            type="text"
                            placeholder="Contoh: NTB"
                            value={newCoopData.province}
                            onChange={(e) => setNewCoopData({...newCoopData, province: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">Alamat Lengkap Gudang:</label>
                        <input 
                          type="text"
                          placeholder="Contoh: Jl. Raya Tani No. 45"
                          value={newCoopData.address}
                          onChange={(e) => setNewCoopData({...newCoopData, address: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Nama Ketua Koperasi:</label>
                          <input 
                            type="text"
                            placeholder="Contoh: Bpk. Sukirman"
                            value={newCoopData.head}
                            onChange={(e) => setNewCoopData({...newCoopData, head: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">No. Telepon Ketua:</label>
                          <input 
                            type="text"
                            placeholder="Contoh: 0812-xxxx-xxxx"
                            value={newCoopData.phone}
                            onChange={(e) => setNewCoopData({...newCoopData, phone: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">ID Registrasi SimkopDes (Opsional):</label>
                        <input 
                          type="text"
                          placeholder="KDKMP-XXXXX (Contoh: KDKMP-10482)"
                          value={newCoopData.simkopdes_id}
                          onChange={(e) => setNewCoopData({...newCoopData, simkopdes_id: e.target.value})}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Nomor NIB Koperasi (Opsional):</label>
                          <input 
                            type="text"
                            placeholder="13 digit NIB"
                            value={newCoopData.nib}
                            onChange={(e) => setNewCoopData({...newCoopData, nib: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Foto/Scan Dokumen NIB:</label>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNibFile(e.target.files?.[0] || null)}
                            className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-50 file:text-brand-orange hover:file:bg-orange-100 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">SK Pendirian Koperasi (Opsional):</label>
                          <input 
                            type="text"
                            placeholder="Nomor SK Koperasi"
                            value={newCoopData.sk_number}
                            onChange={(e) => setNewCoopData({...newCoopData, sk_number: e.target.value})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-orange text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">Foto/Scan SK Pendirian:</label>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSkFile(e.target.files?.[0] || null)}
                            className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-orange-50 file:text-brand-orange hover:file:bg-orange-100 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Interactive Pinpoint Map */}
                      <div className="space-y-1.5 pt-1.5">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">Tentukan Lokasi Gudang (Klik pada Peta):</label>
                        <div className="w-full h-[180px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs relative">
                          <PinpointMapWrapper 
                            onLocationSelect={(lat, lng) => setCoopCoords({ lat, lng })}
                            initialLocation={coopCoords ? [coopCoords.lat, coopCoords.lng] : undefined}
                          />
                        </div>
                        {coopCoords && (
                          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                            <Check className="h-3.5 w-3.5 shrink-0" /> Lokasi Terkunci: {coopCoords.lat.toFixed(6)}, {coopCoords.lng.toFixed(6)}
                          </p>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. Customer Role */}
          <div 
            onClick={() => setSelectedRole('customer')}
            className={`cursor-pointer p-4 bg-white border rounded-2xl transition-all duration-200 flex gap-4 items-start ${
              selectedRole === 'customer' 
                ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md bg-brand-cream/5' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              selectedRole === 'customer' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900">Pelanggan Umum (Customer)</h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                Cari komoditas pangan dari seluruh jaringan koperasi Indonesia, bandingkan jarak hyperlocal terdekat, dan lakukan checkout simulasi.
              </p>
            </div>
          </div>

          {/* 5. Pemerintah Role */}
          {(userData?.role === 'admin' || userData?.role === 'pemerintah') ? (
            <div 
              onClick={() => setSelectedRole('pemerintah')}
              className={`cursor-pointer p-4 bg-white border rounded-2xl transition-all duration-200 flex gap-4 items-start ${
                selectedRole === 'pemerintah' 
                  ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md bg-brand-cream/5' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedRole === 'pemerintah' ? 'bg-brand-navy text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <Landmark className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-sm text-slate-900">Pemerintah / Instansi Dinas (Government)</h3>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Akses penuh ke peta potensi strategis, dashboard komoditas nasional, evaluasi kelayakan, dan analisis AI kebijakan.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-4 items-start opacity-60 cursor-not-allowed">
              <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-slate-400">Pemerintah / Instansi Dinas (Government)</h3>
                  <span className="text-[9px] bg-slate-200 text-slate-500 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    🔒 Terkunci
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Peran ini hanya dapat disematkan secara manual oleh Pengelola/Admin Platform.
                </p>
              </div>
            </div>
          )}


        </div>

        {/* Submit button */}
        <Button 
          onClick={handleSubmit}
          disabled={!selectedRole || submitting}
          className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
        >
          {submitting ? 'Menyimpan Konfigurasi...' : 'Masuk ke Dashboard'}
          <ArrowRight className="h-4.5 w-4.5 text-brand-cream" />
        </Button>

      </div>
    </div>
  );
}

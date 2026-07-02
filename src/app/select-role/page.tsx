'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, ShieldAlert, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { buyerRepository } from '@/lib/repositories/buyer.repository';
import { Cooperative, Buyer } from '@/types';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { CustomSelect } from '@/components/ui/CustomSelect';
import PinpointMapWrapper from '@/components/map/PinpointMapWrapper';

export default function SelectRolePage() {
  const { user, userData, setRoleForUser, loading } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'buyer' | 'koperasi' | null>(null);
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
    phone: ''
  });
  const [coopCoords, setCoopCoords] = useState<{ lat: number; lng: number } | null>(null);

  // New buyer registration states
  const [isNewBuyer, setIsNewBuyer] = useState(false);
  const [newBuyerData, setNewBuyerData] = useState({
    company_name: '',
    city: '',
    industry: '',
    nib: '',
    siup: ''
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
          alert("Harap lengkapi semua formulir data koperasi baru Anda.");
          setSubmitting(false);
          return;
        }

        if (!coopCoords) {
          alert("Harap tentukan titik lokasi gudang koperasi Anda pada peta pinpoint.");
          setSubmitting(false);
          return;
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
          longitude: coopCoords.lng
        });
        finalAssociatedId = newCoopDoc.id;

        // 2. Create ARUNA Score document
        const scoreDocRef = doc(db, 'scores', finalAssociatedId);
        await setDoc(scoreDocRef, {
          cooperative_id: finalAssociatedId,
          final_score: 75,
          health_score: 80,
          growth_score: 70,
          supply_score: 75,
          grade: 'B'
        });

        // 3. Create default Jagung commodity
        const commodityCol = collection(db, 'commodities');
        await addDoc(commodityCol, {
          cooperative_id: finalAssociatedId,
          name: 'Jagung',
          category: 'Biji-bijian',
          available_stock: 0,
          monthly_capacity: 50,
          price_per_kg: 4800,
          unit: 'Ton'
        });
      }

      if (selectedRole === 'buyer' && isNewBuyer) {
        // Validate basic required fields
        if (!newBuyerData.company_name || !newBuyerData.city || !newBuyerData.industry) {
          alert("Harap lengkapi nama perusahaan, kota pabrik, dan sektor industri Anda.");
          setSubmitting(false);
          return;
        }

        const isVerified = !!(newBuyerData.nib && newBuyerData.siup);

        // Create buyer in Firestore
        const buyerCol = collection(db, 'buyers');
        const newBuyerDoc = await addDoc(buyerCol, {
          company_name: newBuyerData.company_name,
          city: newBuyerData.city,
          industry: newBuyerData.industry,
          nib: newBuyerData.nib || '',
          siup: newBuyerData.siup || '',
          verified: isVerified
        });
        finalAssociatedId = newBuyerDoc.id;
      }

      await setRoleForUser(selectedRole, finalAssociatedId || undefined);
      router.push('/dashboard');
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
                      <span className="text-[9px] font-black text-brand-red uppercase tracking-wider block">Registrasi & Verifikasi Offtaker Baru</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase">Nama Perusahaan / Pabrik:</label>
                        <input 
                          type="text"
                          placeholder="Contoh: PT Indofood Tbk"
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
                          <label className="text-[9px] font-bold text-slate-500 block uppercase">SIUP / Akta Kemenkumham:</label>
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
                        *Dengan menginput NIB & Akta SIUP, akun Offtaker Anda akan **langsung terverifikasi secara otomatis** oleh sistem kepatuhan ARUNA.
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

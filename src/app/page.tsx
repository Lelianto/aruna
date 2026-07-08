'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowRight, Building2, CheckCircle2, 
  Compass, Cpu, Map, Network, ShieldCheck, 
  Sparkles, WifiOff, Volume2, ShoppingCart, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [simulateValue, setSimulateValue] = useState<number>(500);

  const splits = useMemo(() => {
    return [
      { name: 'Koperasi Merah Putih Lampung', share: 0.36, grade: 'A', loc: 'Lampung' },
      { name: 'Koperasi Merah Putih NTB', share: 0.34, grade: 'B', loc: 'Lombok Barat' },
      { name: 'Koperasi Merah Putih Jatim', share: 0.30, grade: 'A', loc: 'Banyuwangi' }
    ].map(coop => {
      const allocated = Math.round(simulateValue * coop.share);
      return {
        ...coop,
        allocated
      };
    });
  }, [simulateValue]);

  const handleCTAClick = () => {
    if (user) {
      router.push('/mitra-dashboard');
    } else {
      signInWithGoogle();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf9f6] font-sans overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 border-b border-slate-200/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-cream/40 via-[#faf9f6] to-white">
        
        {/* Decorative background glows */}
        <div className="absolute top-20 right-1/4 h-80 w-80 bg-brand-orange/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 h-80 w-80 bg-brand-red/5 rounded-full filter blur-3xl pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-[1fr_1fr] items-center relative z-10">
          
          {/* Left: Punchy Headings & Actions */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cream border border-brand-navy/10 text-brand-navy font-bold text-[10px] uppercase tracking-wider shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange fill-brand-orange animate-pulse" />
              Sistem Operasi Koperasi Masa Depan
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-navy leading-[1.1] tracking-tight">
              Konsolidasi Usaha <br />
              Koperasi Merah Putih <br />
              <span className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-navy bg-clip-text text-transparent">
                Secara Gotong Royong
              </span>
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl">
              Platform tata kelola modern Koperasi Desa/Kelurahan Merah Putih (KDMP). Mengkonsolidasikan unit usaha, memetakan potensi daerah, dan mempermudah operasional kasir POS terintegrasi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleCTAClick}
                className="px-6 py-5 bg-brand-red hover:bg-brand-red/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                {user ? 'Buka Dashboard Mitra' : 'Masuk dengan Google'}
                <ArrowRight className="h-4.5 w-4.5" />
              </Button>
              <Link href="/pitch" className="w-full sm:w-auto">
                <Button 
                  variant="outline"
                  className="w-full px-6 py-5 border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer bg-white"
                >
                  Buka Pitch Deck
                </Button>
              </Link>
            </div>

            {/* Quick Live Metadata */}
            <div className="pt-4 border-t border-slate-200/80 flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Terhubung & Sinkron
              </span>
              <span>•</span>
              <span>Asisten AI Terintegrasi</span>
            </div>
          </div>

          {/* Right: Sandbox Aggregation Matchmaker Simulator */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-orange/10 to-brand-red/10 blur-2xl opacity-75 pointer-events-none"></div>
            
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_20px_50px_rgba(18,48,66,0.04)] space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Kalkulator Konsolidasi</span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    Permintaan Suplai Buyer <span className="text-slate-400 font-medium">({simulateValue} Ton)</span>
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[9px] font-black text-emerald-700 uppercase tracking-wider">
                  Sistem Aktif
                </span>
              </div>

              {/* Slider Input */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Volume Pesanan:</span>
                  <span className="text-brand-red font-black text-sm">{simulateValue} Ton</span>
                </div>
                <input 
                  type="range"
                  min={200}
                  max={800}
                  step={50}
                  value={simulateValue}
                  onChange={(e) => setSimulateValue(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red focus:outline-none"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-black uppercase">
                  <span>200 Ton</span>
                  <span>Geser untuk membagi kuota secara otomatis</span>
                  <span>800 Ton</span>
                </div>
              </div>

              {/* Aggregation Splits */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Alokasi Gotong Royong Koperasi Desa</span>
                {splits.map(coop => (
                  <div key={coop.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-3xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-cream text-brand-navy border border-brand-navy/5">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{coop.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{coop.loc} (Grade {coop.grade})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-brand-red">{coop.allocated} Ton</p>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                        <div 
                          className="bg-brand-orange h-full rounded-full transition-all duration-300"
                          style={{ width: `${(coop.allocated / 300) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* System Note */}
              <div className="bg-brand-navy rounded-xl p-3 text-white text-xs font-semibold flex items-start gap-2.5 shadow-2xs">
                <Network className="h-4.5 w-4.5 text-brand-yellow shrink-0 mt-0.5 animate-pulse" />
                <p className="leading-relaxed">
                  Permintaan industri dialokasikan secara proporsional berdasarkan radius koordinat terdekat, available stock aktual, & grade kesiapan masing-masing koperasi desa.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Keunggulan Utama (Core Advantages) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-b border-slate-200/50">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] font-black text-brand-red uppercase tracking-wider">Keunggulan Platform</span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">Mengapa Memilih ARUNA?</h2>
          <p className="text-xs sm:text-sm text-slate-450 max-w-md mx-auto">Solusi tangguh yang menjawab keterbatasan jaringan internet dan menyederhanakan pelaporan desa.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Benefit 1 */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-3xs flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-brand-cream border border-brand-navy/10 flex items-center justify-center text-brand-navy">
              <WifiOff className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900">Sistem Bekerja Offline</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                 POS Kasir tetap dapat digunakan untuk transaksi saat internet mati. Data disimpan aman di memori lokal dan disinkronkan otomatis setelah internet aktif kembali.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-3xs flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-brand-cream border border-brand-navy/10 flex items-center justify-center text-brand-navy">
              <Volume2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900">AI Command (Natural Language OS)</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Pengurus koperasi desa dapat melakukan stok opname, penjualan, dan pembelian komoditas cukup dengan mengetik atau mengirim perintah suara alami.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-3xs flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-brand-cream border border-brand-navy/10 flex items-center justify-center text-brand-navy">
              <Network className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-slate-900">Konsolidasi Gotong Royong</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Mengkonsolidasikan kapasitas pasokan beberapa sentra produksi desa terdekat demi memenuhi kuota pembelian minimum dari industri/offtaker besar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Utama (Core Features Grid) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] font-black text-brand-red uppercase tracking-wider">Fitur Utama</span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">Fungsionalitas Pusat Kendali</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">Dirancang sederhana dan intuitif demi menjembatani gap operasional desa.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1 */}
          <Card className="bg-white border rounded-2xl shadow-3xs hover:border-brand-navy/30 transition-all duration-200">
            <CardContent className="p-5 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-navy">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-black text-xs text-slate-900">Kasir POS & Pembelian</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pencatatan kasir penjualan anggota & log stok masuk pembelian produk anggota terintegrasi dengan penyesuaian stok instan.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-white border rounded-2xl shadow-3xs hover:border-brand-navy/30 transition-all duration-200">
            <CardContent className="p-5 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-navy">
                <Map className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-black text-xs text-slate-900">Peta Potensi Geografis</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Visualisasi peta interaktif yang memetakan sebaran panen, letak geografis koperasi desa, dan pabrik buyer terdekat.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-white border rounded-2xl shadow-3xs hover:border-brand-navy/30 transition-all duration-200">
            <CardContent className="p-5 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-navy">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-black text-xs text-slate-900">Stok Opname Mandiri</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Audit fisik stok berkala dengan penyesuaian otomatis serta rekam jejak log audit demi menjamin transparansi data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="bg-white border rounded-2xl shadow-3xs hover:border-brand-navy/30 transition-all duration-200">
            <CardContent className="p-5 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-navy">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-black text-xs text-slate-900">Penilaian Kinerja Koperasi</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Peringkat kelayakan kemitraan otomatis koperasi desa berdasarkan kesehatan finansial dan stabilitas supply.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-3xs md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4 animate-bounce" />
              Sistem Pusat Kendali Siap Digunakan
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed max-w-xl">
              Hubungkan data usaha koperasi Anda secara langsung. Didukung pencatatan luring terpadu dan analisis kecerdasan buatan prediktif untuk optimalisasi operasional.
            </p>
          </div>
          <Link href="/mitra-dashboard" className="w-full md:w-auto">
            <Button className="w-full gap-2 md:w-auto bg-brand-navy hover:bg-brand-navy/90 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-sm cursor-pointer h-10">
              Mulai Eksplorasi Sekarang <Compass className="h-4 w-4 text-brand-cream" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}

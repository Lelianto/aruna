'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowRight, BarChart3, Building2, CheckCircle2, 
  Compass, Cpu, Layers, Map, Network, ShieldCheck, 
  Sparkles, LogIn, Check, Info, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const metrics = [
  { value: '20+', label: 'Koperasi Mitra', tone: 'text-brand-navy' },
  { value: '14', label: 'Provinsi Aktif', tone: 'text-brand-red' },
  { value: '15+', label: 'Komoditas Pangan', tone: 'text-brand-orange' },
  { value: '800+ Ton', label: 'Kapasitas Bulanan', tone: 'text-emerald-700' },
];

const modules = [
  {
    icon: Map,
    title: 'Peta Potensi Logistik',
    desc: 'Pantau sebaran panen, kapasitas gudang koperasi desa, dan lokasi pabrik buyer secara geografis interaktif.',
    href: '/peta',
    color: 'border-brand-navy/15 hover:border-brand-navy/40'
  },
  {
    icon: Cpu,
    title: 'Gotong Royong Engine',
    desc: 'Simulasikan pembagian kuota pasokan secara proporsional ke koperasi desa untuk memenuhi kontrak besar.',
    href: '/marketplace',
    color: 'border-brand-red/15 hover:border-brand-red/40'
  },
  {
    icon: ShieldCheck,
    title: 'ARUNA Score & AI',
    desc: 'Uji tingkat kesehatan keuangan, stabilitas pasokan, serta diagnosis risiko koperasi menggunakan Gemini AI.',
    href: '/scoring',
    color: 'border-brand-orange/15 hover:border-brand-orange/40'
  },
];

const workflow = [
  {
    step: '1',
    title: 'Kebutuhan Pabrik Masuk',
    desc: 'Industri besar memposting kebutuhan komoditas dalam volume tinggi (ratusan ton) ke jaringan ARUNA.'
  },
  {
    step: '2',
    title: 'Algoritma Agregasi Aktif',
    desc: 'Sistem memetakan stok terdekat dari koperasi tani desa yang memiliki Grade kelayakan kemitraan tinggi.'
  },
  {
    step: '3',
    title: 'Pembagian Kuota Gotong Royong',
    desc: 'Kuota dibagi rata secara proporsional, menerbitkan SPK gabungan, dan mencairkan pembayaran ke masing-masing kas desa.'
  }
];

export default function LandingPage() {
  const { user, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  // Interactive Simulator State on Landing Page
  const [simulateValue, setSimulateValue] = useState<number>(500);

  // Calculate dynamic splits for simulator in real time
  const splits = useMemo(() => {
    return [
      { name: 'Koperasi Lampung Makmur', share: 0.36, grade: 'A', loc: 'Lampung' },
      { name: 'Koperasi NTB Sejahtera', share: 0.34, grade: 'B', loc: 'Lombok Barat' },
      { name: 'Koperasi Jatim Tani Bersatu', share: 0.30, grade: 'A', loc: 'Banyuwangi' }
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
      router.push('/peta');
    } else {
      signInWithGoogle();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf9f6] font-sans overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 border-b border-slate-200/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-cream/60 via-[#faf9f6] to-white">
        
        {/* Soft glowing mesh background elements */}
        <div className="absolute top-20 right-1/4 h-72 w-72 bg-brand-orange/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 h-72 w-72 bg-brand-red/5 rounded-full filter blur-3xl pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center relative z-10">
          
          {/* Left Column - Copywriting */}
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream border border-brand-navy/10 text-brand-navy font-bold text-[10px] uppercase tracking-wider shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-brand-orange fill-brand-orange" />
              Digital Cooperatives Expo 2026
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-brand-navy leading-[1.05] tracking-tight">
              Pusat Kendali <br />
              <span className="bg-gradient-to-r from-brand-navy via-brand-red to-brand-orange bg-clip-text text-transparent">
                Agregasi Pangan
              </span> <br />
              Nasional
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-slate-650 font-medium">
              Menghubungkan hasil panen petani lokal ke rantai pasok industri nasional. ARUNA memetakan potensi desa, mengagregasikan kuota logistik secara gotong royong, dan memverifikasi kualitas secara persisten.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleCTAClick}
                className="px-6 py-5 bg-brand-red hover:bg-brand-red/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                {user ? 'Buka Peta Potensi' : 'Masuk dengan Google'}
                <ArrowRight className="h-4.5 w-4.5 text-brand-cream" />
              </Button>
              <Link href="/pitch" className="w-full sm:w-auto">
                <Button 
                  variant="outline"
                  className="w-full px-6 py-5 border-slate-250 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Buka Pitch Deck
                </Button>
              </Link>
            </div>

            {/* Live Indicator Badges */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Koneksi Real-Time Firestore
              </span>
              <span>•</span>
              <span>Kunci API Gemini Terintegrasi</span>
            </div>
          </div>

          {/* Right Column - Live Interactive Sandbox Simulator */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-brand-orange/20 to-brand-red/20 blur-xl opacity-75 pointer-events-none"></div>
            
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_20px_50px_rgba(18,48,66,0.05)] space-y-5">
              
              {/* Header Box */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Gotong Royong Engine</span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-1">
                    Jagung Industri <span className="text-slate-400 font-medium">({simulateValue} Ton)</span>
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200/50 px-3 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                  Agregasi Aktif
                </span>
              </div>

              {/* Slider Controller */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Atur Permintaan Buyer:</span>
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
                <div className="flex justify-between text-[9px] text-slate-400 font-extrabold uppercase">
                  <span>200 Ton</span>
                  <span>Seret slider untuk membagi kuota</span>
                  <span>800 Ton</span>
                </div>
              </div>

              {/* Dynamic Allocation Splits List */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pembagian Kuota Tani Otomatis</span>
                
                {splits.map(coop => (
                  <div key={coop.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs hover:shadow-xs transition-shadow">
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

              {/* Aggregation Summary Banner */}
              <div className="bg-brand-navy rounded-xl p-3.5 text-white text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                <Network className="h-4.5 w-4.5 text-brand-yellow shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Permintaan industri sebesar <strong className="text-brand-cream">{simulateValue} Ton</strong> otomatis didistribusikan ke <strong className="text-brand-cream">3 koperasi desa</strong> berdasarkan ketersediaan stok & grade kesiapan kemitraan.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Metrics Row */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-200/50">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
          {metrics.map((item) => (
            <div key={item.label} className="text-center p-3 flex flex-col justify-center border-r last:border-0 border-slate-100 md:border-r md:last:border-0">
              <span className={`text-2xl font-black ${item.tone} tracking-tight`}>{item.value}</span>
              <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-1.5 text-brand-red font-black text-[10px] uppercase tracking-wider">
            <Layers className="h-4 w-4" />
            Alur Kerja Sistem Agregasi
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy leading-tight">
            Dari potensi panen desa mandiri hingga pemenuhan pangan industri nasional.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Menghilangkan perantara panjang dan menyatukan koordinasi logistik. Petani mendapatkan kepastian harga jual, industri mendapatkan konsistensi pasokan berkualitas.
          </p>
          <div className="space-y-4 pt-2">
            {workflow.map((item) => (
              <div key={item.step} className="flex gap-4 items-start bg-white border border-slate-100 p-4 rounded-xl shadow-3xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-xs font-black text-white shadow-2xs">
                  {item.step}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs text-slate-900">{item.title}</h4>
                  <p className="text-[11px] leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules Cards Grid */}
        <div className="space-y-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Jelajahi Modul Command Center</span>
          <div className="grid gap-4 sm:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card 
                  key={module.title} 
                  className={`bg-white border rounded-xl shadow-3xs transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${module.color}`}
                  onClick={() => router.push(module.href)}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-5">
                    <div className="space-y-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cream text-brand-navy border border-brand-navy/5 shadow-3xs">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-black text-slate-900">{module.title}</h3>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          {module.desc}
                        </p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-black text-brand-red hover:underline">
                      Buka Modul <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-3xs md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Sistem Terintegrasi & Siap Didemokan
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              Semua koperasi, buyer, stok, skor performa, dan analitik logistik terintegrasi dengan database Cloud Firestore dan didukung asisten pintar Gemini AI.
            </p>
          </div>
          <Link href="/peta" className="w-full md:w-auto">
            <Button className="w-full gap-2 md:w-auto bg-brand-navy hover:bg-brand-navy/90 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-sm cursor-pointer">
              Mulai Analisis Sekarang <Compass className="h-4 w-4 text-brand-cream" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}

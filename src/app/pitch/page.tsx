'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft, ArrowRight, Compass, Warehouse, WifiOff, Coins,
  Network, Database, Mic, Award, TrendingUp, Users, Truck,
  CheckCircle2, AlertTriangle, Activity, Building2, Route, ShoppingCart
} from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  content: React.ReactNode;
}

export default function PitchPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 0,
      title: "Hambatan Rantai Pasok Pangan Desa",
      subtitle: "Mengapa sistem distribusi dan logistik koperasi rakyat di pedesaan sering terhambat?",
      category: "1. MASALAH UTAMA",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center h-full text-xs">
          
          {/* Pitch Text Panel */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-black text-slate-800 leading-tight">
              Kendala Nyata di Lapangan
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Sebagian besar koperasi rakyat di pedesaan masih berjalan secara manual, terisolasi secara ekonomi, dan rentan terhadap hambatan infrastruktur lokal.
            </p>
            <div className="bg-red-50 border border-red-150 rounded-xl p-3 text-[11px] text-red-800 font-semibold leading-relaxed">
              ⚠️ <strong>Dampak Riil:</strong> Pencatatan kasir berantakan, data stok terfragmentasi, dan kegagalan serapan kontrak industri hingga 92%.
            </div>
          </div>

          {/* Cards Panel */}
          <div className="md:col-span-3 space-y-3">
            
            {/* Card 1: No Cashier System */}
            <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-shadow">
              <div className="p-2 rounded-lg bg-red-50 text-brand-red shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">1. Belum Ada Sistem Kasir & POS</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Pencatatan jual beli masih menggunakan rekap kertas manual. Rawan kesalahan hitung harga beli petani, pembukuan kasir berantakan, dan tidak terpantau secara berkala.
                </p>
              </div>
            </div>

            {/* Card 2: No Supply Chain Link */}
            <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-shadow">
              <div className="p-2 rounded-lg bg-red-50 text-brand-red shrink-0">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">2. Belum Ada Sistem Rantai Pasok (Supply Chain)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Koperasi berjalan terisolasi tanpa integrasi logistik wilayah. Sulit mengetahui permintaan pasar industri sehingga pasokan terfragmentasi dan sering kelebihan/kekurangan stok.
                </p>
              </div>
            </div>

            {/* Card 3: Offline Signal */}
            <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-shadow">
              <div className="p-2 rounded-lg bg-red-50 text-brand-red shrink-0">
                <WifiOff className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">3. Kelemahan Konektivitas & Sinyal</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Gudang pedalaman sering mengalami mati listrik dan gangguan sinyal. Aplikasi digital biasa tidak dapat berfungsi, menyebabkan data transaksi hilang saat terputus dari internet.
                </p>
              </div>
            </div>

          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Solusi ARUNA: Hilirisasi Digital Koperasi",
      subtitle: "Menjawab kendala pedesaan dengan teknologi agregasi cerdas dan arsitektur tangguh.",
      category: "2. SOLUSI EKOSISTEM",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center h-full text-xs">
          
          {/* Solution Graphic */}
          <div className="p-5 bg-brand-navy text-white rounded-2xl flex flex-col justify-center space-y-4 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/20 rounded-full blur-2xl" />
            <h4 className="font-black text-brand-orange text-[10px] uppercase tracking-wider">Paradigma Baru</h4>
            <div className="text-base font-bold leading-snug">
              "Mengubah persaingan menjadi gotong royong kolektif."
            </div>
            <p className="text-[11px] text-slate-350 leading-relaxed">
              ARUNA menyatukan kapasitas produksi koperasi desa kecil melalui satu pintu digital untuk memenuhi order industri raksasa tanpa takut hambatan koneksi internet.
            </p>
          </div>

          {/* Pillars List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Pillar 1 */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange mb-2">
                <Network className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">Agregasi Gotong Royong</h5>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                Mesin otomatis menggabungkan stok koperasi terdekat untuk penuhi kuota pembeli.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-100/60 flex items-center justify-center text-emerald-600 mb-2">
                <Database className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">Aplikasi Offline-First</h5>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                Pencatatan kasir & stok tetap lancar saat offline, otomatis sinkronisasi setelah online.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">AI Voice Assistant</h5>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                Pencatatan logistik semudah berbicara menggunakan Bahasa Indonesia biasa.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
                <Award className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-bold text-slate-900 text-xs">ARUNA Score Card</h5>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                Sertifikasi kualitas & keandalan suplai otomatis sebagai syarat kontrak offtaker.
              </p>
            </div>

          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Alur Demo Happy Flow (Ujung-ke-Ujung)",
      subtitle: "Bagaimana sistem bekerja mengalirkan data transaksi logistik secara utuh.",
      category: "3. ALUR DEMO",
      content: (
        <div className="flex flex-col justify-center h-full pr-1">
          
          {/* Stepper Stepper Horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            
            {/* Step 1 */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between relative z-10">
              <div>
                <div className="h-6 w-6 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center mb-2">
                  1
                </div>
                <h5 className="font-bold text-slate-900 text-[11px] mb-1">Daftar & Petakan</h5>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Admin mendaftarkan koperasi dan koordinat GPS gudang di peta potensi nasional.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between relative z-10">
              <div>
                <div className="h-6 w-6 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center mb-2">
                  2
                </div>
                <h5 className="font-bold text-slate-900 text-[11px] mb-1">Input Suara Offline</h5>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Ketua Koperasi input stok jagung lewat asisten suara saat sinyal offline di gudang.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between relative z-10">
              <div>
                <div className="h-6 w-6 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center mb-2">
                  3
                </div>
                <h5 className="font-bold text-slate-900 text-[11px] mb-1">Auto-Sinkronisasi</h5>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Saat internet terhubung kembali, cache data lokal diunggah otomatis ke cloud server.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between relative z-10">
              <div>
                <div className="h-6 w-6 rounded-full bg-brand-navy text-white text-[11px] font-bold flex items-center justify-center mb-2">
                  4
                </div>
                <h5 className="font-bold text-slate-900 text-[11px] mb-1">Order Industri</h5>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Pembeli (Buyer) memposting kebutuhan 50 Ton Jagung di Pasar Digital ARUNA.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between relative z-10">
              <div>
                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center mb-2">
                  5
                </div>
                <h5 className="font-bold text-slate-900 text-[11px] mb-1">Match Gotong Royong</h5>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Sistem otomatis membagi order 50 Ton tersebut ke 3 koperasi terdekat.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            <span>Alur terintegrasi ini menjamin logistik lancar, aman dari putusnya koneksi internet, dan meminimalkan drop-off transaksi.</span>
          </div>

        </div>
      )
    },
    {
      id: 3,
      title: "Dampak Riil dan Metrik Keberhasilan",
      subtitle: "Bagaimana ARUNA memberikan dampak konkret secara ekonomi dan sosial.",
      category: "4. DAMPAK NYATA",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs h-full items-center">
          
          {/* Metric 1 */}
          <Card className="border-slate-200/80 bg-white hover:shadow-md transition-shadow text-center p-5">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight block">+40%</span>
            <h5 className="font-bold text-slate-800 text-xs mt-1">Pendapatan Petani</h5>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">
              Melalui jalur distribusi langsung, memangkas keuntungan tidak adil tengkulak lokal.
            </p>
          </Card>

          {/* Metric 2 */}
          <Card className="border-slate-200/80 bg-white hover:shadow-md transition-shadow text-center p-5">
            <div className="h-10 w-10 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight block">100%</span>
            <h5 className="font-bold text-slate-800 text-xs mt-1">Pemenuhan SLA</h5>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">
              Order skala besar dari industri terpenuhi secara berkelanjutan lewat agregasi bersama.
            </p>
          </Card>

          {/* Metric 3 */}
          <Card className="border-slate-200/80 bg-white hover:shadow-md transition-shadow text-center p-5">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight block">-25%</span>
            <h5 className="font-bold text-slate-800 text-xs mt-1">Biaya Logistik</h5>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">
              Hemat biaya kirim dengan koordinasi logistik wilayah dan pemetaan rute armada terdekat.
            </p>
          </Card>

          {/* Metric 4 */}
          <Card className="border-slate-200/80 bg-white hover:shadow-md transition-shadow text-center p-5">
            <div className="h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center mx-auto mb-3">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tight block">0%</span>
            <h5 className="font-bold text-slate-800 text-xs mt-1">Drop Sinyal</h5>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">
              Tidak ada data hilang saat offline berkat database lokal yang tangguh di pedalaman.
            </p>
          </Card>

        </div>
      )
    },
    {
      id: 4,
      title: "Keberlanjutan Bisnis & Skalabilitas",
      subtitle: "Model pendapatan yang adil, kemitraan strategis, dan roadmap ekspansi.",
      category: "5. MODEL BISNIS",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center h-full text-xs">
          
          {/* Revenue Model */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <Coins className="h-4.5 w-4.5 text-brand-orange" /> Struktur Pendapatan & Modal
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <span className="h-5 w-5 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">A</span>
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">1.5% Admin Platform Fee</h5>
                  <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">
                    Komisi administrasi ringan yang ditarik dari setiap pemenuhan pesanan gotong royong yang berhasil di-deliver.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <span className="h-5 w-5 rounded-full bg-brand-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">B</span>
                <div>
                  <h5 className="font-bold text-slate-800 text-xs">Kemitraan Modal LPDB-KUMKM</h5>
                  <p className="text-[10px] text-slate-550 leading-relaxed mt-0.5">
                    Menyalurkan modal kerja logistik bergulir dari lembaga pembiayaan pemerintah bagi koperasi berkinerja tinggi (ARUNA Score Grade A & B).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
              <Route className="h-4.5 w-4.5 text-brand-red" /> Rencana Kerja Strategis
            </h4>
            
            <div className="border-l-2 border-brand-orange pl-4 ml-2.5 space-y-3.5 relative">
              
              {/* Point 1 */}
              <div className="relative">
                <div className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full bg-brand-orange border-2 border-white" />
                <h5 className="font-bold text-slate-900 text-xs">Q3 2026: Sistem Dasar & AI</h5>
                <p className="text-[10px] text-slate-500 leading-snug">Peluncuran POS Offline, AI Voice Command, ARUNA Score Card.</p>
              </div>

              {/* Point 2 */}
              <div className="relative">
                <div className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full bg-brand-orange border-2 border-white" />
                <h5 className="font-bold text-slate-900 text-xs">2027: Integrasi Logistik Wilayah</h5>
                <p className="text-[10px] text-slate-500 leading-snug">Menghubungkan koperasi dengan armada logistik regional bersama.</p>
              </div>

              {/* Point 3 */}
              <div className="relative">
                <div className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full bg-brand-orange border-2 border-white" />
                <h5 className="font-bold text-slate-900 text-xs">2028: Akses Pasar Ekspor</h5>
                <p className="text-[10px] text-slate-500 leading-snug">Membuka ekspor hasil panen koperasi desa secara kolektif.</p>
              </div>

            </div>
          </div>

        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (activeSlide < slides.length - 1) setActiveSlide(activeSlide + 1);
  };

  const prevSlide = () => {
    if (activeSlide > 0) setActiveSlide(activeSlide - 1);
  };

  // Keyboard navigation control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSlide, slides.length]);

  return (
    <div className="flex-1 py-10 bg-slate-55">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-brand-navy flex items-center gap-2">
              <Compass className="h-8 w-8 text-brand-red animate-spin-slow" />
              Pitch Deck ARUNA
            </h1>
            <p className="text-sm text-slate-550">Sistem Operasi Koperasi Masa Depan &mdash; Pitching Ringkas 3-5 Menit</p>
          </div>

          {/* Quick Tab Selectors */}
          <div className="flex flex-wrap gap-1">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(idx)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeSlide === idx
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                  }`}
              >
                {s.category.split('.')[1]?.trim() || s.category}
              </button>
            ))}
          </div>
        </div>

        {/* Slide Frame (Card) */}
        <Card className="border-slate-200 shadow-xl overflow-hidden flex flex-col bg-white w-full max-w-4xl mx-auto">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 select-none">
            <span className="text-xs bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full font-extrabold tracking-wider uppercase">
              {slides[activeSlide].category}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Slide {activeSlide + 1} dari {slides.length}
            </span>
          </div>

          <CardHeader className="pb-2 px-6 md:px-8 pt-6">
            <CardTitle className="text-2xl font-black text-slate-900">
              {slides[activeSlide].title}
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm font-semibold mt-1">
              {slides[activeSlide].subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-6 md:p-8">
            <div className="h-[280px] overflow-y-auto pr-1">
              {slides[activeSlide].content}
            </div>
          </CardContent>

          <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 select-none">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={activeSlide === 0}
              className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Sebelumnya
            </Button>

            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-6 bg-brand-red' : 'w-2 bg-slate-300'
                    }`}
                />
              ))}
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={nextSlide}
              disabled={activeSlide === slides.length - 1}
              className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-bold cursor-pointer"
            >
              Selanjutnya <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Footnote */}
        <p className="text-center text-xs text-slate-400 mt-6 italic">
          Gunakan tombol &ldquo;Sebelumnya&rdquo; dan &ldquo;Selanjutnya&rdquo; atau tombol keyboard (Panah Kiri / Kanan) untuk menavigasi slide.
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft, ArrowRight, Compass, Warehouse, WifiOff, Coins,
  Network, Database, Mic, Award, TrendingUp, Users, Truck,
  CheckCircle2, Activity, Building2, Route, ShoppingCart, Sparkles, Bot
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
  const [demoTab, setDemoTab] = useState(0);

  const slides: Slide[] = [
    {
      id: 0,
      title: "Hambatan Rantai Pasok Pangan Desa",
      subtitle: "Kendala riil yang memicu inefisiensi logistik dan kegagalan transaksi di tingkat desa.",
      category: "1. MASALAH UTAMA",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center h-full text-xs">
          
          {/* Pitch Text Panel */}
          <div className="md:col-span-2 space-y-2.5">
            <h3 className="text-base font-semibold text-slate-800 leading-tight">
              Tiga Hambatan Lapangan
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Koperasi rakyat pedesaan masih terisolasi secara digital dan logistik, mengakibatkan ketidakpastian serapan hasil panen.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-[10px] text-red-800 font-semibold leading-relaxed">
              ⚠️ <strong>Dampak Operasional:</strong> Kegagalan serapan kontrak industri skala besar karena kapasitas pengiriman terfragmentasi tanpa adanya sistem terintegrasi.
            </div>
          </div>

          {/* Cards Panel */}
          <div className="md:col-span-3 space-y-2">
            
            {/* Card 1: No Cashier & Stock Opname */}
            <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="p-1.5 rounded-lg bg-red-50 text-brand-red shrink-0 flex flex-col items-center justify-center w-14">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-[8px] font-semibold text-brand-red mt-0.5">Manual POS</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[11px] text-slate-900 leading-none">Belum Ada Sistem Kasir & Stok Opname</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Pencatatan transaksi harian dan rekap persediaan fisik (<em>stok opname</em>) saat ini masih dilakukan secara manual menggunakan kertas rekap.
                </p>
              </div>
            </div>

            {/* Card 2: No Marketplace */}
            <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="p-1.5 rounded-lg bg-red-50 text-brand-red shrink-0 flex flex-col items-center justify-center w-14">
                <Network className="h-4 w-4" />
                <span className="text-[8px] font-semibold text-brand-red mt-0.5">No Market</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[11px] text-slate-900 leading-none">Belum Ada Marketplace untuk Umum</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Koperasi belum memiliki etalase digital. Akibatnya, <em>customer</em> umum tidak dapat mengakses produk, melihat katalog, atau bertransaksi langsung.
                </p>
              </div>
            </div>

            {/* Card 3: No Hotspot */}
            <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="p-1.5 rounded-lg bg-red-50 text-brand-red shrink-0 flex flex-col items-center justify-center w-14">
                <WifiOff className="h-4 w-4" />
                <span className="text-[8px] font-semibold text-brand-red mt-0.5">Data Seluler</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[11px] text-slate-900 leading-none">Tidak Ada Hotspot & Bergantung Koneksi Pribadi</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Koperasi belum memiliki infrastruktur WiFi/Hotspot. Pengurus harus menggunakan paket data seluler pribadi yang sering tidak stabil untuk operasional.
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
      subtitle: "Menjawab langsung 3 hambatan utama dengan teknologi agregasi dan arsitektur tangguh.",
      category: "2. SOLUSI EKOSISTEM",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center h-full text-xs">
          
          {/* Solution Text Panel */}
          <div className="md:col-span-2 space-y-2.5">
            <h3 className="text-base font-semibold text-slate-800 leading-tight">
              Sistem Operasi Terpadu
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Teknologi terpadu yang memodernisasi tata kelola administrasi, pencatatan persediaan, dan akses pasar langsung dari desa.
            </p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-[10px] text-emerald-800 font-semibold leading-relaxed">
              ✅ <strong>Kemudahan Operasional:</strong> Menggantikan proses manual kertas dengan pencatatan digital terotomasi tanpa bergantung penuh pada hotspot internet.
            </div>
          </div>

          {/* Pillars List */}
          <div className="md:col-span-3 space-y-2">
            
            {/* Pillar 1: Kasir & Stok Opname */}
            <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-shadow">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 flex flex-col items-center justify-center w-14">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-[8px] font-semibold text-emerald-600 mt-0.5">Solusi POS</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[11px] text-slate-900 leading-none">Kasir & Stok Opname Digital</h4>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-semibold uppercase tracking-wider scale-90">Masalah 1</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Pencatatan transaksi kasir real-time dan rekap opname persediaan otomatis, menghilangkan pembukuan kertas manual.
                </p>
              </div>
            </div>

            {/* Pillar 2: Open Marketplace */}
            <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-shadow">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 flex flex-col items-center justify-center w-14">
                <Network className="h-4 w-4" />
                <span className="text-[8px] font-semibold text-emerald-600 mt-0.5">Solusi Pasar</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[11px] text-slate-900 leading-none">Pasar & Etalase Digital Terbuka</h4>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-semibold uppercase tracking-wider scale-90">Masalah 2</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Menyediakan portal marketplace agar customer umum dapat menelusuri katalog produk dan berbelanja langsung secara online.
                </p>
              </div>
            </div>

            {/* Pillar 3: Offline-First */}
            <div className="flex items-start gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-shadow">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 flex flex-col items-center justify-center w-14">
                <Database className="h-4 w-4" />
                <span className="text-[8px] font-semibold text-emerald-600 mt-0.5">Offline POS</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[11px] text-slate-900 leading-none">Arsitektur Offline-First & Auto-Sync</h4>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-semibold uppercase tracking-wider scale-90">Masalah 3</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Sistem tetap berjalan lancar saat internet mati. Data tersinkronisasi otomatis saat pengurus mendapat jaringan seluler.
                </p>
              </div>
            </div>

          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Alur Kerja: Kasir & Stok Opname",
      subtitle: "Bagaimana transaksi harian terotomasi menjadi data stok yang valid.",
      category: "3. ALUR KASIR & STOK",
      content: (
        <div className="flex flex-col justify-between h-full pr-1">
          {/* AI Role Iconography */}
          <div className="flex items-center gap-1.5 self-start mb-2 px-2.5 py-1 bg-brand-navy/5 rounded-lg border border-brand-navy/10 select-none">
            <Bot className="h-4 w-4 text-brand-navy" />
            <span className="text-[10px] font-semibold text-brand-navy uppercase tracking-wider">AI Voice POS:</span>
            <Sparkles className="h-3.5 w-3.5 text-brand-orange animate-pulse" />
            <Mic className="h-3.5 w-3.5 text-slate-650" />
          </div>

          {/* Flow Diagram */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
              {/* Step 1 */}
              <div className="md:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center mb-2">1</div>
                <h6 className="font-semibold text-slate-800 text-[11px] md:text-xs">Pencatatan POS</h6>
                <p className="text-[10px] md:text-[10.5px] text-slate-500 mt-1 leading-snug">Pengurus menginput data transaksi harian anggota.</p>
              </div>
              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-400 py-1 animate-pulse">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
              </div>
              {/* Step 2 */}
              <div className="md:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center mb-2">2</div>
                <h6 className="font-semibold text-slate-800 text-[11px] md:text-xs">Automasi Stok</h6>
                <p className="text-[10px] md:text-[10.5px] text-slate-500 mt-1 leading-snug">Persediaan komoditas otomatis terpotong di sistem.</p>
              </div>
              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-400 py-1 animate-pulse">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
              </div>
              {/* Step 3 */}
              <div className="md:col-span-1 p-5 bg-emerald-55 border border-emerald-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center mb-2">3</div>
                <h6 className="font-semibold text-emerald-900 text-[11px] md:text-xs">Stok Opname Klop</h6>
                <p className="text-[10px] md:text-[10.5px] text-emerald-700 mt-1 leading-snug">Jumlah kasir dan persediaan terintegrasi otomatis secara klop.</p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-[10px] text-slate-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-ping shrink-0" />
            <span>Sistem POS mengeleminasi selisih stok persediaan antara kasir dan pencatatan fisik secara real-time.</span>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Alur Kerja: Marketplace Komoditas",
      subtitle: "Bagaimana produk koperasi dipasarkan dan diserap pembeli secara langsung.",
      category: "4. ALUR MARKETPLACE",
      content: (
        <div className="flex flex-col justify-between h-full pr-1">
          {/* AI Role Iconography */}
          <div className="flex items-center gap-1.5 self-start mb-2 px-2.5 py-1 bg-brand-navy/5 rounded-lg border border-brand-navy/10 select-none">
            <Bot className="h-4 w-4 text-brand-navy" />
            <span className="text-[10px] font-semibold text-brand-navy uppercase tracking-wider">AI Matchmaking:</span>
            <Sparkles className="h-3.5 w-3.5 text-brand-orange animate-pulse" />
            <Users className="h-3.5 w-3.5 text-slate-650" />
          </div>

          {/* Flow Diagram */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
              {/* Step 1 */}
              <div className="md:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center mb-2">1</div>
                <h6 className="font-semibold text-slate-800 text-[11px] md:text-xs">Upload Etalase</h6>
                <p className="text-[10px] md:text-[10.5px] text-slate-500 mt-1 leading-snug">Stok komoditas koperasi muncul di katalog digital.</p>
              </div>
              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-400 py-1 animate-pulse">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
              </div>
              {/* Step 2 */}
              <div className="md:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center mb-2">2</div>
                <h6 className="font-semibold text-slate-800 text-[11px] md:text-xs">Checkout Customer</h6>
                <p className="text-[10px] md:text-[10.5px] text-slate-500 mt-1 leading-snug">Customer umum memesan komoditas secara online.</p>
              </div>
              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-400 py-1 animate-pulse">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
              </div>
              {/* Step 3 */}
              <div className="md:col-span-1 p-5 bg-emerald-55 border border-emerald-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center mb-2">3</div>
                <h6 className="font-semibold text-emerald-900 text-[11px] md:text-xs">Kirim Langsung</h6>
                <p className="text-[10px] md:text-[10.5px] text-emerald-700 mt-1 leading-snug">Koperasi memproses pengiriman ke alamat tujuan.</p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-[10px] text-slate-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-ping shrink-0" />
            <span>Marketplace membuka jangkauan pasar koperasi langsung ke pembeli umum secara online tanpa perantara.</span>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Alur Kerja: Koneksi Offline-First",
      subtitle: "Bagaimana sistem menjaga transaksi tetap aman saat kehilangan jaringan internet.",
      category: "5. ALUR OFFLINE POS",
      content: (
        <div className="flex flex-col justify-between h-full pr-1">
          {/* AI Role Iconography */}
          <div className="flex items-center gap-1.5 self-start mb-2 px-2.5 py-1 bg-brand-navy/5 rounded-lg border border-brand-navy/10 select-none">
            <Bot className="h-4 w-4 text-brand-navy" />
            <span className="text-[10px] font-semibold text-brand-navy uppercase tracking-wider">Offline NLP Parser:</span>
            <Sparkles className="h-3.5 w-3.5 text-brand-orange animate-pulse" />
            <Database className="h-3.5 w-3.5 text-slate-650" />
          </div>

          {/* Flow Diagram */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
              {/* Step 1 */}
              <div className="md:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center mb-2">1</div>
                <h6 className="font-semibold text-slate-800 text-[11px] md:text-xs">Input Offline</h6>
                <p className="text-[10px] md:text-[10.5px] text-slate-500 mt-1 leading-snug">Pengurus tetap menginput data tanpa sinyal/hotspot.</p>
              </div>
              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-400 py-1 animate-pulse">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
              </div>
              {/* Step 2 */}
              <div className="md:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center mb-2">2</div>
                <h6 className="font-semibold text-slate-800 text-[11px] md:text-xs">Penyimpanan Cache</h6>
                <p className="text-[10px] md:text-[10.5px] text-slate-500 mt-1 leading-snug">Data diamankan sementara pada penyimpanan lokal.</p>
              </div>
              {/* Arrow */}
              <div className="md:col-span-1 flex justify-center text-slate-400 py-1 animate-pulse">
                <ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" />
              </div>
              {/* Step 3 */}
              <div className="md:col-span-1 p-5 bg-emerald-55 border border-emerald-200 rounded-2xl text-center shadow-sm min-h-[150px] flex flex-col justify-center items-center">
                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center mb-2">3</div>
                <h6 className="font-semibold text-emerald-900 text-[11px] md:text-xs">Sinkronisasi Otomatis</h6>
                <p className="text-[10px] md:text-[10.5px] text-emerald-700 mt-1 leading-snug">Data otomatis terunggah saat terhubung koneksi seluler.</p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-[10px] text-slate-700 font-medium">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-ping shrink-0" />
            <span>Mengamankan data dari kegagalan transaksi akibat hilangnya konektivitas internet atau ketiadaan hotspot.</span>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Dampak Konkret Berbasis Data Riil",
      subtitle: "Pencapaian nyata platform yang dihitung langsung dari kapasitas ekosistem terdaftar.",
      category: "6. DAMPAK NYATA",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs h-full items-stretch">
          
          {/* Metric 1: POS impact */}
          <Card className="border-slate-200 bg-white shadow-sm text-center p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span className="text-2xl font-semibold text-slate-950 tracking-tight block">SIMKOPDES</span>
              <h5 className="font-semibold text-slate-800 text-xs mt-2">Kasir & Stok Terintegrasi</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Seluruh transaksi harian anggota diintegrasikan langsung dengan basis data nasional di <a href="https://simkopdes.go.id/pers/dashboard" target="_blank" rel="noopener noreferrer" className="text-brand-navy underline font-semibold">simkopdes.go.id</a> secara real-time.
            </p>
          </Card>

          {/* Metric 2: Marketplace impact */}
          <Card className="border-slate-200 bg-white shadow-sm text-center p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center mx-auto mb-3">
                <Network className="h-5 w-5" />
              </div>
              <span className="text-3xl font-semibold text-slate-950 tracking-tight block">83.382 Koperasi</span>
              <h5 className="font-semibold text-slate-800 text-xs mt-2">Ekosistem Terhubung</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Menghubungkan 83.382 Koperasi Desa menjadi satu kesatuan ekosistem yang terintegrasi di pasar digital terbuka untuk customer umum maupun offtaker industrial.
            </p>
          </Card>

          {/* Metric 3: Offline impact */}
          <Card className="border-slate-200 bg-white shadow-sm text-center p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <WifiOff className="h-5 w-5" />
              </div>
              <span className="text-3xl font-semibold text-slate-950 tracking-tight block">0% Data Hilang</span>
              <h5 className="font-semibold text-slate-800 text-xs mt-2">Aman Tanpa Hotspot</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Arsitektur offline-first mengamankan seluruh rekap transaksi lokal tanpa bergantung pada kestabilan internet koperasi.
            </p>
          </Card>

        </div>
      )
    },
    {
      id: 6,
      title: "Model Bisnis: B2B & B2B2C Hybrid Platform",
      subtitle: "Bagaimana platform menghubungkan KDKMP dengan berbagai tingkatan pembeli secara efisien.",
      category: "7. MODEL BISNIS",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch h-full text-xs">
          {/* B2B2C */}
          <Card className="border-slate-200 bg-white shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">Sektor B2B2C (Masyarakat Umum)</h4>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-600 leading-relaxed">
                KDKMP <em>(Business)</em> memasarkan komoditas unggulan secara langsung ke <em>Customer Umum (Consumer)</em> melalui katalog digital di pasar terbuka. Transaksi berjalan secara mandiri dan transparan.
              </p>
            </div>
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-mono">
              Volume eceran ➔ Margin laba lebih tinggi langsung ke koperasi.
            </div>
          </Card>

          {/* B2B */}
          <Card className="border-slate-200 bg-white shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">Sektor B2B (Offtaker Industrial)</h4>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-600 leading-relaxed">
                Agregasi kolektif komoditas dari berbagai KDKMP <em>(Business)</em> dipasok langsung kepada <em>Pembeli Industri/Offtaker (Business)</em> untuk memenuhi kebutuhan manufaktur skala besar secara kontinu.
              </p>
            </div>
            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-mono">
              Volume grosir ➔ Kontrak serapan jangka panjang yang stabil.
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 7,
      title: "Keberlanjutan & Aliran Pendapatan",
      subtitle: "Aliran pendapatan platform untuk pemeliharaan infrastruktur dan pengembangan fitur jangka panjang.",
      category: "8. REVENUE STREAM",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-stretch h-full">
          
          {/* Revenue Stream 1 */}
          <Card className="border-slate-200 bg-white shadow-sm text-center p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Coins className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-semibold text-slate-800 text-xs">1,5% Platform Fee</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Biaya layanan ditarik secara transparan dari setiap transaksi sukses di marketplace (B2B & B2B2C) untuk menjaga operasional.
            </p>
          </Card>

          {/* Revenue Stream 2 */}
          <Card className="border-slate-200 bg-white shadow-sm text-center p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-2">
                <Network className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-semibold text-slate-800 text-xs">SaaS Dashboard Analytics</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Akses premium berbayar untuk pembeli skala besar untuk melihat proyeksi volume panen & peta sebaran komoditas.
            </p>
          </Card>

          {/* Revenue Stream 3 */}
          <Card className="border-slate-200 bg-white shadow-sm text-center p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[200px]">
            <div className="flex flex-col items-center">
              <div className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <h5 className="font-semibold text-slate-800 text-xs">Lisensi AI Voice POS API</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Komersialisasi asisten suara offline-first untuk digitalisasi pembukuan UMKM & BUMDes pedesaan non-koperasi.
            </p>
          </Card>

        </div>
      )
    },
    {
      id: 8,
      title: "Roadmap Skalabilitas Jangka Panjang",
      subtitle: "Rencana ekspansi bertahap pasca-hackathon dari tingkat wilayah hingga nasional.",
      category: "9. FUTURE ROADMAP",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-stretch h-full">
          
          {/* Phase 1 */}
          <Card className="border-slate-200 bg-slate-50 p-4 flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <span className="bg-brand-orange text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-2 animate-pulse">
                1 Bulan
              </span>
              <h5 className="font-semibold text-slate-900 text-xs">POS & AI Voice Stability</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Beta-testing POS offline-first & input asisten suara AI di 5 KDKMP percontohan Bangka secara terkendali.
            </p>
          </Card>

          {/* Phase 2 */}
          <Card className="border-slate-200 bg-slate-50 p-4 flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <span className="bg-brand-orange text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-2">
                3 Bulan
              </span>
              <h5 className="font-semibold text-slate-900 text-xs">Marketplace Launch</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Uji coba transaksi katalog digital bagi 20 KDKMP percontohan & pembukaan akses untuk 7 offtaker lokal.
            </p>
          </Card>

          {/* Phase 3 */}
          <Card className="border-slate-200 bg-slate-50 p-4 flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <span className="bg-brand-orange text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-2">
                6 Bulan
              </span>
              <h5 className="font-semibold text-slate-900 text-xs">SIMKOPDES & LPDB</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Sinkronisasi data real-time dengan simkopdes.go.id & penyaluran fasilitas modal kerja logistik LPDB-KUMKM.
            </p>
          </Card>

          {/* Phase 4 */}
          <Card className="border-slate-200 bg-slate-50 p-4 flex flex-col justify-between h-full min-h-[180px]">
            <div>
              <span className="bg-brand-orange text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider block w-max mb-2">
                1 Tahun
              </span>
              <h5 className="font-semibold text-slate-900 text-xs">Skala Nasional</h5>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">
              Ekspansi bertahap menyerap 83.382 Koperasi Desa menjadi satu ekosistem nasional terpadu.
            </p>
          </Card>

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
    <div className="flex-1 py-10 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-brand-navy flex items-center gap-2">
              <Compass className="h-8 w-8 text-brand-red animate-spin-slow" />
              Pitch Deck ARUNA
            </h1>
            <p className="text-sm text-slate-500">Sistem Operasi Koperasi Masa Depan &mdash; Pitching Ringkas 3-5 Menit</p>
          </div>

          {/* Quick Tab Selectors */}
          <div className="flex flex-wrap gap-1">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(idx)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${activeSlide === idx
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'bg-white text-slate-650 border border-slate-200/80 hover:bg-slate-100'
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
            <span className="text-xs bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full font-semibold tracking-wider uppercase">
              {slides[activeSlide].category}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Slide {activeSlide + 1} dari {slides.length}
            </span>
          </div>

          <CardHeader className="pb-2 px-6 md:px-8 pt-6">
            <CardTitle className="text-2xl font-semibold text-slate-900">
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
              className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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
              className="flex items-center gap-1.5 bg-brand-navy hover:bg-brand-navy/90 text-white text-xs font-semibold cursor-pointer"
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

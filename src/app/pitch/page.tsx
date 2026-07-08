'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft, ArrowRight, ShieldAlert, Cpu,
  TrendingUp, Award, Users, Target, Briefcase, Scale,
  AlertTriangle, LineChart, Compass, HelpCircle, Activity,
  FileText, Layers, CheckCircle2, ChevronRight, Landmark, Clock, Coins, CheckSquare, Warehouse, HelpCircle as HelpIcon, Settings, Route, Box
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
      title: "Kanvas Kerangka Kerja Who-What-How Much",
      subtitle: "Mendiagnosis krisis rantai pasok pangan dan perkebunan koperasi desa di Indonesia.",
      category: "1. LATAR BELAKANG & KRISIS",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs h-full pr-1">
          {/* 1. WHO */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 border-b pb-2 mb-3">
                <span className="h-5 w-5 bg-brand-navy text-white rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
                <h4 className="font-black text-brand-navy uppercase text-[10px] tracking-wider">WHO: Siapa Penerima Manfaat?</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Peran / Jabatan</span>
                  <span className="font-bold text-slate-800">Pengurus Koperasi Desa & Anggota Unit Usaha</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Institusi / Industri</span>
                  <span className="font-bold text-slate-800">Koperasi Rakyat Pedesaan & Offtaker Industri Pangan</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Skala (Jumlah)</span>
                  <span className="font-bold text-slate-800">92% Koperasi Desa Mandiri (15.000+ Anggota Koperasi)</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Segmen Sekunder</span>
                  <span className="font-bold text-slate-850">Pengemudi Logistik Lokal & Mitra Ekosistem Distribusi</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 font-semibold text-center bg-white/50 rounded-lg p-1.5 border-slate-100">
              Siapa penerima manfaat langsungnya?
            </div>
          </div>

          {/* 2. WHAT */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 border-b pb-2 mb-3">
                <span className="h-5 w-5 bg-brand-navy text-white rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
                <h4 className="font-black text-brand-navy uppercase text-[10px] tracking-wider">WHAT: Nilai Apa Yang Diciptakan?</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] text-brand-red font-bold block uppercase tracking-wider mb-1">Problem Yang Dipecahkan</span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Koperasi tidak bisa penuhi kuota minimum industri (offtaker) sendirian dan buta data sebaran panen lokal karena kendala sinyal & administrasi manual.
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wider mb-1">Nilai Yang Diciptakan</span>
                  <p className="text-slate-650 font-semibold leading-relaxed">
                    Dashboard Mandiri, Kasir POS terintegrasi, AI Command bertenaga suara, kepastian serapan harga adil, & sertifikasi kesiapan via ARUNA Score.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 font-semibold text-center bg-white/50 rounded-lg p-1.5 border-slate-100">
              Manfaat konkret: hemat, kurangi biaya, naik income
            </div>
          </div>

          {/* 3. HOW MUCH */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 border-b pb-2 mb-3">
                <span className="h-5 w-5 bg-brand-navy text-white rounded-full flex items-center justify-center font-bold text-[10px]">3</span>
                <h4 className="font-black text-brand-navy uppercase text-[10px] tracking-wider">HOW MUCH: Seberapa Besar?</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tipe Manfaat Utama</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black">Hemat Biaya</span>
                    <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">Hemat Waktu</span>
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black">Tambahan Pendapatan</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Data Baseline (Sebelum)</span>
                  <p className="text-slate-500 font-medium">
                    14-30 hari nego manual, potongan harga 35-40% oleh tengkulak, & 92% kegagalan order skala besar.
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Dampak Setelah Solusi</span>
                  <p className="text-slate-650 font-bold">
                    Efisiensi waktu 25%, kenaikan harga jual anggota 40%, & potensi tambahan Rp 1.5 Milyar/tahun per sentra.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 font-semibold text-center bg-white/50 rounded-lg p-1.5 border-slate-100">
              Revenue Model: 1.5% admin platform fee
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Target Persona & Realitas Lapangan",
      subtitle: "Memahami hambatan nyata pengurus koperasi (Pak Joko) dan procurement industri (Bu Rina).",
      category: "2. EMPATI & REALITAS",
      content: (
        <div className="grid md:grid-cols-2 gap-6 h-full text-xs">
          {/* Persona Koperasi */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <span className="text-[9px] bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-bold w-fit uppercase">Pengurus Koperasi Desa</span>
              <CardTitle className="text-base font-black text-slate-900 mt-1">Pak Joko (52 th, Tangerang)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-slate-605 text-[11px] leading-relaxed">
              <p className="italic font-medium">"Kami punya komoditas bagus, tapi industri minta 100 Ton per minggu. Sinyal internet sering hilang di gudang semenjak mati listrik. Kami butuh pencatatan cepat (AI Command & Kasir POS) yang tetap bekerja saat sinyal mati."</p>
              <div className="border-t pt-2.5 space-y-1.5">
                <div><strong>Kebutuhan:</strong> Kepastian serapan hasil panen anggota dengan harga transparan.</div>
                <div><strong>Tantangan:</strong> Terkendala kapasitas logistik, fluktuasi stok, & buta informasi pasar industri.</div>
              </div>
            </CardContent>
          </Card>

          {/* Persona Offtaker */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <span className="text-[9px] bg-brand-navy/10 text-brand-navy px-2 py-0.5 rounded-full font-bold w-fit uppercase">Procurement Manager Industri</span>
              <CardTitle className="text-base font-black text-slate-900 mt-1">Bu Rina (38 th, PT Sinar Pangan)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-slate-605 text-[11px] leading-relaxed">
              <p className="italic font-medium">"Kami butuh pasokan jagung 200 Ton konsisten setiap bulan. Kami butuh laporan performa penyerapan stok & analisis kelayakan gotong royong koperasi secara cepat (AI Insights)."</p>
              <div className="border-t pt-2.5 space-y-1.5">
                <div><strong>Kebutuhan:</strong> Bahan baku berkualitas standar, jaminan suplai kontinu, kontrak satu pintu.</div>
                <div><strong>Tantangan:</strong> Sulit memverifikasi kredibilitas koperasi secara manual & fluktuasi harga komoditas lokal.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 2,
      title: "Kanvas Proposisi Nilai (VPC)",
      subtitle: "Menyelaraskan profil masalah koperasi dengan solusi penawar dari ARUNA.",
      category: "3. JEMBATAN SOLUSI",
      content: (
        <div className="grid md:grid-cols-2 gap-6 h-full text-xs">
          {/* Customer Profile */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-wider border-b pb-1.5 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-brand-red" /> Customer Profile (Koperasi Desa)
            </h4>
            <div className="space-y-2">
              <div>
                <strong className="text-slate-700 block mb-0.5">1. Customer Jobs:</strong>
                <p className="text-slate-500">Mengembangkan usaha koperasi, menyejahterakan anggota koperasi, mengelola inventori produk desa.</p>
              </div>
              <div>
                <strong className="text-slate-700 block mb-0.5">2. Pains:</strong>
                <p className="text-slate-500">Harga ditekan tengkulak, ditolak industri besar karena kekurangan volume kirim, administrasi masih manual.</p>
              </div>
              <div>
                <strong className="text-slate-700 block mb-0.5">3. Gains:</strong>
                <p className="text-slate-500">Mendapatkan kontrak harga adil jangka panjang, peningkatan profit anggota, reputasi koperasi naik (Grade A).</p>
              </div>
            </div>
          </div>

          {/* Value Map */}
          <div className="bg-brand-navy/5 p-4 rounded-xl border border-brand-navy/15 space-y-3">
            <h4 className="font-black text-brand-navy uppercase text-[10px] tracking-wider border-b pb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> Value Map (Platform ARUNA)
            </h4>
            <div className="space-y-2">
              <div>
                <strong className="text-brand-navy block mb-0.5">1. Products & Services:</strong>
                <p className="text-slate-600">Portal Inventori & Kasir POS, AI Command (NLOS), AI Insights Analitik, Arsitektur Sinkronisasi Offline-First.</p>
              </div>
              <div>
                <strong className="text-brand-navy block mb-0.5">2. Pain Relievers:</strong>
                <p className="text-slate-600">Gotong Royong Matching Engine (menggabungkan stok beberapa koperasi desa terdekat untuk penuhi satu order besar) & Sync Queue saat offline.</p>
              </div>
              <div>
                <strong className="text-brand-navy block mb-0.5">3. Gain Creators:</strong>
                <p className="text-slate-600">Standardisasi kualitas otomatis lewat ARUNA Score Card, AI Insights prediktif untuk optimasi jadwal gotong royong logistik.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Kanvas Skenario Penggunaan ARUNA",
      subtitle: "Menentukan batasan fitur produk, teknologi, dan rencana awal pembuktian pasar.",
      category: "4. SPESIFIKASI MVP",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 text-[11px] h-full pr-1">
          {/* Column 1: Who */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mb-2">1. WHO (Target User)</span>
              <p className="font-bold text-slate-800 mb-1">Pengguna Utama:</p>
              <p className="text-slate-500 leading-relaxed">
                Ketua Koperasi Desa, Unit Usaha Koperasi, Anggota, & Procurement Manager Industri Besar (Offtaker).
              </p>
            </div>
            <div className="text-[9px] text-slate-400 border-t pt-1.5 mt-2 italic">Persona spesifik di lapangan</div>
          </div>

          {/* Column 2: Problem & Solusi */}
          <div className="lg:col-span-2 grid grid-rows-2 gap-3">
            {/* Top: Problem & Pain Points */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mb-2">2 & 4. Problem & Pain Points</span>
                <p className="text-slate-600 leading-relaxed mb-1">
                  <strong>Pernyataan Masalah:</strong> "Koperasi desa kesulitan penuhi kuota volume industri karena stok terfragmentasi dan jaringan internet tidak stabil."
                </p>
                <p className="text-slate-500">
                  <strong>Bukti/Validasi:</strong> 92% kegagalan transaksi, monopoli harga oleh tengkulak lokal.
                </p>
              </div>
            </div>

            {/* Bottom: Solusi */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mb-2">3. Solusi Yang Diusulkan</span>
                <p className="text-slate-650 leading-relaxed mb-1">
                  <strong>Agregasi Gotong Royong:</strong> Menyatukan stok terdekat secara proporsional didukung database offline-first.
                </p>
                <p className="text-slate-500">
                  <strong>Unique Value:</strong> Auto-matchmaking terdekat & AI Command suara. <br />
                  <strong>Differentiator:</strong> Score-based fair queuing & Offline-first Sync.
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Scope & Validasi */}
          <div className="grid grid-rows-2 gap-3">
            {/* Top: Validasi PMF */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] bg-amber-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mb-1">4. Validasi PMF</span>
                <div className="space-y-1 text-[10px]">
                  <div><strong>Metode:</strong> Uji Pilot Jagung 100T Banten.</div>
                  <div><strong>Metrik:</strong> SLA 100%, margin koperasi +40%.</div>
                  <div><strong>Timeline:</strong> 3 Bulan Uji Panen.</div>
                </div>
              </div>
            </div>

            {/* Bottom: Scope MVP */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit mb-1">5. Scope & Tech Stack</span>
                <div className="space-y-1 text-[10px] text-slate-500">
                  <div><strong>Masuk:</strong> POS Cashier, Stock Opname, AI Command, AI Insights (SWOT), Offline Sync (IndexedDB).</div>
                  <div><strong>Tech:</strong> Next.js + Firebase + AI Service.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Alur Demo Platform ARUNA",
      subtitle: "Langkah demi langkah aliran data dari input stok desa hingga penyerapan industri.",
      category: "5. SIMULASI PLATFORM",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs h-full pr-1">
          {/* Step 1 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase block w-fit mb-2">1. Trigger</span>
              <h5 className="font-bold text-slate-800 text-xs mb-1">Onboard & Geolocation</h5>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Admin/Fasilitator membantu mendaftarkan koperasi pedesaan dan menandai koordinat GPS wilayah di peta.
              </p>
            </div>
            <div className="mt-4 pt-1.5 border-t text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> Entry Point
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase block w-fit mb-2">2. Aksi Utama</span>
              <h5 className="font-bold text-slate-800 text-xs mb-1">Input Stok & Kasir POS</h5>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Ketua Koperasi masuk ke portal mandiri untuk melaporkan hasil panen jagung/kakao serta mencatat penjualan lewat Kasir POS (mendukung offline).
              </p>
            </div>
            <div className="mt-4 pt-1.5 border-t text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Box className="h-3.5 w-3.5" /> Portal Koperasi
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase block w-fit mb-2">3. Logika Sistem</span>
              <h5 className="font-bold text-slate-800 text-xs mb-1">Kontrol & Analisis AI</h5>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Sistem AI memproses perintah pengurus via teks/suara dan menyajikan analisis kelayakan otomatis untuk keputusan pembagian logistik.
              </p>
            </div>
            <div className="mt-4 pt-1.5 border-t text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 animate-pulse text-brand-orange" /> Engine Proses
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase block w-fit mb-2">4. Output</span>
              <h5 className="font-bold text-slate-800 text-xs mb-1">Visualisasi Rute Peta</h5>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Peta interaktif menghubungkan garis putus-putus rute armada pengiriman logistik dari desa langsung ke pabrik buyer.
              </p>
            </div>
            <div className="mt-4 pt-1.5 border-t text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Route className="h-3.5 w-3.5" /> Peta Interaktif
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[9px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase block w-fit mb-2">5. Impact</span>
              <h5 className="font-bold text-slate-800 text-xs mb-1">Sinkronisasi Offline & Manfaat</h5>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Armada sinkronisasi otomatis memindahkan data lokal ke cloud saat internet aktif, menjamin pemenuhan kuota 100% tepat waktu.
              </p>
            </div>
            <div className="mt-4 pt-1.5 border-t text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Hasil Akhir
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Solusi ARUNA: Konsolidasi Rantai Pasok",
      subtitle: "Membongkar pilar teknologi penunjang hilirisasi digital koperasi desa.",
      category: "6. TEKNOLOGI INTI",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full text-xs">
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Pilar Fungsional Platform</h3>
            <div className="grid gap-3">
              <div className="flex gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                <Cpu className="h-5 w-5 text-brand-orange mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-955">Kontrol & Analisis AI</h4>
                  <p className="text-[11px] text-slate-500">Menganalisis performa koperasi desa & mengeksekusi stok/kasir POS secara otomatis via suara/teks.</p>
                </div>
              </div>
              <div className="flex gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                <Award className="h-5 w-5 text-brand-red mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-955">Mesin Penilaian Koperasi (Score Card)</h4>
                  <p className="text-[11px] text-slate-500">Standardisasi keaktifan anggota, kesehatan keuangan, dan stabilitas pasokan sebagai syarat kontrak industri.</p>
                </div>
              </div>
              <div className="flex gap-2.5 p-3 bg-white rounded-xl border border-slate-200">
                <Clock className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-slate-955">Arsitektur Offline-First Sync</h4>
                  <p className="text-[11px] text-slate-500">Menyimpan data di IndexedDB lokal saat internet putus, dan menyinkronkan otomatis (delete cache) setelah online.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-brand-navy text-white rounded-2xl flex flex-col justify-center space-y-3 relative overflow-hidden h-full justify-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/20 rounded-full blur-xl" />
            <h4 className="font-black text-brand-orange text-xs uppercase tracking-wider">Paradigma Baru</h4>
            <div className="text-sm font-bold text-white italic leading-relaxed">
              &ldquo;Gotong Royong Matchmaker menggabungkan stok dari beberapa koperasi desa terdekat untuk memenuhi kebutuhan kuota industri secara kolektif.&rdquo;
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Buyer/offtaker cukup mengelola satu kontrak pesanan agregat. Koperasi desa terdekat bersama-sama berbagi kapasitas logistik untuk memenuhinya tanpa takut kendala sinyal internet di pedalaman.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Metriks Penting & Asumsi Kunci",
      subtitle: "Indikator keberhasilan (KPI) serta mitigasi hambatan operasional di lapangan.",
      category: "7. RISIKO & METRIKS",
      content: (
        <div className="grid md:grid-cols-2 gap-6 h-full text-xs">
          {/* Metriks Utama */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-wider border-b pb-1.5 flex items-center gap-1.5">
              <LineChart className="h-4 w-4 text-brand-navy" /> Metriks Utama (KPI)
            </h4>
            <div className="space-y-3">
              <div>
                <strong className="text-slate-700 block">North Star Metric:</strong>
                <span className="text-slate-500 font-medium">Total Volume Transaksi Gotong Royong (Ton Terdistribusi per Bulan).</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 bg-white rounded border">
                  <span className="text-[10px] text-slate-400 block font-bold">Rasio Kemitraan</span>
                  <span className="font-extrabold text-brand-navy text-[11px] block mt-0.5">Grade A/B Koperasi</span>
                </div>
                <div className="p-2 bg-white rounded border">
                  <span className="text-[10px] text-slate-400 block font-bold">Kepatuhan SLA</span>
                  <span className="font-extrabold text-brand-red text-[11px] block mt-0.5">99.2% Ketepatan Waktu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hambatan & Asumsi Kunci */}
          <div className="bg-red-50/50 p-4 rounded-xl border border-brand-red/10 space-y-3">
            <h4 className="font-black text-brand-red uppercase text-[10px] tracking-wider border-b pb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Hambatan & Asumsi Kunci
            </h4>
            <div className="space-y-2.5">
              <div>
                <strong className="text-slate-850 block">1. Hambatan Literasi Digital Desa:</strong>
                <p className="text-slate-500 leading-tight">Banyak pengurus koperasi desa kesulitan menggunakan aplikasi smartphone secara mandiri.</p>
                <span className="text-[10px] text-brand-navy font-bold block mt-0.5">Mitigasi: Kemudahan input lewat Kontrol AI bertenaga suara, mendemokratisasi akses teknologi untuk pengurus koperasi.</span>
              </div>
              <div>
                <strong className="text-slate-850 block">2. Standardisasi Kualitas Hasil Panen:</strong>
                <p className="text-slate-500 leading-tight">Koperasi Grade C/D sering kali memiliki standar kebersihan jagung/kakao yang berbeda.</p>
                <span className="text-[10px] text-brand-red font-bold block mt-0.5">Mitigasi: Penilaian Sistem Penilaian memberikan insentif kenaikan prioritas alokasi jika kualitas ditingkatkan.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Kanvas Pertumbuhan - Uji Pilot & Traksi",
      subtitle: "Rencana validasi bertahap di lapangan mulai dari proyek percontohan hingga pendanaan.",
      category: "8. EKSEKUSI AWAL",
      content: (
        <div className="space-y-2.5 text-xs pr-1">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-2 bg-brand-navy text-white p-2 rounded-lg font-black uppercase text-[9px] tracking-wider text-center">
            <div>Milestone Utama</div>
            <div>Output / Deliverable</div>
            <div>PIC (Nama/Peran)</div>
            <div>Indikator Sukses</div>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg items-center text-center">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 justify-center">
              <Warehouse className="h-4 w-4 text-brand-red shrink-0" />
              <span>Pilot Onboarding Banten</span>
            </div>
            <div className="text-slate-655 leading-tight">Sistem database & pemetaan potensi 10 Koperasi produsen Jagung/Kakao.</div>
            <div className="font-semibold text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 w-fit mx-auto text-[10px]">Tim Lapangan & Admin</div>
            <div className="font-bold text-brand-navy">10 Koperasi terdaftar dengan ARUNA Score Grade A/B</div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg items-center text-center">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 justify-center">
              <Cpu className="h-4 w-4 text-brand-orange shrink-0" />
              <span>Uji Coba Matchmaking</span>
            </div>
            <div className="text-slate-655 leading-tight">Transaksi perdana konsolidasi supply Jagung 100 Ton dari 3 desa didukung Kasir POS & AI Command.</div>
            <div className="font-semibold text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 w-fit mx-auto text-[10px]">Lead Dev & Koperasi</div>
            <div className="font-bold text-brand-red">100% SLA pengisian volume order terpenuhi adil</div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-4 gap-2 bg-white border border-slate-200 p-2.5 rounded-lg items-center text-center">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 justify-center">
              <Landmark className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Kemitraan LPDB</span>
            </div>
            <div className="text-slate-655 leading-tight">Akses pendanaan kerja modal bergulir logistik bagi Koperasi Grade B/C.</div>
            <div className="font-semibold text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 w-fit mx-auto text-[10px]">Gov Relations & Koperasi</div>
            <div className="font-bold text-emerald-600">Penyaluran Rp 5 Milyar modal kerja gotong royong</div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "Roadmap Pengembangan ARUNA",
      subtitle: "Tahapan hilirisasi koperasi menuju ekspor global 2028 & kelayakan model bisnis.",
      category: "9. VISI JANGKA PANJANG",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full text-xs">
          <div className="space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Rencana Kerja 4 Fase</h3>
            <div className="space-y-3">
              {[
                { title: "Fase 1: MVP & Pemetaan Analitik (Q3 2026)", desc: "Menyelesaikan pemetaan komoditas, sistem penilaian, POS Kasir, Kontrol & Analisis AI, & Sinkronisasi Offline." },
                { title: "Fase 2: Integrasi Supply Chain & Logistik (Q1 2027)", desc: "Menambahkan manajemen logistik terintegrasi, pelacakan armada gotong royong, dan escrow payment." },
                { title: "Fase 3: Smart Warehouse & Kemitraan LPDB (Q3 2027)", desc: "Penyediaan hub gudang berpendingin (cold chain) di daerah sentra produksi serta pembiayaan mikro." },
                { title: "Fase 4: Global Export Cooperatives (2028)", desc: "Menghubungkan agregasi komoditas koperasi pedesaan ke pasar ekspor internasional secara langsung." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-orange mt-2 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white leading-none mb-1">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-center space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-brand-orange" /> Kelayakan Bisnis & Pendapatan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ARUNA memungut biaya administrasi ringan sebesar 1.5% dari total nilai transaksi gotong royong yang berhasil dipenuhi. Pendapatan dialokasikan kembali untuk:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Penyediaan modal kerja gotong royong logistik</li>
              <li>Pemeliharaan platform digital terpadu</li>
              <li>Dana kontribusi pengembangan kapasitas koperasi desa</li>
            </ul>
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
    <div className="flex-1 py-10 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-brand-navy dark:text-white flex items-center gap-2">
              <Compass className="h-8 w-8 text-brand-red animate-spin-slow" />
              Pitch Deck ARUNA
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Kerangka Pikir & Strategi Hilirisasi Koperasi Rakyat Pedesaan</p>
          </div>

          {/* Quick Tab Selectors */}
          <div className="flex flex-wrap gap-1">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${activeSlide === idx
                    ? 'bg-brand-navy text-white shadow'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                  }`}
              >
                Slide {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Slide Frame (Card) */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white w-full max-w-4xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 select-none">
            <span className="text-xs bg-brand-orange/20 text-brand-orange px-2.5 py-0.5 rounded-full font-extrabold tracking-wider uppercase">
              {slides[activeSlide].category}
            </span>
            <span className="text-xs text-slate-450 font-bold">
              Slide {activeSlide + 1} dari {slides.length}
            </span>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
              {slides[activeSlide].title}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              {slides[activeSlide].subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 p-6 md:p-8">
            <div className="h-[350px] overflow-y-auto pr-1">
              {slides[activeSlide].content}
            </div>
          </CardContent>

          <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 select-none">
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
                  className={`h-2 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-6 bg-brand-red' : 'w-2 bg-slate-350 dark:bg-slate-700'
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
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 italic">
          Gunakan tombol &ldquo;Sebelumnya&rdquo; dan &ldquo;Selanjutnya&rdquo; untuk menavigasi slide presentasi ARUNA.
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, ArrowRight, ShieldAlert, Cpu,
  TrendingUp, Award
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
      title: "Krisis Rantai Pasok Koperasi Desa",
      subtitle: "Mengapa potensi ekonomi desa masih terhambat di pasar nasional?",
      category: "LATAR BELAKANG",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-brand-red">Masalah Struktural</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Koperasi desa di seluruh Indonesia memiliki hasil bumi luar biasa melimpah. Namun, mereka berjuang sendiri-sendiri. 
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex gap-3 items-start">
                <div className="h-5 w-5 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-xs mt-0.5">!</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Skala Pasok Kecil:</strong> Pesanan PT Mayora membutuhkan 200 ton Kakao, sedangkan satu koperasi desa rata-rata hanya memproduksi 15-30 ton.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="h-5 w-5 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-xs mt-0.5">!</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Eksploitasi Rantai Pasok:</strong> Tanpa akses langsung, tengkulak membeli dengan harga sangat murah di tingkat petani lalu menjual mahal ke industri.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="h-5 w-5 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-bold text-xs mt-0.5">!</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Buta Data Komoditas:</strong> Pemerintah kesulitan mengarahkan pembinaan karena data sebaran komoditas dan kapasitas panen tidak terpusat.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
            <ShieldAlert className="h-16 w-16 text-brand-red animate-pulse" />
            <div className="text-3xl font-black text-slate-800 dark:text-white">92%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Koperasi desa gagal bertransaksi dengan korporasi besar karena masalah kuota volume minimal.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Solusi ARUNA: Gotong Royong Digital",
      subtitle: "Menghubungkan potensi desa ke pasar nasional secara kolaboratif.",
      category: "SOLUSI INOVATIF",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Konsolidasi Rantai Pasok</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              ARUNA bukan marketplace retail. ARUNA adalah platform agregasi dan analitik nasional yang mengubah cara koperasi bermitra dengan industri besar.
            </p>
            <div className="grid gap-3 pt-2">
              <div className="flex gap-3 p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50">
                <Cpu className="h-5 w-5 text-brand-orange mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Gotong Royong Matchmaking</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Menggabungkan stok surplus dari beberapa koperasi terdekat secara instan untuk memenuhi permintaan agregat offtaker.</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-white/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50">
                <Award className="h-5 w-5 text-brand-red mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">ARUNA Score Card</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Algoritma standarisasi kesiapan koperasi mencakup kesehatan anggota, kapasitas pasokan, dan performa finansial.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-brand-navy text-white rounded-2xl flex flex-col justify-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/20 rounded-full blur-xl" />
            <h4 className="font-black text-brand-orange text-sm uppercase tracking-wider">Paradigma Baru</h4>
            <div className="text-xl font-bold text-white italic">
              &ldquo;Dari berjalan sendiri-sendiri, menuju kolaborasi terintegrasi.&rdquo;
            </div>
            <p className="text-xs text-slate-300">
              Dengan gotong royong digital, offtaker hanya berinteraksi dengan satu kuota agregat, dan koperasi desa berbagi hasil panen secara proporsional.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Bagaimana Gotong Royong Engine Bekerja",
      subtitle: "Alur pencocokan kebutuhan pasar nasional berbasis Greedy Matching.",
      category: "MEKANISME KERJA",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Permintaan Korporasi", desc: "Offtaker nasional menerbitkan kebutuhan komoditas (misal: 500 Ton Jagung)." },
              { step: "2", title: "Pemetaan Otomatis", desc: "Sistem mencari koperasi terdekat yang memproduksi komoditas dengan ketersediaan stok." },
              { step: "3", title: "Greedy Allocation", desc: "Algoritma memilah koperasi berdasarkan ARUNA score tertinggi untuk alokasi supply." },
              { step: "4", title: "Visualisasi & Kirim", desc: "Peta gotong royong menunjukkan rute pasokan dari koperasi menuju titik pembeli secara real-time." }
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center relative">
                <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-white text-xs font-black">
                  {item.step}
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-4 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl text-center">
            <span className="text-xs font-bold text-brand-orange uppercase block mb-1">Keunggulan Utama</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Tidak ada monopoli pasokan. Koperasi kecil dengan Grade A didahulukan untuk menumbuhkan pemerataan ekonomi, namun alokasi disesuaikan dengan stok tersedia agar tidak mengganggu operasional internal.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Metodologi ARUNA Score & AI Insights",
      subtitle: "Sistem penilaian terstandar dan rule-based diagnostic rekomendasi.",
      category: "TEKNOLOGI ANALITIK",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Skor Transparan & Kredibel</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ARUNA Score dihitung menggunakan kombinasi 3 pilar data fundamental koperasi:
            </p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pilar 1: Keaktifan Anggota (Health Score)</span>
                <span className="font-black text-brand-red">Bobot 40%</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pilar 2: Pertumbuhan Finansial (Revenue Score)</span>
                <span className="font-black text-brand-navy dark:text-slate-400">Bobot 30%</span>
              </div>
              <div className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Pilar 3: Stabilitas Pasokan (Supply Score)</span>
                <span className="font-black text-brand-orange">Bobot 30%</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Rule Engine Diagnostics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Menggantikan model AI berbayar dengan 10+ rule lokal berbasis regulasi koperasi nasional untuk diagnosis instan:
            </p>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400">✓ Rule Keaktifan Rendah (&lt;60%):</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                &ldquo;Partisipasi anggota rendah. Rekomendasi: Tingkatkan program pelatihan gotong-royong.&rdquo;
              </p>
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mt-2">✓ Rule Utilisasi Kapasitas Tinggi (&gt;80%):</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                &ldquo;Permintaan sangat tinggi. Rekomendasi: Pertimbangkan ekspansi kapasitas produksi.&rdquo;
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Roadmap Pengembangan ARUNA",
      subtitle: "Tahapan hilirisasi dan digitalisasi koperasi menuju 2028.",
      category: "STRATEGI MASA DEPAN",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rencana Kerja 4 Fase</h3>
            <div className="space-y-3">
              {[
                { title: "Fase 1: MVP & Pemetaan Analitik (Q3 2026)", desc: "Menyelesaikan pemetaan komoditas nasional, scoring engine, dan pendaftaran 100+ koperasi awal." },
                { title: "Fase 2: Integrasi Supply Chain & Logistik (Q1 2027)", desc: "Menambahkan manajemen logistik terintegrasi, pelacakan armada gotong royong, dan escrow payment." },
                { title: "Fase 3: Smart Warehouse & Kemitraan LPDB (Q3 2027)", desc: "Penyediaan hub gudang berpendingin (cold chain) di daerah sentra produksi serta pembiayaan mikro." },
                { title: "Fase 4: Global Export Cooperatives (2028)", desc: "Menghubungkan agregasi komoditas koperasi pedesaan ke pasar ekspor internasional secara langsung." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-orange mt-2 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-white leading-none mb-1">{item.title}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-brand-orange" /> Kelayakan Bisnis & Pendapatan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ARUNA memungut biaya administrasi ringan 1.5% dari total nilai transaksi gotong royong yang sukses. Pendapatan ini dialokasikan kembali untuk:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Pemeliharaan infrastruktur server cloud</li>
              <li>Dana kontribusi pengembangan koperasi desa Grade D</li>
              <li>Operasional tim fasilitator lapang desa</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Dampak Nasional & Kesimpulan",
      subtitle: "Mewujudkan Indonesia Emas 2045 melalui pilar ekonomi gotong royong.",
      category: "DAMPAK SOSIAL EKONOMI",
      content: (
        <div className="grid md:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Ekonomi Desa yang Berdaulat</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              ARUNA adalah wujud nyata modernisasi **Koperasi sebagai Soko Guru Perekonomian Indonesia** sesuai amanat Undang-Undang Dasar 1945 Pasal 33.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center">
                <div className="font-bold text-brand-red text-sm">40%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Kenaikan Harga Jual Petani</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center">
                <div className="font-bold text-brand-navy dark:text-slate-400 text-sm">25%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Efisiensi Rute Logistik</div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center">
                <div className="font-bold text-brand-orange text-sm">100%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Transparansi Keuangan</div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gradient-to-tr from-brand-navy to-brand-red text-white rounded-2xl flex flex-col justify-center space-y-4">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-brand-orange">✓</div>
            <h4 className="font-bold text-base text-white">Visi Jangka Panjang</h4>
            <p className="text-xs text-slate-200 leading-relaxed">
              &ldquo;Dulu koperasi berjalan sendiri-sendiri dan rentan. Bersama ARUNA, koperasi saling merangkul, berkolaborasi memenuhi pasar nasional, dan menghidupkan kembali roh gotong royong di era digital.&rdquo;
            </p>
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

  return (
    <div className="flex-1 py-10 bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Pitch Deck ARUNA</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Presentasi Solusi Gotong Royong Digital - Hackathon 2026</p>
          </div>
          
          {/* Quick Tab Selectors */}
          <div className="flex flex-wrap gap-1">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeSlide === idx
                    ? 'bg-brand-navy text-white dark:bg-brand-red'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'
                }`}
              >
                Slide {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Slide Frame (Card) */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[460px] flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded font-extrabold tracking-wider uppercase">
              {slides[activeSlide].category}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Slide {activeSlide + 1} dari {slides.length}
            </span>
          </div>
          
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white">
              {slides[activeSlide].title}
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
              {slides[activeSlide].subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 p-6 md:p-8">
            {slides[activeSlide].content}
          </CardContent>
          
          <div className="border-t border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={activeSlide === 0}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Sebelumnya
            </Button>
            
            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeSlide === idx ? 'w-6 bg-brand-red' : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <Button
              variant={activeSlide === slides.length - 1 ? 'accent' : 'default'}
              size="sm"
              onClick={nextSlide}
              disabled={activeSlide === slides.length - 1}
              className="flex items-center gap-1.5"
            >
              Selanjutnya <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
        
        {/* Footnote */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 italic">
          Gunakan tombol &ldquo;Sebelumnya&rdquo; dan &ldquo;Selanjutnya&rdquo; untuk menelusuri pitch deck.
        </p>
      </div>
    </div>
  );
}

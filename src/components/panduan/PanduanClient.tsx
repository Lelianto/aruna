'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Building2,
  Landmark,
  BarChart3,
  ShieldCheck,
  ShoppingBag,
  Compass,
  Map,
  Award,
  Lightbulb,
  MapPin,
  LogIn,
  CheckCircle2,
  ArrowRight,
  Lightbulb as Bulb,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

// ─── Tipe data panduan ────────────────────────────────────────────────────────
interface Feature {
  title: string;
  desc: string;
  steps: string[];
}

interface RoleGuide {
  id: string;
  label: string;
  short: string;
  tagline: string;
  icon: LucideIcon;
  accent: string; // kelas warna teks/latar aksen
  accentBar: string; // kelas latar untuk bar/badge
  access: string[];
  quickStart: string[];
  features: Feature[];
  tips: string[];
}

// ─── Konten panduan per peran ──────────────────────────────────────────────────
const GUIDES: RoleGuide[] = [
  {
    id: 'customer',
    label: 'Customer / Pembeli Eceran',
    short: 'Customer',
    tagline: 'Belanja langsung hasil komoditas koperasi desa.',
    icon: Users,
    accent: 'text-brand-orange',
    accentBar: 'bg-brand-orange',
    access: ['Pasar Digital (transaksi eceran)'],
    quickStart: [
      'Klik "Masuk Google" di pojok kanan atas.',
      'Pada halaman Pilih Peran, pilih "Customer / Pembeli Umum".',
      'Atur alamat pengiriman melalui menu "Atur Alamat" di Akun.',
      'Buka Pasar Digital dan mulai berbelanja.',
    ],
    features: [
      {
        title: 'Mengatur alamat pengiriman',
        desc: 'Alamat dipakai otomatis saat checkout.',
        steps: [
          'Buka menu Akun (mobile) atau klik "Atur Alamat" di bilah profil (desktop).',
          'Isi alamat pengiriman lengkap.',
          'Simpan. Alamat akan terpakai pada pesanan berikutnya.',
        ],
      },
      {
        title: 'Menambah produk ke keranjang',
        desc: 'Pilih komoditas eceran dan tentukan jumlahnya.',
        steps: [
          'Buka Pasar Digital dan pilih produk.',
          'Klik "Tambah ke Keranjang".',
          'Atur jumlah sesuai kebutuhan.',
        ],
      },
      {
        title: 'Checkout & membuat pesanan',
        desc: 'Selesaikan pembelian dengan alamat tersimpan.',
        steps: [
          'Buka keranjang belanja.',
          'Periksa daftar item dan alamat pengiriman.',
          'Konfirmasi pesanan.',
        ],
      },
    ],
    tips: [
      'Pastikan alamat pengiriman sudah benar sebelum checkout.',
      'Anda dapat berpindah peran kapan saja melalui menu "Ganti Peran".',
    ],
  },
  {
    id: 'buyer',
    label: 'Buyer Industri',
    short: 'Buyer',
    tagline: 'Pengadaan komoditas skala industri lewat gotong royong pasok.',
    icon: Building2,
    accent: 'text-brand-navy',
    accentBar: 'bg-brand-navy',
    access: ['Pasar Digital', 'Katalog Komoditas', 'Detail Pencocokan (order sendiri)', 'Analisis AI (terbatas)'],
    quickStart: [
      'Masuk Google, lalu pilih peran "Buyer Industri".',
      'Kaitkan akun dengan profil perusahaan (buyer) Anda.',
      'Telusuri Katalog Komoditas untuk melihat kapasitas pasok nasional.',
      'Buat permintaan pasar untuk kebutuhan volume besar.',
    ],
    features: [
      {
        title: 'Menelusuri Katalog Komoditas',
        desc: 'Bandingkan stok, harga, dan wilayah produksi sebelum memesan.',
        steps: [
          'Buka menu Komoditas.',
          'Saring berdasarkan jenis komoditas dan wilayah.',
          'Catat kapasitas pasok yang tersedia untuk perencanaan pengadaan.',
        ],
      },
      {
        title: 'Membuat Permintaan Pasar (Market Request)',
        desc: 'Ajukan kebutuhan komoditas dalam jumlah besar.',
        steps: [
          'Tentukan komoditas, volume, harga target, dan tenggat waktu.',
          'Kirim permintaan agar terbaca oleh koperasi penyuplai.',
          'Pantau status pemenuhan permintaan Anda.',
        ],
      },
      {
        title: 'Pencocokan Gotong Royong (Business Matching)',
        desc: 'Satu permintaan besar dipenuhi gabungan beberapa koperasi.',
        steps: [
          'Buka halaman Detail Pencocokan untuk order milik Anda.',
          'Tinjau kalkulasi kecocokan supply antar-koperasi.',
          'Lanjutkan koordinasi pemenuhan dengan koperasi yang direkomendasikan.',
        ],
      },
      {
        title: 'Analisis AI: peramalan harga',
        desc: 'Rencanakan waktu pembelian terbaik.',
        steps: [
          'Buka menu Analisis AI.',
          'Lihat prakiraan harga pangan untuk komoditas yang Anda butuhkan.',
          'Sesuaikan jadwal pengadaan berdasarkan proyeksi harga.',
        ],
      },
    ],
    tips: [
      'Gunakan peramalan harga AI untuk mengunci harga pada waktu yang optimal.',
      'Detail pencocokan hanya bisa dibuka untuk pesanan yang Anda buat sendiri.',
    ],
  },
  {
    id: 'koperasi',
    label: 'Ketua Koperasi',
    short: 'Koperasi',
    tagline: 'Kelola operasional koperasi dan jual ke pasar nasional.',
    icon: Landmark,
    accent: 'text-brand-red',
    accentBar: 'bg-brand-red',
    access: ['Portal Mitra', 'Katalog Komoditas', 'Pasar Digital', 'Analisis AI', 'Skor Kelayakan (milik sendiri)'],
    quickStart: [
      'Masuk Google, lalu pilih peran "Koperasi".',
      'Daftarkan koperasi baru (isi NIB, nomor SK, SIMKOPDES, dan titik lokasi peta) atau pilih koperasi yang sudah terdaftar.',
      'Koordinasikan verifikasi kemitraan dengan Admin.',
      'Buka "Portal Saya" (Portal Mitra) untuk mulai mengelola.',
    ],
    features: [
      {
        title: 'Kasir POS',
        desc: 'Catat penjualan harian, mendukung mode offline.',
        steps: [
          'Buka tab "Kasir POS" di Portal Mitra.',
          'Pilih produk, tentukan pembeli (anggota atau umum).',
          'Pilih metode bayar: Tunai, Transfer, Simpanan, atau QRIS (GPN).',
          'Simpan transaksi; data tersinkron otomatis saat kembali online.',
        ],
      },
      {
        title: 'Stok & Opname',
        desc: 'Kelola daftar komoditas dan koreksi stok fisik.',
        steps: [
          'Buka tab "Stok & Opname".',
          'Tambah atau ubah komoditas beserta satuan dan stok tersedia.',
          'Lakukan opname untuk menyesuaikan stok sistem dengan stok fisik.',
        ],
      },
      {
        title: 'Pembelian (Stok Masuk)',
        desc: 'Catat pembelian dari anggota/petani untuk menambah stok.',
        steps: [
          'Buka tab "Pembelian (Stok Masuk)".',
          'Pilih komoditas dan masukkan jumlah serta harga beli.',
          'Simpan untuk menambah stok gudang.',
        ],
      },
      {
        title: 'Anggota, Laporan & SHU',
        desc: 'Kelola keanggotaan, keuangan, dan bagi hasil.',
        steps: [
          'Tab "Anggota Koperasi": kelola data anggota dan simpanan.',
          'Tab "Laporan Keuangan": lihat ringkasan pendapatan dan grafik kinerja.',
          'Tab "Bagi Hasil (SHU)": hitung dan distribusikan Sisa Hasil Usaha.',
        ],
      },
      {
        title: 'Permintaan Pasar & Connector',
        desc: 'Penuhi permintaan buyer dan berkolaborasi antar-koperasi.',
        steps: [
          'Tab "Permintaan Pasar": tinjau permintaan buyer (badge "Menunggu Pemenuhan") dan ajukan pemenuhan.',
          'Tab "Connector & Pengadaan": ikut pengadaan kolektif dan perdagangan antar-koperasi.',
        ],
      },
      {
        title: 'Analisis AI & Skor Kelayakan',
        desc: 'Rencanakan tanam/panen dan pantau kelayakan kredit.',
        steps: [
          'Buka menu Analisis AI untuk prakiraan harga membantu rencana tanam dan panen.',
          'Buka Skor Kelayakan untuk melihat ARUNA Score koperasi Anda (read-only).',
        ],
      },
    ],
    tips: [
      'Portal Mitra dapat digunakan offline di lapangan; data tersinkron otomatis saat online.',
      'Manfaatkan asisten suara pada Kasir bila tersedia untuk pencatatan lebih cepat.',
    ],
  },
  {
    id: 'pemerintah',
    label: 'Perwakilan Pemerintah',
    short: 'Pemerintah',
    tagline: 'Pantau dan dorong potensi ekonomi desa berbasis data.',
    icon: BarChart3,
    accent: 'text-emerald-700',
    accentBar: 'bg-emerald-600',
    access: ['Peta Potensi', 'Dashboard Nasional', 'Skor Kelayakan', 'Analisis AI', 'Katalog Komoditas', 'Pasar Digital'],
    quickStart: [
      'Masuk Google, lalu pilih peran "Perwakilan Pemerintah".',
      'Anda akan diarahkan ke Peta Potensi sebagai ruang kerja utama.',
    ],
    features: [
      {
        title: 'Peta Potensi Desa',
        desc: 'Identifikasi wilayah prioritas.',
        steps: [
          'Buka menu Peta Potensi.',
          'Jelajahi sebaran potensi dan koperasi per wilayah.',
          'Tandai daerah yang membutuhkan intervensi program.',
        ],
      },
      {
        title: 'Dashboard Nasional',
        desc: 'Pantau kinerja agregat platform.',
        steps: [
          'Buka menu Dashboard Nasional.',
          'Tinjau statistik transaksi, total kapasitas pasok, dan visualisasi kinerja.',
        ],
      },
      {
        title: 'Skor Kelayakan & Analisis AI',
        desc: 'Dukung keputusan program dan kebijakan.',
        steps: [
          'Buka Skor Kelayakan untuk meninjau ARUNA Score koperasi.',
          'Buka Analisis AI untuk prakiraan harga dan sentimen pasar.',
          'Padukan Peta + Skor untuk menyasar intervensi yang tepat sasaran.',
        ],
      },
    ],
    tips: [
      'Gunakan kombinasi Peta Potensi dan Skor Kelayakan untuk memprioritaskan bantuan.',
      'Data Komoditas dan Pasar Digital membantu memvalidasi harga dan ketersediaan riil.',
    ],
  },
  {
    id: 'admin',
    label: 'Admin Platform',
    short: 'Admin',
    tagline: 'Operasikan dan awasi seluruh platform.',
    icon: ShieldCheck,
    accent: 'text-brand-navy',
    accentBar: 'bg-brand-navy',
    access: ['Akses penuh ke seluruh halaman'],
    quickStart: [
      'Masuk dengan akun admin.',
      'Anda diarahkan ke Portal Mitra dengan seluruh menu terbuka.',
    ],
    features: [
      {
        title: 'Onboarding Mitra',
        desc: 'Validasi dan setujui koperasi baru.',
        steps: [
          'Buka menu Pendaftaran / Onboarding Mitra.',
          'Periksa berkas NIB dan SK koperasi yang mendaftar.',
          'Setujui atau tolak kemitraan sesuai kelengkapan dokumen.',
        ],
      },
      {
        title: 'Pengawasan platform',
        desc: 'Pantau seluruh metrik dan kelola skor.',
        steps: [
          'Dashboard Nasional: pantau seluruh metrik platform.',
          'Skor Kelayakan: kalkulasi dan ubah ARUNA Score koperasi.',
          'Peta Potensi, Komoditas, Pasar Digital, Analisis AI, dan Portal Mitra terbuka penuh untuk dukungan.',
        ],
      },
      {
        title: 'Dukungan pengguna',
        desc: 'Bantu pengguna lain bila diperlukan.',
        steps: [
          'Arahkan pengguna baru untuk memilih peran yang tepat.',
          'Gunakan "Ganti Peran" untuk membantu koreksi peran akun.',
        ],
      },
    ],
    tips: [
      'Prioritaskan verifikasi onboarding agar koperasi baru cepat aktif bertransaksi.',
      'Karena akses penuh, lakukan perubahan skor dan data dengan hati-hati.',
    ],
  },
];

// Ikon untuk chip akses (dipetakan longgar dari label).
const accessIcon = (label: string): LucideIcon => {
  const l = label.toLowerCase();
  if (l.includes('pasar')) return ShoppingBag;
  if (l.includes('komoditas')) return Compass;
  if (l.includes('peta')) return Map;
  if (l.includes('dashboard')) return BarChart3;
  if (l.includes('skor')) return Award;
  if (l.includes('analisis') || l.includes('ai')) return Lightbulb;
  if (l.includes('portal')) return Landmark;
  if (l.includes('lokasi') || l.includes('alamat')) return MapPin;
  return CheckCircle2;
};

export default function PanduanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Peran aktif diturunkan langsung dari query "peran" agar tautan footer dapat
  // dibagikan dan tidak perlu menyinkronkan state di dalam effect.
  const requested = searchParams.get('peran');
  const active = useMemo(
    () => GUIDES.find((g) => g.id === requested) ?? GUIDES[0],
    [requested]
  );

  const selectRole = (id: string) => {
    // Perbarui URL tanpa reload; komponen akan render ulang dari query baru.
    router.replace(`/panduan?peran=${id}`, { scroll: false });
  };

  const ActiveIcon = active.icon;

  return (
    <div className="page-shell">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-brand-navy">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-yellow">
            <ClipboardList className="h-4 w-4" />
            Panduan Pengguna ARUNA
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Cara Menggunakan Platform Sesuai Peran Anda
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            ARUNA menghubungkan koperasi desa, pembeli industri, konsumen, dan
            pemerintah dalam satu ekosistem gotong royong digital. Pilih peran Anda
            di bawah ini untuk melihat langkah demi langkah pemakaiannya.
          </p>
        </div>
      </section>

      {/* Pemilih peran */}
      <div className="sticky top-[68px] z-30 border-b border-slate-200 bg-[var(--bg-base)]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GUIDES.map((g) => {
              const Icon = g.icon;
              const isActive = g.id === active.id;
              return (
                <button
                  key={g.id}
                  onClick={() => selectRole(g.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${isActive
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {g.short}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Konten peran */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Judul peran */}
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${active.accentBar}`}>
            <ActiveIcon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{active.label}</h2>
            <p className="mt-1 text-sm text-slate-500">{active.tagline}</p>
          </div>
        </div>

        {/* Chip akses */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Halaman yang dapat diakses
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {active.access.map((a) => {
              const Icon = accessIcon(a);
              return (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <Icon className={`h-3.5 w-3.5 ${active.accent}`} />
                  {a}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Mulai cepat */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <ArrowRight className={`h-5 w-5 ${active.accent}`} />
                <h3 className="text-base font-semibold text-slate-900">Mulai Cepat</h3>
              </div>
              <ol className="mt-4 space-y-4">
                {active.quickStart.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${active.accentBar}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>

              <Link
                href="/select-role"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <LogIn className="h-4 w-4" /> Masuk & Pilih Peran
              </Link>
            </div>

            {/* Tips */}
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
              <div className="flex items-center gap-2">
                <Bulb className="h-5 w-5 text-brand-orange" />
                <h3 className="text-base font-semibold text-slate-900">Tips</h3>
              </div>
              <ul className="mt-3 space-y-2.5">
                {active.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Panduan fitur */}
          <div className="lg:col-span-2">
            <h3 className="text-base font-semibold text-slate-900">
              Panduan Fitur ({active.features.length})
            </h3>
            <div className="mt-4 space-y-4">
              {active.features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-hover)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">{f.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white ${active.accentBar}`}>
                      Langkah
                    </span>
                  </div>
                  <ol className="mt-4 space-y-2.5">
                    {f.steps.map((s, j) => (
                      <li key={j} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                          {j + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

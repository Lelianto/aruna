import Link from 'next/link';
import {
  ShoppingBag,
  Compass,
  Map,
  BarChart3,
  Award,
  Lightbulb,
  BookOpen,
  Users,
  Building2,
  Landmark,
  ShieldCheck,
  UserRound,
  ArrowUpRight,
} from 'lucide-react';

// Kolom "Jelajah Platform" — tautan ke halaman fungsional utama.
const platformLinks = [
  { name: 'Pasar Digital', href: '/marketplace', icon: ShoppingBag },
  { name: 'Katalog Komoditas', href: '/komoditas', icon: Compass },
  { name: 'Peta Potensi Desa', href: '/potensi-desa', icon: Map },
  { name: 'Dashboard Nasional', href: '/dashboard', icon: BarChart3 },
  { name: 'Skor Kelayakan', href: '/scoring', icon: Award },
  { name: 'Analisis AI', href: '/insights', icon: Lightbulb },
];

// Kolom "Panduan Pengguna" — deep-link ke tab peran di halaman /panduan.
const guideLinks = [
  { name: 'Pengunjung Umum', href: '/panduan?peran=umum', icon: UserRound },
  { name: 'Customer / Pembeli Eceran', href: '/panduan?peran=customer', icon: Users },
  { name: 'Buyer Industri', href: '/panduan?peran=buyer', icon: Building2 },
  { name: 'Ketua Koperasi', href: '/panduan?peran=koperasi', icon: Landmark },
  { name: 'Perwakilan Pemerintah', href: '/panduan?peran=pemerintah', icon: BarChart3 },
  { name: 'Admin Platform', href: '/panduan?peran=admin', icon: ShieldCheck },
];

const pillars = [
  { label: 'Gotong royong', color: 'bg-brand-red' },
  { label: 'Rantai pasok', color: 'bg-brand-orange' },
  { label: 'Berbasis data', color: 'bg-brand-yellow' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-brand-navy text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Brand & deskripsi */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex flex-col leading-none">
              <span className="text-2xl font-semibold tracking-tight text-white leading-none">
                Aruna<span className="text-brand-orange">.</span>
              </span>
              <span className="mt-1 text-[10px] font-semibold tracking-wide text-slate-400 leading-none">
                Analitik Usaha Rakyat Nusantara
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Menghubungkan potensi komoditas desa ke pasar nasional melalui gotong
              royong digital. Satu platform untuk koperasi, pembeli industri, dan
              pemerintah bergerak dengan data.
            </p>

            <Link
              href="/panduan"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover"
            >
              <BookOpen className="h-4 w-4" />
              Buka Panduan Pengguna
            </Link>
          </div>

          {/* Jelajah platform */}
          <nav className="lg:col-span-3" aria-label="Jelajah platform">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Jelajah Platform
            </h3>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map(({ name, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-brand-yellow" />
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Panduan pengguna per peran */}
          <nav className="lg:col-span-5" aria-label="Panduan pengguna">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
              Panduan Pengguna
            </h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Cara pakai platform sesuai peran Anda.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {guideLinks.map(({ name, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-brand-yellow" />
                    <span className="flex-1">{name}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider + baris bawah */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-sm font-semibold text-white">ARUNA &copy; 2026</span>
            <span className="text-center text-xs text-slate-500 sm:text-left">
              Digital Cooperatives Expo 2026 &mdash; Pilar 3: Pemanfaatan Potensi Ekonomi Desa
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            {pillars.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

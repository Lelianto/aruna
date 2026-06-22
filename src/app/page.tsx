import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Compass,
  Cpu,
  Layers,
  Map,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const metrics = [
  { value: '20+', label: 'Koperasi mitra', tone: 'text-brand-navy' },
  { value: '14', label: 'Provinsi aktif', tone: 'text-brand-red' },
  { value: '15+', label: 'Komoditas unggulan', tone: 'text-brand-orange' },
  { value: '800+ T', label: 'Kapasitas bulanan', tone: 'text-emerald-700' },
];

const modules = [
  {
    icon: Map,
    title: 'Peta Potensi',
    desc: 'Pantau koperasi, stok, komoditas, dan sebaran wilayah dari satu layar kerja.',
    href: '/peta',
  },
  {
    icon: Cpu,
    title: 'Supply Engine',
    desc: 'Gabungkan pasokan beberapa koperasi untuk memenuhi permintaan buyer besar.',
    href: '/marketplace',
  },
  {
    icon: ShieldCheck,
    title: 'ARUNA Score',
    desc: 'Nilai kesiapan koperasi dari keaktifan anggota, finansial, dan stabilitas pasok.',
    href: '/scoring',
  },
];

const workflow = [
  'Permintaan buyer masuk dengan volume dan lokasi pabrik.',
  'Sistem memetakan koperasi yang cocok berdasarkan komoditas, stok, dan skor.',
  'Kuota dibagi proporsional sehingga koperasi kecil bisa ikut memenuhi pasar nasional.',
];

export default function LandingPage() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800">
        <div className="section-shell grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <div className="kicker mb-5">
              <Sparkles className="h-4 w-4 text-brand-orange" />
              Digital Cooperatives Expo 2026
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] text-slate-950 dark:text-white sm:text-6xl">
              ARUNA
            </h1>
            <p className="mt-3 max-w-2xl text-xl font-bold text-brand-navy dark:text-slate-200 sm:text-2xl">
              Analitik Usaha Rakyat Nusantara
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Command center untuk membaca potensi desa, menggabungkan pasokan koperasi,
              dan membuka akses langsung ke permintaan industri nasional.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/peta" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 bg-brand-red hover:bg-brand-red/90">
                  Lihat Peta Potensi <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full gap-2">
                  Dashboard Nasional <BarChart3 className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(18,48,66,0.12)] dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Supply Match</p>
                <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">PT Indofood - Jagung</h2>
                </div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                  100% Terpenuhi
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  ['Lampung Makmur', '180 Ton', 'A'],
                  ['NTB Sejahtera', '170 Ton', 'B'],
                  ['Jatim Tani Bersatu', '150 Ton', 'A'],
                ].map(([name, volume, grade]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-brand-navy shadow-sm dark:bg-slate-950 dark:text-slate-200">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{name}</p>
                        <p className="text-xs text-slate-500">Alokasi gotong royong</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-red">{volume}</p>
                      <p className="text-xs font-bold text-slate-500">Grade {grade}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg bg-brand-navy p-4 text-white">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Network className="h-4 w-4 text-brand-yellow" />
                  Kuota buyer 500 Ton dipenuhi oleh 3 koperasi lintas provinsi.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((item) => (
            <div key={item.label} className="metric-tile p-4">
                <div className={`text-2xl font-black ${item.tone} dark:text-white`}>{item.value}</div>
              <div className="mt-1 text-xs font-bold uppercase text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="kicker">
            <Layers className="h-4 w-4 text-brand-red" />
            Cara kerja
          </span>
          <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">
            Dari potensi tersebar menjadi supply nasional yang siap ditindaklanjuti.
          </h2>
          <div className="mt-6 space-y-3">
            {workflow.map((item, index) => (
              <div key={item} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-navy text-xs font-black text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.title} className="card-hover">
                <CardContent className="p-5">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-brand-cream text-brand-navy">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-black text-slate-950 dark:text-white">{module.title}</h3>
                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {module.desc}
                  </p>
                  <Link href={module.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-brand-red">
                    Buka modul <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="section-shell pb-14">
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Data demo siap untuk peta, dashboard, marketplace, scoring, dan insight.
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Mulai dari peta untuk membaca potensi, atau langsung buka marketplace untuk melihat simulasi agregasi pasokan.
            </p>
          </div>
          <Link href="/marketplace">
            <Button className="w-full gap-2 md:w-auto">
              Analisis Permintaan <Compass className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

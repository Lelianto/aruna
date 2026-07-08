'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Home, Users, Layers, ShoppingBag, ArrowRight, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { MarketRequestWithBuyer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  accentColor?: string;
}

function MetricCard({ title, value, subtext, icon, trend, trendType = 'positive', accentColor = 'bg-brand-navy' }: MetricCardProps) {
  return (
    <Card className="border-slate-200/80 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={`h-9 w-9 rounded-lg ${accentColor}/10 flex items-center justify-center text-current`}>
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trendType === 'positive' ? 'bg-emerald-50 text-emerald-700' :
              trendType === 'negative' ? 'bg-red-50 text-red-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}

interface DashboardClientProps {
  stats: {
    totalCooperatives: number;
    totalMembers: number;
    totalActiveMembers: number;
    totalCapacity: number;
    totalRequests: number;
    totalProvinces: number;
    activeRequestCount: number;
    averageScore: number;
  };
  charts: {
    topCommodities: Array<{ name: string; capacity: number; stock: number }>;
    provincesData: Array<{ name: string; capacity: number; cooperatives: number }>;
    categoriesData: Array<{ name: string; value: number; requests: number }>;
  };
  requests: MarketRequestWithBuyer[];
}

export default function DashboardClient({ stats, charts, requests }: DashboardClientProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || (userData && userData.role !== 'admin')) {
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user || !userData || userData.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-[#faf9f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-bold">Memuat...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#003049', '#D62828', '#F77F00', '#FCBF49', '#10B981', '#3B82F6', '#8B5CF6'];

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Pusat Analitik Koperasi Nasional
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitoring real-time komoditas desa, agregasi gotong royong, dan kesiapan kemitraan industri.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600">Sistem Terhubung</span>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Total Koperasi"
            value={stats.totalCooperatives}
            subtext="Tersebar di seluruh kepulauan"
            icon={<Home className="h-5 w-5 text-brand-navy" />}
            trend={`${stats.totalProvinces} Provinsi`}
            trendType="neutral"
          />
          <MetricCard
            title="Total Anggota"
            value={stats.totalMembers > 0 ? stats.totalMembers.toLocaleString('id-ID') : '0'}
            subtext={stats.totalMembers > 0 ? `Rasio aktif: ${Math.round((stats.totalActiveMembers / stats.totalMembers) * 100)}%` : 'Rasio aktif: 0%'}
            icon={<Users className="h-5 w-5 text-emerald-600" />}
            trend={stats.totalActiveMembers > 0 ? `${stats.totalActiveMembers.toLocaleString('id-ID')} Aktif` : '0 Aktif'}
            trendType="positive"
          />
          <MetricCard
            title="Kapasitas Nasional"
            value={`${stats.totalCapacity.toLocaleString('id-ID')} T`}
            subtext="Akumulasi komoditas unggulan"
            icon={<Layers className="h-5 w-5 text-brand-orange" />}
            trend="15 Komoditas"
            trendType="neutral"
          />
          <MetricCard
            title="Kebutuhan Buyer"
            value={`${stats.totalRequests.toLocaleString('id-ID')} Ton`}
            subtext={`${stats.activeRequestCount} Permintaan aktif`}
            icon={<ShoppingBag className="h-5 w-5 text-brand-red" />}
            trend="Gotong Royong"
            trendType="positive"
          />
        </div>

        {/* Charts Section */}
        <div className="grid min-w-0 grid-cols-1 gap-6 mb-8 lg:grid-cols-3">

          {/* Chart 1: Top Commodities */}
          <Card className="min-w-0 lg:col-span-2 border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Kapasitas vs Stok Komoditas Utama
              </CardTitle>
              <CardDescription>
                Perbandingan kapasitas produksi bulanan dengan stok siap kirim (Ton).
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topCommodities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="capacity" name="Kapasitas Bulanan" fill="#003049" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stock" name="Stok Tersedia" fill="#F77F00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Category Requests Pie */}
          <Card className="min-w-0 border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Permintaan per Kategori
              </CardTitle>
              <CardDescription>
                Proporsi volume permintaan (Ton) berdasarkan kategori.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] min-w-0 flex flex-col justify-center">
              <div className="h-[200px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.categoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {charts.categoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: '12px', borderRadius: '8px', background: '#fff' }}
                      formatter={(value) => [`${value} Ton`, 'Total Volume']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {charts.categoriesData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate font-medium">{entry.name} ({entry.value}t)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Row: Provinces & Highlight */}
        <div className="grid min-w-0 grid-cols-1 gap-6 mb-8 lg:grid-cols-3">

          {/* Chart 3: Province Production */}
          <Card className="min-w-0 lg:col-span-2 border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Kapasitas Produksi Per Provinsi
              </CardTitle>
              <CardDescription>
                Provinsi dengan kontribusi kapasitas panen gabungan tertinggi (Ton/Bulan).
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={charts.provincesData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" width={100} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', background: '#fff' }} />
                  <Bar dataKey="capacity" name="Kapasitas (Ton)" fill="#D62828" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Highlight Panel */}
          <Card className="border-slate-200/80 flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Kesiapan Nasional
              </CardTitle>
              <CardDescription>
                Status operasional koperasi terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 flex-1 justify-between flex flex-col">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl text-white ${
                  stats.averageScore >= 80 ? 'bg-emerald-500' : stats.averageScore >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                }`}>
                  {stats.averageScore >= 80 ? 'A' : stats.averageScore >= 70 ? 'B' : 'C'}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Rata-Rata Nilai Nasional</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {stats.averageScore}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3 flex-1 pt-3">
                <span className="text-xs text-slate-500 block font-bold uppercase">Sorotan Kemitraan</span>
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Gotong Royong:</strong> 100% permintaan jagung 500 ton PT Indofood terpenuhi dengan kolaborasi 3 koperasi.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Partisipasi:</strong> 85% anggota aktif berpartisipasi dalam pemenuhan rantai pasok nasional.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fourth Row: Active Gotong Royong Demands Hub */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-5.5 w-5.5 text-brand-red" /> Pusat Agregasi Permintaan (Kebutuhan Pasar Aktif)
            </h2>
            <Link href="/marketplace" className="text-xs font-bold text-brand-navy hover:text-brand-red hover:underline transition-colors flex items-center gap-1">
              Buka Semua Permintaan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {requests.slice(0, 3).map((req) => (
              <Card key={req.id} className="border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 truncate max-w-[150px]">
                          {req.buyer.company_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5">
                          {req.buyer.industry}
                        </span>
                      </div>
                    </div>
                    <Badge variant={req.status === 'Menunggu Pemenuhan' ? 'accent' : 'success'} className="text-[10px] px-2 py-0.5">
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="h-4 w-4 text-brand-red/60" />
                      <span>Pabrik: {req.buyer.city}</span>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Komoditas</span>
                        <span className="text-xs font-bold text-slate-800">{req.commodity_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 block font-bold">Kebutuhan</span>
                        <span className="text-sm font-black text-brand-red">{req.quantity} {req.unit}</span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/marketplace/${req.id}`} className="mt-4 block w-full">
                    <Button size="sm" className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 py-2">
                      Mulai Gotong Royong <ArrowRight className="h-3.5 w-3.5 text-brand-cream" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

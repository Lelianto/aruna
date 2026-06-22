'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Home, Users, Layers, ShoppingBag } from 'lucide-react';

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
    <Card className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={`h-9 w-9 rounded-lg ${accentColor}/10 flex items-center justify-center text-current`}>
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trendType === 'positive' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
              trendType === 'negative' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
}

export default function DashboardClient({ stats, charts }: DashboardClientProps) {
  const COLORS = ['#003049', '#D62828', '#F77F00', '#FCBF49', '#10B981', '#3B82F6', '#8B5CF6'];

  return (
    <div className="page-shell flex-1 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Pusat Analitik Koperasi Nasional
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Monitoring real-time komoditas desa, agregasi gotong royong, dan kesiapan kemitraan industri.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-600 dark:text-slate-300">Sistem Terhubung</span>
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
            value={stats.totalMembers.toLocaleString('id-ID')}
            subtext={`Rasio aktif: ${Math.round((stats.totalActiveMembers / stats.totalMembers) * 100)}%`}
            icon={<Users className="h-5 w-5 text-emerald-600" />}
            trend={`${stats.totalActiveMembers.toLocaleString('id-ID')} Aktif`}
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
          <Card className="min-w-0 lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
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
          <Card className="min-w-0 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
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
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
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

        {/* Third Row */}
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Chart 3: Province Production */}
          <Card className="min-w-0 lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
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
          <Card className="border-slate-200 dark:border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Kesiapan Nasional
              </CardTitle>
              <CardDescription>
                Status operasional koperasi terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 flex-1">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl text-white ${
                  stats.averageScore >= 80 ? 'bg-emerald-500' : stats.averageScore >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                }`}>
                  {stats.averageScore >= 80 ? 'A' : stats.averageScore >= 70 ? 'B' : 'C'}
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-bold uppercase">Rata-Rata Nilai Nasional</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg">
                    {stats.averageScore}/100
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs text-slate-500 block font-bold uppercase">Sorotan Demo</span>
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-white">Gotong Royong:</strong> 100% permintaan jagung 500 ton PT Indofood terpenuhi dengan 3 koperasi.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-white">Partisipasi:</strong> 85% anggota aktif berpartisipasi dalam manajemen rantai pasok.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

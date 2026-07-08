'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CooperativeWithCommodities } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Search, Lightbulb, MapPin, Compass, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ScoringClientProps {
  cooperatives: CooperativeWithCommodities[];
  initialCoopId?: string;
}

// Progress Ring SVG Helper
function ProgressRing({ value, size = 120, strokeWidth = 10, colorClass = 'stroke-primary' }: { value: number, size?: number, strokeWidth?: number, colorClass?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          className="stroke-slate-100"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress bar */}
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-black text-slate-800 leading-none">{value}</span>
        <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none mt-0.5">Skor</span>
      </div>
    </div>
  );
}

export default function ScoringClient({ cooperatives, initialCoopId }: ScoringClientProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // Sort cooperatives by score descending for rankings
  const rankedCoops = useMemo(() => {
    return [...cooperatives].sort((a, b) => (b.score?.final_score || 0) - (a.score?.final_score || 0));
  }, [cooperatives]);

  // Handle selected cooperative
  const [selectedId, setSelectedId] = useState<string>(
    initialCoopId || (rankedCoops[0]?.id || '')
  );
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user || !userData || (userData.role !== 'admin' && userData.role !== 'koperasi')) {
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  // Force selected ID to the cooperative's associated ID if user is koperasi
  useEffect(() => {
    if (userData?.role === 'koperasi' && userData.associatedId) {
      setSelectedId(userData.associatedId);
    }
  }, [userData]);

  const selectedCoop = useMemo(() => {
    if (userData?.role === 'koperasi') {
      return cooperatives.find(c => c.id === userData.associatedId);
    }
    return cooperatives.find(c => c.id === selectedId) || rankedCoops[0];
  }, [cooperatives, selectedId, rankedCoops, userData]);

  // Filter rankings list
  const filteredRankings = useMemo(() => {
    return rankedCoops.filter(coop => 
      coop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coop.province.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rankedCoops, searchQuery]);

  if (loading || !user || !userData || (userData.role !== 'admin' && userData.role !== 'koperasi')) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-[#faf9f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-bold">Memuat...</p>
        </div>
      </div>
    );
  }

  // Handle case where cooperative user has no associated cooperative data in list
  if (userData?.role === 'koperasi' && !selectedCoop) {
    return (
      <div className="page-shell flex-1 py-8 bg-[#faf9f6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Award className="h-8 w-8 text-brand-red" /> Sistem Penilaian ARUNA
            </h1>
          </div>
          <Card className="border-slate-200/80 bg-white p-8 text-center">
            <p className="text-sm font-bold text-slate-500">Akun Anda belum ditautkan ke data koperasi terdaftar. Silakan hubungi Admin ARUNA.</p>
          </Card>
        </div>
      </div>
    );
  }

  const score = selectedCoop?.score;
  const grade = score?.grade || 'D';

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Award className="h-8 w-8 text-brand-red" /> Sistem Penilaian ARUNA
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standarisasi kelayakan kemitraan koperasi berdasarkan keaktifan, pendapatan, dan stabilitas pasokan.
          </p>
        </div>

        {/* Top Section: Score explanation & Gauge Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Left: Formula explanation */}
          <Card className="border-slate-200/80 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">
                Formula ARUNA Score
              </CardTitle>
              <CardDescription>
                Mekanisme pembobotan terstandar nasional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                <span className="font-bold text-slate-800">1. Pilar Keaktifan (40%)</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rasio anggota aktif vs total terdaftar. Menguji komitmen gotong royong internal.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                <span className="font-bold text-slate-800">2. Pilar Keuangan (30%)</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rasio pendapatan tahunan dibanding koperasi terbaik dalam database nasional.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                <span className="font-bold text-slate-800">3. Pilar Pasokan (30%)</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rasio stok siap kirim vs kapasitas produksi. Menguji stabilitas supply.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700 block mb-2 text-xs uppercase tracking-wider">Grade Kemitraan:</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <span className="text-emerald-600">A (&ge;85): Sangat Siap</span>
                  <span className="text-blue-500">B (&ge;70): Siap Bermitra</span>
                  <span className="text-amber-500">C (&ge;55): Cukup Siap</span>
                  <span className="text-red-500">D (&lt;55): Perlu Pembinaan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Middle & Right: Selected Cooperative Gauge Dashboard */}
          {selectedCoop && (
            <Card className="lg:col-span-2 border-slate-200/80 bg-white relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] bg-brand-navy text-white px-2.5 py-0.5 rounded-full font-bold uppercase">
                      {selectedCoop.province}
                    </span>
                    <CardTitle className="text-xl font-black text-slate-900 mt-2">
                      {selectedCoop.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-brand-red/60" /> Kab/Kota: {selectedCoop.city}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Grade</span>
                    <span className={`inline-block font-black text-2xl px-4 py-1.5 rounded-xl text-white ${
                      grade === 'A' ? 'bg-emerald-500' :
                      grade === 'B' ? 'bg-blue-500' :
                      grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                    }`}>
                      {grade}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">

                {/* 4 SVG Gauges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing value={score?.final_score || 0} size={90} strokeWidth={8} colorClass="stroke-brand-red" />
                    <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Skor Akhir</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing value={score?.health_score || 0} size={90} strokeWidth={8} colorClass="stroke-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Keaktifan</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing value={score?.growth_score || 0} size={90} strokeWidth={8} colorClass="stroke-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Keuangan</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProgressRing value={score?.supply_score || 0} size={90} strokeWidth={8} colorClass="stroke-brand-orange" />
                    <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Pasokan</span>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-600 border-t border-b border-slate-100 py-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Partisipasi Anggota</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-slate-400" /> {selectedCoop.active_members} Aktif / {selectedCoop.member_count} Total
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Pendapatan Tahunan</span>
                    <span className="text-slate-800 font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-slate-400" /> Rp {selectedCoop.annual_revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Komoditas Utama</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedCoop.commodities.map(c => (
                        <span key={c.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                          <Compass className="h-3 w-3 text-brand-orange" /> {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-slate-400 italic">
                    Pilih baris tabel di bawah untuk melihat detail penilaian koperasi lainnya.
                  </p>
                  <Link
                    href={`/insights?coopId=${selectedCoop.id}`}
                    className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
                  >
                    <Lightbulb className="h-4 w-4 text-brand-orange" /> Buka Diagnosis AI Insights &rarr;
                  </Link>
                </div>

              </CardContent>
            </Card>
          )}
        </div>

        {/* National Rankings Table */}
        {userData?.role === 'admin' && (
          <Card className="border-slate-200/80 bg-white">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Peringkat Nasional Koperasi
              </CardTitle>
              <CardDescription>
                Seluruh koperasi terdaftar yang telah dinilai secara nasional berdasarkan algoritma pembobotan.
              </CardDescription>
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari koperasi atau provinsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Nama Koperasi</th>
                  <th className="p-4">Provinsi</th>
                  <th className="p-4 text-center">Keaktifan</th>
                  <th className="p-4 text-right">Pendapatan (IDR)</th>
                  <th className="p-4 text-center">Skor</th>
                  <th className="p-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRankings.map((coop) => {
                  const isSelected = coop.id === selectedId;
                  const score = coop.score;
                  const grade = score?.grade || 'D';
                  const rankIndex = rankedCoops.findIndex(x => x.id === coop.id) + 1;

                  return (
                    <tr
                      key={coop.id}
                      onClick={() => setSelectedId(coop.id)}
                      className={`cursor-pointer transition-colors duration-150 hover:bg-slate-50/50 ${
                        isSelected ? 'bg-brand-cream/40 font-semibold' : ''
                      }`}
                    >
                      <td className="p-4 text-center font-bold text-slate-400">
                        {rankIndex}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 block text-sm">{coop.name}</span>
                        <span className="text-xs text-slate-400 font-medium mt-0.5 block">{coop.city}</span>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{coop.province}</td>
                      <td className="p-4 text-center text-slate-600 font-semibold">
                        {coop.member_count ? Math.round(((coop.active_members || 0) / coop.member_count) * 100) : 0}%
                      </td>
                      <td className="p-4 text-right text-slate-600 font-bold">
                        Rp {(coop.annual_revenue || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center font-black text-brand-navy text-sm">
                        {score?.final_score || 0}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block font-extrabold text-[10px] px-2.5 py-1 rounded-full text-white ${
                          grade === 'A' ? 'bg-emerald-500' :
                          grade === 'B' ? 'bg-blue-500' :
                          grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
        )}

      </div>
    </div>
  );
}

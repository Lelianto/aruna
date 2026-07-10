'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CooperativeWithCommodities, Insight } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, AlertCircle, ShieldAlert,
  Search, Info, Building2, MapPin, Award
} from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface InsightsClientProps {
  cooperatives: CooperativeWithCommodities[];
  initialCoopId?: string;
}

export default function InsightsClient({ cooperatives, initialCoopId }: InsightsClientProps) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [selectedCoopId, setSelectedCoopId] = useState<string>(
    initialCoopId || 'all'
  );
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      if (!user || !userData || (userData.role !== 'admin' && userData.role !== 'koperasi' && userData.role !== 'pemerintah')) {
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  // Force selected cooperative to their own associated ID if role is koperasi
  useEffect(() => {
    if (userData?.role === 'koperasi' && userData.associatedId) {
      setSelectedCoopId(userData.associatedId);
    }
  }, [userData]);

  if (loading || !user || !userData || (userData.role !== 'admin' && userData.role !== 'koperasi' && userData.role !== 'pemerintah')) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-[#faf9f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-bold">Memuat...</p>
        </div>
      </div>
    );
  }

  // Handle case where cooperative user has no associated cooperative data
  if (userData?.role === 'koperasi' && !userData.associatedId) {
    return (
      <div className="page-shell flex-1 py-8 bg-[#faf9f6]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-brand-red" /> Analisis AI Insights
            </h1>
          </div>
          <Card className="border-slate-200/80 bg-white p-8 text-center">
            <p className="text-sm font-bold text-slate-500">Akun Anda belum ditautkan ke data koperasi terdaftar. Silakan hubungi Admin ARUNA.</p>
          </Card>
        </div>
      </div>
    );
  }

  const coopOptions = useMemo(() => {
    return [
      { value: 'all', label: `Semua Koperasi (${cooperatives.length})` },
      ...cooperatives.map(c => ({ value: c.id, label: c.name }))
    ];
  }, [cooperatives]);

  const severityOptions = [
    { value: 'all', label: 'Semua Tingkat' },
    { value: 'Kritis', label: 'Kritis' },
    { value: 'Peringatan', label: 'Peringatan' },
    { value: 'Info', label: 'Info' }
  ];

  // 1. Gather all insights nationally
  const allInsights = useMemo(() => {
    const list: Array<Insight & { coopName: string; province: string; city: string }> = [];
    cooperatives.forEach(coop => {
      if (coop.insights) {
        coop.insights.forEach(ins => {
          list.push({
            ...ins,
            coopName: coop.name,
            province: coop.province,
            city: coop.city
          });
        });
      }
    });
    return list;
  }, [cooperatives]);

  // 2. Calculate National Alerts Count
  const severityCounts = useMemo(() => {
    const counts = { Kritis: 0, Peringatan: 0, Info: 0 };
    allInsights.forEach(ins => {
      if (ins.severity === 'Kritis') counts.Kritis++;
      else if (ins.severity === 'Peringatan') counts.Peringatan++;
      else if (ins.severity === 'Info') counts.Info++;
    });
    return counts;
  }, [allInsights]);

  // 3. Filtered Insights for display
  const filteredInsights = useMemo(() => {
    return allInsights.filter(ins => {
      const matchCoop = selectedCoopId === 'all' || ins.cooperative_id === selectedCoopId;
      const matchSeverity = selectedSeverity === 'all' || ins.severity === selectedSeverity;
      const matchSearch = searchQuery === '' || 
        ins.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ins.coopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCoop && matchSeverity && matchSearch;
    });
  }, [allInsights, selectedCoopId, selectedSeverity, searchQuery]);

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-brand-orange" /> Rekomendasi & AI Insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis diagnostik otomatis menggunakan 10+ aturan kepatuhan koperasi nasional.
          </p>
        </div>

        {/* National Alerts Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center text-brand-red">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Diagnosis Kritis</span>
                <span className="text-xl font-black text-brand-red">
                  {severityCounts.Kritis} Temuan
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center text-brand-orange">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Peringatan</span>
                <span className="text-xl font-black text-brand-orange">
                  {severityCounts.Peringatan} Isu
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Rekomendasi</span>
                <span className="text-xl font-black text-blue-600">
                  {severityCounts.Info} Peluang
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls Box */}
        <Card className="border-slate-200/80 p-5 mb-8 bg-white shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

            {/* Search */}
            <div className="relative col-span-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari insight, nama koperasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>
            </div>

            {/* Cooperative Filter */}
            {userData?.role === 'admin' && (
              <CustomSelect
                label="Koperasi"
                options={coopOptions}
                value={selectedCoopId}
                onChange={(val) => setSelectedCoopId(val)}
              />
            )}

            {/* Severity Filter */}
            <CustomSelect
              label="Tingkat Isu"
              options={severityOptions}
              value={selectedSeverity}
              onChange={(val) => setSelectedSeverity(val)}
            />

          </div>
        </Card>

        {/* Insights Results List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Diagnosis AI Insights</span>
            <span className="text-brand-red font-bold">{filteredInsights.length} Insight Temuan</span>
          </div>

          {filteredInsights.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-400">
              Tidak ada diagnosis yang cocok dengan filter saat ini.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredInsights.map(ins => {
                const isCritical = ins.severity === 'Kritis';
                const isWarning = ins.severity === 'Peringatan';

                return (
                  <Card
                    key={ins.id}
                    className={`border-l-4 hover:shadow-md transition-shadow bg-white ${
                      isCritical ? 'border-l-red-500 border-red-200' :
                      isWarning ? 'border-l-amber-500 border-amber-200' :
                      'border-l-blue-500 border-blue-200'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider truncate max-w-[200px]">
                            {ins.coopName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            isCritical ? 'destructive' :
                            isWarning ? 'warning' : 'secondary'
                          }
                          className="text-[10px] px-2.5 py-0.5"
                        >
                          {ins.severity}
                        </Badge>
                      </div>

                      <CardTitle className="text-base font-black text-slate-900 mt-2">
                        {ins.title}
                      </CardTitle>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{ins.city}, {ins.province}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 space-y-3 text-xs text-slate-600">
                      {/* Description */}
                      <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600">
                        {ins.description}
                      </p>

                      {/* Recommendation */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                          Rekomendasi Tindakan:
                        </span>
                        <div className="p-3 bg-brand-cream/30 rounded-lg border border-brand-navy/5 flex items-start gap-2">
                          <Lightbulb className="h-4.5 w-4.5 text-brand-orange flex-shrink-0 mt-0.5" />
                          <span className="font-semibold text-xs text-slate-700 leading-relaxed">
                            {ins.recommendation}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/scoring?coopId=${ins.cooperative_id}`}
                          className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
                        >
                          <Award className="h-4 w-4" /> Buka Skor Koperasi &rarr;
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

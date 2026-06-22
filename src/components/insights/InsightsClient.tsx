'use client';

import React, { useState, useMemo } from 'react';
import { CooperativeWithCommodities, Insight } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, AlertCircle, ShieldAlert,
  Search, Info, Building2, MapPin
} from 'lucide-react';
import Link from 'next/link';

interface InsightsClientProps {
  cooperatives: CooperativeWithCommodities[];
  initialCoopId?: string;
}

export default function InsightsClient({ cooperatives, initialCoopId }: InsightsClientProps) {
  const [selectedCoopId, setSelectedCoopId] = useState<string>(
    initialCoopId || 'all'
  );
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    <div className="page-shell flex-1 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-brand-orange" /> Rekomendasi & AI Insights
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analisis diagnostik otomatis menggunakan 10+ aturan kepatuhan koperasi nasional.
          </p>
        </div>

        {/* National Alerts Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-brand-red">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Diagnosis Kritis</span>
                <span className="text-xl font-black text-brand-red">
                  {severityCounts.Kritis} Temuan
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-brand-orange">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Peringatan</span>
                <span className="text-xl font-black text-brand-orange">
                  {severityCounts.Peringatan} Isu
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Rekomendasi</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {severityCounts.Info} Peluang
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls Box */}
        <Card className="border-slate-200 dark:border-slate-800 p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

            {/* Search */}
            <div className="relative col-span-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari insight, nama koperasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
                />
              </div>
            </div>

            {/* Cooperative Filter */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Koperasi</label>
              <select
                value={selectedCoopId}
                onChange={(e) => setSelectedCoopId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
              >
                <option value="all">Semua ({cooperatives.length})</option>
                {cooperatives.map(coop => (
                  <option key={coop.id} value={coop.id}>{coop.name}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tingkat</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
              >
                <option value="all">Semua Tingkat</option>
                <option value="Kritis">Kritis</option>
                <option value="Peringatan">Peringatan</option>
                <option value="Info">Info</option>
              </select>
            </div>

          </div>
        </Card>

        {/* Insights Results List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-bold text-slate-500">
            <span>Laporan Diagnostik</span>
            <span className="text-brand-red">{filteredInsights.length} Insight</span>
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
                    className={`border-l-4 hover:shadow-md transition-shadow ${
                      isCritical ? 'border-l-red-500 border-red-200 dark:border-red-900/50' :
                      isWarning ? 'border-l-amber-500 border-amber-200 dark:border-amber-900/50' :
                      'border-l-blue-500 border-blue-200 dark:border-blue-900/50'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase truncate max-w-[200px]">
                            {ins.coopName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            isCritical ? 'destructive' :
                            isWarning ? 'warning' : 'secondary'
                          }
                          className="text-xs px-2.5 py-0.5"
                        >
                          {ins.severity}
                        </Badge>
                      </div>

                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-2">
                        {ins.title}
                      </CardTitle>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{ins.city}, {ins.province}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                      {/* Description */}
                      <p className="leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {ins.description}
                      </p>

                      {/* Recommendation */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-500 block uppercase">
                          Rekomendasi:
                        </span>
                        <div className="p-3 bg-brand-navy/5 dark:bg-brand-navy/10 rounded-lg border border-brand-navy/10 dark:border-brand-navy/20 flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-brand-orange flex-shrink-0 mt-0.5" />
                          <span className="font-medium text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {ins.recommendation}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Link
                          href={`/scoring?coopId=${ins.cooperative_id}`}
                          className="text-xs font-bold text-brand-red hover:underline"
                        >
                          Buka Skor Koperasi &rarr;
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

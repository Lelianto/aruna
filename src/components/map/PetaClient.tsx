'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CooperativeWithCommodities } from '@/types';
import MapWrapper from '@/components/map/MapWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Compass, Layers, ArrowLeft, Award, Lightbulb, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface PetaClientProps {
  cooperatives: CooperativeWithCommodities[];
  provinces: string[];
  commodityNames: string[];
}

// Visual mini Progress Ring for ARUNA Score
function ProgressRing({ value, size = 64, strokeWidth = 6, colorClass = 'stroke-primary' }: { value: number, size?: number, strokeWidth?: number, colorClass?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="stroke-slate-100"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-500 ease-out`}
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
        <span className="text-[11px] font-black text-slate-800 leading-none">{value}</span>
      </div>
    </div>
  );
}

export default function PetaClient({ cooperatives, provinces, commodityNames }: PetaClientProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCoopId, setSelectedCoopId] = useState<string | undefined>(undefined);

  // Gemini AI Insights state
  const [geminiInsights, setGeminiInsights] = useState<Record<string, { summary: string; analysis: string[]; recommendations: string[] }>>({});
  const [loadingGemini, setLoadingGemini] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedCoopId && !geminiInsights[selectedCoopId]) {
      const fetchAiInsights = async () => {
        setLoadingGemini(prev => ({ ...prev, [selectedCoopId]: true }));
        try {
          const res = await fetch(`/api/ai-insights?cooperativeId=${selectedCoopId}`);
          if (res.ok) {
            const data = await res.json();
            setGeminiInsights(prev => ({ ...prev, [selectedCoopId]: data }));
          }
        } catch (err) {
          console.error("Error fetching Gemini insights:", err);
        } finally {
          setLoadingGemini(prev => ({ ...prev, [selectedCoopId]: false }));
        }
      };
      fetchAiInsights();
    }
  }, [selectedCoopId, geminiInsights]);

  const provinceOptions = useMemo(() => {
    const toTitleCase = (str: string) =>
      str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      { value: 'all', label: 'Semua Provinsi' },
      ...provinces.map(prov => ({ value: prov, label: toTitleCase(prov) }))
    ];
  }, [provinces]);

  const commodityOptions = useMemo(() => {
    const toTitleCase = (str: string) =>
      str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      { value: 'all', label: 'Semua Komoditas' },
      ...commodityNames.map(com => ({ value: com, label: toTitleCase(com) }))
    ];
  }, [commodityNames]);

  // Apply filters
  const filteredCooperatives = useMemo(() => {
    return cooperatives.filter(coop => {
      const matchProvince = selectedProvince === 'all' || coop.province === selectedProvince;
      const matchCommodity = selectedCommodity === 'all' || coop.commodities.some(c => c.name === selectedCommodity);
      const matchSearch = searchQuery === '' || 
        coop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        coop.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchProvince && matchCommodity && matchSearch;
    });
  }, [cooperatives, selectedProvince, selectedCommodity, searchQuery]);

  // Selected cooperative detail inspection
  const selectedCoop = useMemo(() => {
    if (!selectedCoopId) return null;
    return cooperatives.find(c => c.id === selectedCoopId) || null;
  }, [selectedCoopId, cooperatives]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100dvh-68px)] overflow-hidden">

      {/* Sidebar - Controls and List */}
      <div className="w-full md:w-[380px] lg:w-[420px] border-r border-slate-200 bg-white flex flex-col shrink-0 h-[45dvh] md:h-full overflow-hidden shadow-sm">
        
        {/* If a cooperative is selected, show its Inspector Panel in the sidebar */}
        {selectedCoop ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fcfbf9]">
            
            {/* Inspector Header */}
            <div className="p-4 border-b border-slate-200/80 bg-white flex items-center justify-between">
              <button 
                onClick={() => setSelectedCoopId(undefined)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
              </button>
              <Badge variant="outline" className="border-brand-navy/15 font-bold text-[10px] text-brand-navy">
                Detail Koperasi
              </Badge>
            </div>

            {/* Scrollable Inspector Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {/* Title & Info */}
              <div className="space-y-2">
                <span className="text-[10px] bg-brand-navy text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {selectedCoop.province}
                </span>
                <h3 className="text-base font-black text-brand-navy leading-snug">
                  {selectedCoop.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <MapPin className="h-4 w-4 text-brand-red/70" />
                  <span>{selectedCoop.city}, {selectedCoop.province}</span>
                </div>
              </div>

              {/* ARUNA Score Panel */}
              <div className="bg-white border rounded-xl p-3.5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-navy flex items-center gap-1">
                    <Award className="h-4.5 w-4.5 text-brand-red" /> Kesiapan ARUNA Score
                  </span>
                  <span className={`font-black text-xs px-2.5 py-0.5 rounded text-white ${
                    selectedCoop.score?.grade === 'A' ? 'bg-emerald-500' :
                    selectedCoop.score?.grade === 'B' ? 'bg-blue-500' :
                    selectedCoop.score?.grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    Grade {selectedCoop.score?.grade}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 justify-items-center">
                  <div className="flex flex-col items-center">
                    <ProgressRing value={selectedCoop.score?.final_score || 0} size={44} strokeWidth={4.5} colorClass="stroke-brand-red" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Final</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing value={selectedCoop.score?.health_score || 0} size={44} strokeWidth={4.5} colorClass="stroke-emerald-500" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Aktif</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing value={selectedCoop.score?.growth_score || 0} size={44} strokeWidth={4.5} colorClass="stroke-blue-500" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Keu</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing value={selectedCoop.score?.supply_score || 0} size={44} strokeWidth={4.5} colorClass="stroke-brand-orange" />
                    <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Panen</span>
                  </div>
                </div>
              </div>

              {/* Commodities & Stock List */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  Komoditas & Ketersediaan Stok
                </span>
                <div className="bg-white border rounded-xl divide-y shadow-sm">
                  {selectedCoop.commodities.map(com => (
                    <div key={com.id} className="p-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-brand-orange shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">{com.name}</p>
                          <p className="text-[10px] text-slate-400">Cap: {com.monthly_capacity} t/bln</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-brand-red text-sm">{com.available_stock} {com.unit}</span>
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Ready stok</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights alert callouts */}
              {selectedCoop.insights && selectedCoop.insights.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                    Temuan AI & Diagnosis Masalah
                  </span>
                  <div className="space-y-2">
                    {selectedCoop.insights.map(ins => (
                      <div 
                        key={ins.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed flex gap-2 items-start shadow-xs ${
                          ins.severity === 'Kritis' ? 'bg-red-50/50 border-red-200 text-red-800' :
                          ins.severity === 'Peringatan' ? 'bg-amber-50/50 border-amber-200 text-amber-800' :
                          'bg-blue-50/50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <Lightbulb className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                          ins.severity === 'Kritis' ? 'text-brand-red' :
                          ins.severity === 'Peringatan' ? 'text-brand-orange' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="font-bold text-slate-800">{ins.title}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5">{ins.description}</p>
                          <p className="text-brand-navy font-bold mt-1 text-[11px]">Rekomendasi: {ins.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gemini AI Smart Advisor */}
              <div className="bg-brand-cream/55 border border-brand-navy/15 rounded-xl p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-brand-navy text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider block">
                    Gemini AI Smart Advisor
                  </span>
                  {loadingGemini[selectedCoop.id] && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-ping shrink-0"></span>
                  )}
                </div>

                {loadingGemini[selectedCoop.id] ? (
                  <div className="space-y-2 py-2">
                    <div className="h-2.5 bg-slate-200 rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-2.5 bg-slate-200 rounded-full w-5/6 animate-pulse"></div>
                    <div className="h-2.5 bg-slate-200 rounded-full w-2/3 animate-pulse"></div>
                  </div>
                ) : geminiInsights[selectedCoop.id] ? (
                  <div className="space-y-2.5 text-xs">
                     <p className="font-semibold text-slate-800 italic leading-relaxed">
                       &ldquo;{geminiInsights[selectedCoop.id].summary}&rdquo;
                     </p>
                     
                     <div className="space-y-1">
                       <span className="text-[9px] font-black text-slate-400 block uppercase">Temuan Kendala</span>
                       <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px] leading-relaxed">
                         {geminiInsights[selectedCoop.id].analysis.map((pt, idx) => (
                           <li key={idx}>{pt}</li>
                         ))}
                       </ul>
                     </div>

                     <div className="space-y-1">
                       <span className="text-[9px] font-black text-slate-400 block uppercase">Rekomendasi Gotong Royong</span>
                       <ul className="list-disc pl-4 space-y-0.5 text-brand-navy text-[11px] font-extrabold leading-relaxed">
                         {geminiInsights[selectedCoop.id].recommendations.map((rec, idx) => (
                           <li key={idx}>{rec}</li>
                         ))}
                       </ul>
                     </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic font-medium">Gagal memuat rekomendasi AI. Harap cek kunci API Anda.</p>
                )}
              </div>

              {/* Deep Analysis Navigation Links */}
              <div className="pt-2 flex gap-2">
                <Link href={`/scoring?coopId=${selectedCoop.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full text-xs font-bold border-brand-navy/15 hover:bg-brand-navy hover:text-white">
                    Peringkat Nasional
                  </Button>
                </Link>
                <Link href="/marketplace" className="flex-1">
                  <Button size="sm" className="w-full text-xs font-bold bg-brand-red hover:bg-brand-red/90 text-white">
                    Proses Transaksi
                  </Button>
                </Link>
              </div>

            </div>

          </div>
        ) : (
          /* Normal Cooperative List Panel */
          <>
            {/* Filters Box */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <h2 className="text-base font-extrabold text-brand-navy flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-brand-red" /> Peta Potensi Komoditas
              </h2>
              
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari koperasi atau kota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Province Selector */}
                <CustomSelect
                  label="Provinsi"
                  options={provinceOptions}
                  value={selectedProvince}
                  onChange={(val) => {
                    setSelectedProvince(val);
                    setSelectedCoopId(undefined); // Reset focus
                  }}
                />

                {/* Commodity Selector */}
                <CustomSelect
                  label="Komoditas"
                  options={commodityOptions}
                  value={selectedCommodity}
                  onChange={(val) => {
                    setSelectedCommodity(val);
                    setSelectedCoopId(undefined); // Reset focus
                  }}
                />
              </div>
            </div>

            {/* Scrollable Cooperatives List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 px-1">
                <span>Daftar Koperasi</span>
                <span className="text-brand-red">{filteredCooperatives.length} Hasil</span>
              </div>

              {filteredCooperatives.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400 font-medium">
                  Tidak ada koperasi yang memenuhi kriteria filter.
                </div>
              ) : (
                filteredCooperatives.map(coop => {
                  const isSelected = coop.id === selectedCoopId;
                  const grade = coop.score?.grade || 'D';

                  return (
                    <Card
                      key={coop.id}
                      onClick={() => setSelectedCoopId(coop.id)}
                      className={`cursor-pointer transition-all duration-200 border bg-white ${
                        isSelected
                          ? 'border-brand-navy ring-1 ring-brand-navy/30 bg-brand-navy/[0.02] shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-800 leading-snug">
                            {coop.name}
                          </h4>
                          <Badge
                            variant={
                              grade === 'A' ? 'success' :
                              grade === 'B' ? 'default' :
                              grade === 'C' ? 'warning' : 'destructive'
                            }
                            className="text-[10px] px-2 py-0.5 shrink-0"
                          >
                            {grade}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-brand-red/60" />
                          <span>{coop.city}, {coop.province}</span>
                        </div>

                        {/* Commodities overview */}
                        <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-1.5">
                          {coop.commodities.slice(0, 2).map(com => (
                            <span
                              key={com.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                            >
                              <Compass className="h-3 w-3 text-brand-orange" />
                              {com.name}: {com.available_stock} {com.unit}
                            </span>
                          ))}
                          {coop.commodities.length > 2 && (
                            <span className="text-[11px] text-slate-400 font-medium self-center">
                              +{coop.commodities.length - 2} lagi
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Map Area — fills all remaining space, never scrolls */}
      <div className="flex-1 min-w-0 h-[55dvh] md:h-full bg-slate-200 relative overflow-hidden">
        <MapWrapper 
          cooperatives={filteredCooperatives} 
          selectedCoopId={selectedCoopId}
        />
      </div>

    </div>
  );
}

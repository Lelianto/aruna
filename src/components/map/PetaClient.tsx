'use client';

import React, { useState, useMemo } from 'react';
import { CooperativeWithCommodities } from '@/types';
import MapWrapper from '@/components/map/MapWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Compass, Layers } from 'lucide-react';

interface PetaClientProps {
  cooperatives: CooperativeWithCommodities[];
  provinces: string[];
  commodityNames: string[];
}

export default function PetaClient({ cooperatives, provinces, commodityNames }: PetaClientProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCoopId, setSelectedCoopId] = useState<string | undefined>(undefined);

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

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100dvh-68px)] overflow-hidden">

      {/* Sidebar - Controls and List */}
      <div className="w-full md:w-[380px] lg:w-[420px] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 flex flex-col h-[45%] md:h-full">
        
        {/* Filters Box */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-900 space-y-3">
          <h2 className="text-base font-extrabold text-brand-navy dark:text-white flex items-center gap-1.5">
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
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Province Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Provinsi</label>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedCoopId(undefined); // Reset focus
                }}
                className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Provinsi</option>
                {provinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* Commodity Selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Komoditas</label>
              <select
                value={selectedCommodity}
                onChange={(e) => {
                  setSelectedCommodity(e.target.value);
                  setSelectedCoopId(undefined); // Reset focus
                }}
                className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Komoditas</option>
                {commodityNames.map(com => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Cooperatives List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900/30">
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
                  className={`cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? 'border-brand-navy ring-1 ring-brand-navy/30 bg-brand-navy/[0.03] shadow-md dark:border-brand-red dark:ring-brand-red/30 dark:bg-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900'
                  }`}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-snug">
                        {coop.name}
                      </h4>
                      <Badge
                        variant={
                          grade === 'A' ? 'success' :
                          grade === 'B' ? 'default' :
                          grade === 'C' ? 'warning' : 'destructive'
                        }
                        className="text-[11px] px-2 py-0.5 shrink-0"
                      >
                        {grade}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-brand-red/60" />
                      <span>{coop.city}, {coop.province}</span>
                    </div>

                    {/* Commodities overview */}
                    <div className="flex flex-wrap gap-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                      {coop.commodities.slice(0, 2).map(com => (
                        <span
                          key={com.id}
                          className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded"
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
      </div>

      {/* Map Area */}
      <div className="flex-1 h-[55%] md:h-full bg-slate-200 dark:bg-slate-950 relative">
        <MapWrapper 
          cooperatives={filteredCooperatives} 
          selectedCoopId={selectedCoopId}
        />
      </div>

    </div>
  );
}

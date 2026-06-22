'use client';

import React from 'react';
import { MarketRequestWithBuyer, CooperativeWithCommodities } from '@/types';
import { MatchmakingResult } from '@/lib/services/supply-engine';
import { Badge } from '@/components/ui/badge';
import MapWrapper from '@/components/map/MapWrapper';
import { 
  ArrowLeft, Building2, MapPin, Compass, 
  CheckCircle2, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface MatchDetailsClientProps {
  request: MarketRequestWithBuyer;
  result: MatchmakingResult;
  cooperatives: CooperativeWithCommodities[];
  buyerCoords: { lat: number; lng: number };
}

export default function MatchDetailsClient({
  request,
  result,
  cooperatives,
  buyerCoords
}: MatchDetailsClientProps) {
  const percentFulfilled = Math.min(100, Math.round((result.total_allocated / request.quantity) * 100));

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100dvh-68px)] overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* Sidebar Panel - Left Column */}
      <div className="w-full md:w-[460px] lg:w-[500px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-[45%] md:h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          
          {/* Back Button */}
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Marketplace
          </Link>

          {/* Offtaker Info Card */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-navy/10 flex items-center justify-center text-brand-navy dark:bg-brand-navy/40 dark:text-slate-200">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase block">Offtaker / Buyer</span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {request.buyer.company_name}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-brand-red/60" /> {request.buyer.city}
              </span>
              <span className="text-slate-300">|</span>
              <span>Sektor {request.buyer.industry}</span>
            </div>
          </div>

          {/* Commodity Demand Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Permintaan Komoditas</span>
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-brand-orange text-brand-orange">
                Gotong Royong
              </Badge>
            </div>
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <Compass className="h-6 w-6 text-brand-red" />
                <span className="text-base font-bold text-slate-800 dark:text-white">
                  {request.commodity_name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Kebutuhan Kuota</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {request.quantity} {request.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Engine Result Status */}
          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Status Supply Engine</span>

            {result.is_fully_satisfied ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400 rounded-xl flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Terpenuhi Gotong Royong</h4>
                  <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed mt-0.5">
                    <span className="font-bold">{result.matches.length} koperasi</span> berkolaborasi menyuplai target {request.quantity} ton.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400 rounded-xl flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Terpenuhi Sebagian</h4>
                  <p className="text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed mt-0.5">
                    Stok tersedia {result.total_allocated} ton. Perlu kemitraan tambahan.
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Teragregasi: {result.total_allocated} {request.unit}</span>
                <span>{percentFulfilled}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-brand-red h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percentFulfilled}%` }}
                />
              </div>
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Alokasi Pasok Gotong Royong</span>

            {result.matches.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Tidak ada pasokan yang cocok ditemukan.</p>
            ) : (
              <div className="space-y-2">
                {result.matches.map((match) => (
                  <div key={match.cooperative.id} className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-brand-navy/50 hover:shadow-sm transition-all duration-200 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block font-bold text-xs px-1.5 py-0.5 rounded text-white ${
                            match.score.grade === 'A' ? 'bg-emerald-500' :
                            match.score.grade === 'B' ? 'bg-blue-500' :
                            match.score.grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            {match.score.grade}
                          </span>
                          <Link href={`/scoring?coopId=${match.cooperative.id}`} className="font-semibold text-sm text-slate-800 hover:text-brand-red hover:underline dark:text-slate-200">
                            {match.cooperative.name}
                          </Link>
                        </div>
                        <span className="text-xs text-slate-400 block mt-1">
                          {match.cooperative.city}, {match.cooperative.province}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Kirim</span>
                        <span className="font-black text-base text-brand-red">
                          {match.allocated_quantity} {request.unit}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          dari stok {match.commodity.available_stock} t
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Map Panel - Right Column */}
      <div className="flex-1 h-[55%] md:h-full bg-slate-200 dark:bg-slate-950 relative">
        <MapWrapper
          cooperatives={cooperatives}
          buyerLocation={{
            latitude: buyerCoords.lat,
            longitude: buyerCoords.lng,
            company_name: request.buyer.company_name,
            name: request.buyer.city
          }}
          connections={result.matches.map(m => ({
            coopId: m.cooperative.id,
            allocated_quantity: m.allocated_quantity
          }))}
          zoom={5}
        />
      </div>

    </div>
  );
}

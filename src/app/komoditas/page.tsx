'use client';

import React, { useEffect, useState } from 'react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { commodityRepository } from '@/lib/repositories/commodity.repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion } from '@/components/ui/accordion';
import { Compass, Home, MapPin, Layers, ShieldAlert, Coins } from 'lucide-react';
import Link from 'next/link';

interface SupplierDetail {
  coopId: string;
  commodityId: string;
  name: string;
  city: string;
  province: string;
  stock: number;
  capacity: number;
  grade: string;
  price: number;
  minimumStock: number;
}

interface CommodityAggregate {
  name: string;
  category: string;
  totalCapacity: number;
  totalStock: number;
  unit: string;
  coopCount: number;
  provinces: string[];
  suppliers: SupplierDetail[];
}

export default function KomoditasPage() {
  const [aggregates, setAggregates] = useState<CommodityAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cooperatives, commodities] = await Promise.all([
          cooperativeRepository.getAllWithDetails(),
          commodityRepository.getAll()
        ]);

        // Aggregate commodities by name
        const aggregatesMap: Record<string, CommodityAggregate> = {};

        commodities.forEach(com => {
          const coop = cooperatives.find(c => c.id === com.cooperative_id);
          if (!coop) return;

          if (!aggregatesMap[com.name]) {
            aggregatesMap[com.name] = {
              name: com.name,
              category: com.category,
              totalCapacity: 0,
              totalStock: 0,
              unit: com.unit,
              coopCount: 0,
              provinces: [],
              suppliers: []
            };
          }

          const agg = aggregatesMap[com.name];
          agg.totalCapacity += com.monthly_capacity;
          agg.totalStock += com.available_stock;
          agg.coopCount += 1;

          if (!agg.provinces.includes(coop.province)) {
            agg.provinces.push(coop.province);
          }

          agg.suppliers.push({
            coopId: coop.id,
            commodityId: com.id,
            name: coop.name,
            city: coop.city,
            province: coop.province,
            stock: com.available_stock,
            capacity: com.monthly_capacity,
            grade: coop.score?.grade || 'D',
            price: com.price_per_unit || 12000,
            minimumStock: com.minimum_stock || 0
          });
        });

        // Convert map to sorted array
        const sortedAggregates = Object.values(aggregatesMap).sort((a, b) => b.totalCapacity - a.totalCapacity);
        setAggregates(sortedAggregates);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // General statistics
  const totalCapacityAll = aggregates.reduce((sum, a) => sum + a.totalCapacity, 0);
  const totalStockAll = aggregates.reduce((sum, a) => sum + a.totalStock, 0);

  if (loading) {
    return (
      <div className="page-shell flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-slate-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
            <Compass className="h-8 w-8 text-brand-red" /> Sebaran Komoditas Nasional
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring kapasitas produksi bulanan, rata-rata harga, dan ketersediaan stok pangan serta perkebunan rakyat di seluruh wilayah Nusantara.
          </p>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-navy/10 flex items-center justify-center text-brand-navy">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Kapasitas Nasional</span>
                <span className="text-xl font-semibold text-slate-900">
                  {Math.round(totalCapacityAll).toLocaleString('id-ID')} Ton/Bln
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Stok Siap Distribusi</span>
                <span className="text-xl font-semibold text-brand-orange">
                  {Math.round(totalStockAll).toLocaleString('id-ID')} Ton
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Komoditas Terpetakan</span>
                <span className="text-xl font-semibold text-brand-red">
                  {aggregates.length} Varietas
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commodities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {aggregates.map(agg => {
            // Compute average price for this aggregate
            const totalPrices = agg.suppliers.reduce((sum, s) => sum + s.price, 0);
            const avgPrice = agg.suppliers.length > 0 ? Math.round(totalPrices / agg.suppliers.length) : 0;

            return (
              <Card key={agg.name} className="border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white">
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                      {agg.category}
                    </span>
                    <CardTitle className="text-base font-semibold text-slate-900 mt-2">
                      {agg.name}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">Kapasitas/Bln</span>
                    <span className="text-sm font-semibold text-brand-red">
                      {Math.round(agg.totalCapacity).toLocaleString('id-ID')} {agg.unit}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Stok Tersedia</span>
                      <span className="font-semibold text-slate-800">
                        {Math.round(agg.totalStock).toLocaleString('id-ID')} {agg.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Rata-rata Harga</span>
                      <span className="font-semibold text-brand-orange">
                        Rp {avgPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Koperasi Penyedia</span>
                      <span className="font-semibold text-slate-800">
                        {agg.coopCount} Mitra
                      </span>
                    </div>
                  </div>

                  {/* Sebaran Wilayah */}
                  <Accordion title="Sebaran Geografis" count={agg.provinces.length} countLabel="Wilayah">
                    <div className="flex flex-wrap gap-1.5">
                      {agg.provinces.map(prov => (
                        <span
                          key={prov}
                          className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-205 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold"
                        >
                          <MapPin className="h-3 w-3 text-brand-orange" />
                          {prov}
                        </span>
                      ))}
                    </div>
                  </Accordion>

                  {/* Suppliers List */}
                  <div className="border-t border-slate-100 pt-3">
                    <Accordion title="Daftar Koperasi Mitra" count={agg.coopCount}>
                      {agg.suppliers.map(sup => {
                        const isLow = sup.stock <= sup.minimumStock;
                        return (
                          <div key={`${sup.coopId}-${sup.commodityId}`} className="flex justify-between items-center text-xs p-2.5 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block font-semibold text-[9px] px-1.5 py-0.5 rounded text-white ${sup.grade === 'A' ? 'bg-emerald-500' :
                                sup.grade === 'B' ? 'bg-blue-500' :
                                  sup.grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                                }`}>
                                {sup.grade}
                              </span>
                              <Link href={`/scoring?coopId=${sup.coopId}`} className="font-semibold text-slate-700 hover:text-brand-red hover:underline">
                                {sup.name}
                              </Link>
                              <span className="text-[10px] text-slate-400 font-semibold">({sup.city})</span>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              {isLow && (
                                <span className="text-[9px] font-semibold text-brand-red bg-red-50 border border-red-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                  <ShieldAlert className="h-3 w-3" /> Stok Kritis
                                </span>
                              )}
                              <div className="text-right">
                                <span className="font-semibold text-slate-850">
                                  {Math.round(sup.stock).toLocaleString('id-ID')} {agg.unit}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">
                                  Rp {sup.price.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}

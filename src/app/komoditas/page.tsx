import React from 'react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { commodityRepository } from '@/lib/repositories/commodity.repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Compass, Home, MapPin, Layers } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

interface CommodityAggregate {
  name: string;
  category: string;
  totalCapacity: number;
  totalStock: number;
  unit: string;
  coopCount: number;
  provinces: string[];
  suppliers: Array<{
    coopId: string;
    name: string;
    city: string;
    province: string;
    stock: number;
    capacity: number;
    grade: string;
  }>;
}

export default async function KomoditasPage() {
  // Fetch data
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
      name: coop.name,
      city: coop.city,
      province: coop.province,
      stock: com.available_stock,
      capacity: com.monthly_capacity,
      grade: coop.score?.grade || 'D'
    });
  });

  // Convert map to sorted array
  const aggregates = Object.values(aggregatesMap).sort((a, b) => b.totalCapacity - a.totalCapacity);

  // General statistics
  const totalCapacityAll = aggregates.reduce((sum, a) => sum + a.totalCapacity, 0);
  const totalStockAll = aggregates.reduce((sum, a) => sum + a.totalStock, 0);

  return (
    <div className="page-shell flex-1 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Compass className="h-8 w-8 text-brand-red" /> Sebaran Komoditas Nasional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoring kapasitas produksi bulanan dan ketersediaan stok pangan serta perkebunan rakyat di seluruh wilayah Nusantara.
          </p>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-navy/10 flex items-center justify-center text-brand-navy">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Kapasitas Nasional</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {Math.round(totalCapacityAll).toLocaleString('id-ID')} Ton/Bln
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Stok Siap Distribusi</span>
                <span className="text-xl font-black text-brand-orange">
                  {Math.round(totalStockAll).toLocaleString('id-ID')} Ton
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-brand-red/10 flex items-center justify-center text-brand-red">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block uppercase">Komoditas Terpetakan</span>
                <span className="text-xl font-black text-brand-red">
                  {aggregates.length} Varietas
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commodities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {aggregates.map(agg => (
            <Card key={agg.name} className="border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                <div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold uppercase dark:bg-slate-800 dark:text-slate-400">
                    {agg.category}
                  </span>
                  <CardTitle className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    {agg.name}
                  </CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-bold">Kapasitas/Bln</span>
                  <span className="text-base font-black text-brand-red">
                    {agg.totalCapacity} {agg.unit}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs text-slate-500 block font-bold uppercase">Stok Tersedia</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {agg.totalStock} {agg.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-bold uppercase">Koperasi Penyedia</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {agg.coopCount} Mitra
                    </span>
                  </div>
                </div>

                {/* Sebaran Wilayah */}
                <div>
                  <span className="text-xs text-slate-500 font-bold block uppercase mb-2">Sebaran Geografis</span>
                  <div className="flex flex-wrap gap-1.5">
                    {agg.provinces.map(prov => (
                      <span
                        key={prov}
                        className="inline-flex items-center gap-1 text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                      >
                        <MapPin className="h-3 w-3 text-brand-orange" />
                        {prov}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suppliers List */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <span className="text-xs text-slate-500 font-bold block uppercase mb-2">Daftar Koperasi Mitra</span>
                  <div className="space-y-1.5">
                    {agg.suppliers.map(sup => (
                      <div key={sup.coopId} className="flex justify-between items-center text-sm p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block font-bold text-xs px-1.5 py-0.5 rounded text-white ${
                            sup.grade === 'A' ? 'bg-emerald-500' :
                            sup.grade === 'B' ? 'bg-blue-500' :
                            sup.grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            {sup.grade}
                          </span>
                          <Link href={`/scoring?coopId=${sup.coopId}`} className="font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-red hover:underline">
                            {sup.name}
                          </Link>
                          <span className="text-xs text-slate-400">({sup.city})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {sup.stock} {agg.unit}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            dari cap. {sup.capacity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}

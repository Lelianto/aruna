import React from 'react';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight, Building2, MapPin, Compass } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function MarketplacePage() {
  const requests = await marketRequestRepository.getAllWithBuyer();

  return (
    <div className="page-shell flex-1 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-brand-red" /> Kebutuhan Komoditas Nasional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftar permintaan komoditas dalam volume besar oleh pembeli siaga (offtaker) skala nasional.
          </p>
        </div>

        {/* Marketplace Info Board */}
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-lg bg-brand-navy p-5 text-white shadow-sm md:flex-row md:items-center">
          <div className="space-y-2">
            <span className="text-xs bg-brand-orange text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Cara Kerja
            </span>
            <h3 className="font-bold text-base">Gotong Royong Aggregator Supply Engine</h3>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Buka salah satu detail permintaan di bawah. Sistem akan secara otomatis menganalisis seluruh koperasi desa terdekat dan membagi kuota pengiriman secara gotong royong.
            </p>
          </div>
        </div>

        {/* Demand Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req) => {
            const status = req.status;

            return (
              <Card
                key={req.id}
              className="flex flex-col justify-between border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
              >
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[160px]">
                            {req.buyer.company_name}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium uppercase block">
                            {req.buyer.industry}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          status === 'Menunggu Pemenuhan' ? 'accent' : 'success'
                        }
                        className="text-xs px-2.5 py-0.5"
                      >
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    {/* Buyer location */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-brand-red/60" />
                      <span>Pabrik: {req.buyer.city}</span>
                    </div>

                    {/* Quantity Block */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Compass className="h-5 w-5 text-brand-red" />
                        <div>
                          <span className="text-xs text-slate-500 block font-bold uppercase">Komoditas</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {req.commodity_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block font-bold">Kuota</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {req.quantity} {req.unit}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/marketplace/${req.id}`} className="w-full">
                    <Button className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm flex items-center justify-center gap-2 py-2.5">
                      Analisis Gotong Royong <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}

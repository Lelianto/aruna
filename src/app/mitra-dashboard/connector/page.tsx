'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { Building2 } from 'lucide-react';

export default function ConnectorRoutePage() {
  const { userData } = useAuth();
  
  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">
              Connector Network & Collective Procurement
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan surplus komoditas dan ikuti pengadaan bersama tingkat nasional
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-5 text-xs font-semibold leading-relaxed">
          Modul Connector sekarang terintegrasi langsung di dalam menu kendali utama portal Anda untuk kemudahan akses.
          Silakan buka tab <strong>Connector & Pengadaan</strong> di <a href="/mitra-dashboard" className="text-brand-orange hover:underline font-extrabold">Portal Saya</a> untuk mengelola transfer stok dan bergabung dalam pengadaan massal.
        </div>
      </div>
    </div>
  );
}

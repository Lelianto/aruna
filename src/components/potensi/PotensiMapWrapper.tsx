'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const PotensiMapWrapper = dynamic(() => import('./PotensiMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl">
      <div className="pulsing-dot mb-3 bg-amber-500"></div>
      <p className="text-sm text-slate-500 font-medium animate-pulse">
        Memuat Peta Potensi Komoditas Nusantara...
      </p>
    </div>
  )
});

export default PotensiMapWrapper;

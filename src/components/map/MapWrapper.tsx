'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MapWrapper = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl dark:bg-slate-900/50 dark:border-slate-800/80">
      <div className="pulsing-dot mb-3"></div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
        Memuat Peta Potensi Komoditas Nusantara...
      </p>
    </div>
  )
});

export default MapWrapper;

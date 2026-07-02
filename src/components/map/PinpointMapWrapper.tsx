'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const PinpointMapWrapper = dynamic(() => import('./PinpointMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[180px] flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl">
      <div className="text-center space-y-1.5">
        <div className="h-6 w-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider animate-pulse">
          Memuat Peta Pinpoint...
        </p>
      </div>
    </div>
  )
});

export default PinpointMapWrapper;

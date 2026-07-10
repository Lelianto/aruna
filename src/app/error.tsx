'use client';

// Route-segment error boundary. Any uncaught render/runtime error in a page
// below the root layout is caught here and shown as a friendly, recoverable
// screen instead of a blank page — so a single failing component never breaks
// the whole app. The Navbar/footer from the root layout stay intact.

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for observability; avoid surfacing internals to the user.
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 bg-[#faf9f6]">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-brand-red">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-black text-slate-900">Terjadi Sedikit Kendala</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Halaman ini gagal dimuat. Data dan sesi Anda aman — silakan coba muat ulang.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-black text-white hover:bg-brand-navy/90 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" /> Beranda
          </Link>
        </div>
        {error?.digest && (
          <p className="text-[10px] text-slate-400 font-mono">Ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, needsRoleSelection, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public paths that do not require authentication
  const isPublicPath = pathname === '/' || pathname === '/pitch';

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-68px)] items-center justify-center bg-[#faf9f6]">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 border-4 border-brand-navy border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider animate-pulse">Menghubungkan sesi...</p>
        </div>
      </div>
    );
  }

  // If path is public, just render it
  if (isPublicPath) {
    return <>{children}</>;
  }

  // If user is not logged in, show premium access gate
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-68px)] bg-[#faf9f6] flex items-center justify-center px-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-white border border-slate-200/80 p-8 rounded-2xl shadow-md">
          <div className="h-16 w-16 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              Akses Terbatas: Harap Masuk
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Halaman Command Center ini memerlukan autentikasi resmi. Silakan masuk menggunakan akun Google Anda.
            </p>
          </div>

          <Button 
            onClick={signInWithGoogle}
            className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
          >
            <LogIn className="h-4.5 w-4.5 text-brand-cream" />
            Masuk dengan Google
          </Button>
        </div>
      </div>
    );
  }

  // If role is not selected yet, redirect to select-role page (except if we are already there)
  if (needsRoleSelection && pathname !== '/select-role') {
    if (typeof window !== 'undefined') {
      router.push('/select-role');
    }
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Landmark, ArrowRight, Lock, KeyRound, LogOut } from 'lucide-react';

// Kode akses gerbang untuk halaman internal. Halaman ini sengaja tidak
// ditautkan di navigasi mana pun dan hanya bisa dibuka lewat URL langsung.
// Nilai dapat ditimpa lewat environment variable NEXT_PUBLIC_INTERNAL_ACCESS_CODE.
// Catatan keamanan: gerbang ini bersifat client-side sehingga hanya menyaring
// akses kasual. Proteksi peran yang sebenarnya tetap harus ditegakkan di sisi
// server (Firestore Security Rules / custom claims).
const INTERNAL_ACCESS_CODE = process.env.NEXT_PUBLIC_INTERNAL_ACCESS_CODE || 'ARUNA-INTERNAL-2026';

export default function AksesInternalPage() {
  const { user, userData, signInWithGoogle, setRoleForUser, logout, loading } = useAuth();
  const router = useRouter();

  const [codeInput, setCodeInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);

  const [roleOverride, setRoleOverride] = useState<'admin' | 'pemerintah' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Peran elevated yang sudah dimiliki dipakai sebagai default pilihan,
  // tanpa perlu effect (lihat "You Might Not Need an Effect").
  const existingElevatedRole =
    userData?.role === 'admin' || userData?.role === 'pemerintah' ? userData.role : null;
  const selectedRole = roleOverride ?? existingElevatedRole;
  const setSelectedRole = setRoleOverride;

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim() === INTERNAL_ACCESS_CODE) {
      setUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      // redirect: false agar tetap di halaman ini untuk memilih peran elevated
      await signInWithGoogle({ redirect: false });
    } finally {
      setSigningIn(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRole || !user) return;
    setSubmitting(true);
    try {
      await setRoleForUser(selectedRole);
      if (selectedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/potensi-desa');
      }
    } catch (err) {
      console.error('Error setting internal role:', err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-cream/20">
        <div className="text-center space-y-2">
          <div className="pulsing-dot mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold animate-pulse">Menghubungkan sesi autentikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-6">

        {/* Title Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] bg-brand-red text-white px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Akses Internal Terbatas
          </span>
          <h2 className="text-2xl font-semibold text-white leading-tight">
            Gerbang Peran Elevated
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Halaman ini khusus untuk pemberian peran <strong className="text-slate-200">Administrator</strong> dan <strong className="text-slate-200">Pemerintah / Instansi Dinas</strong>. Hanya dapat diakses melalui tautan langsung.
          </p>
        </div>

        {/* STEP 1: Access Code Gate */}
        {!unlocked ? (
          <form
            onSubmit={handleVerifyCode}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur"
          >
            <div className="flex items-center gap-2 text-slate-200">
              <KeyRound className="h-5 w-5 text-brand-red" />
              <span className="text-sm font-semibold">Masukkan Kode Akses</span>
            </div>
            <input
              type="password"
              autoFocus
              placeholder="Kode akses internal"
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
              className={`w-full p-3 rounded-xl text-sm font-semibold bg-white/10 text-white placeholder:text-slate-500 border focus:outline-none focus:ring-1 ${codeError ? 'border-brand-red focus:ring-brand-red' : 'border-white/15 focus:ring-brand-navy'
                }`}
            />
            {codeError && (
              <p className="text-[11px] font-semibold text-brand-red">Kode akses tidak valid. Silakan coba lagi.</p>
            )}
            <Button
              type="submit"
              disabled={!codeInput.trim()}
              className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-semibold text-sm rounded-xl disabled:opacity-50"
            >
              Buka Gerbang Akses
            </Button>
          </form>
        ) : (
          <>
            {/* STEP 2: Google Sign In */}
            {!user ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-center backdrop-blur">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Masuk dengan akun Google Anda untuk melanjutkan pemberian peran.
                </p>
                <Button
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="w-full py-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm rounded-xl disabled:opacity-50"
                >
                  {signingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}
                </Button>
              </div>
            ) : (
              <>
                {/* Logged-in identity */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 backdrop-blur">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Masuk sebagai</p>
                    <p className="text-xs text-slate-200 font-semibold truncate">{user.displayName || user.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="text-[10px] text-slate-400 hover:text-brand-red font-semibold flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Keluar
                  </button>
                </div>

                {/* STEP 3: Role selection */}
                <div className="space-y-4">
                  {/* Admin */}
                  <div
                    onClick={() => setSelectedRole('admin')}
                    className={`cursor-pointer p-4 border rounded-2xl transition-all duration-200 flex gap-4 items-start ${selectedRole === 'admin'
                      ? 'border-brand-red bg-white/10 ring-1 ring-brand-red/40 shadow-md'
                      : 'border-white/10 bg-white/5 hover:border-white/25'
                      }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selectedRole === 'admin' ? 'bg-brand-red text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-white">Administrator ARUNA (Admin)</h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Akses penuh untuk mengelola Command Center, membagi kuota logistik gotong royong, dan memantau analitik nasional.
                      </p>
                    </div>
                  </div>

                  {/* Pemerintah */}
                  <div
                    onClick={() => setSelectedRole('pemerintah')}
                    className={`cursor-pointer p-4 border rounded-2xl transition-all duration-200 flex gap-4 items-start ${selectedRole === 'pemerintah'
                      ? 'border-brand-red bg-white/10 ring-1 ring-brand-red/40 shadow-md'
                      : 'border-white/10 bg-white/5 hover:border-white/25'
                      }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selectedRole === 'pemerintah' ? 'bg-brand-red text-white' : 'bg-white/10 text-slate-400'
                      }`}>
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm text-white">Pemerintah / Instansi Dinas (Government)</h3>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Akses penuh ke peta potensi strategis, dashboard komoditas nasional, evaluasi kelayakan, dan analisis AI kebijakan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedRole || submitting}
                  className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-semibold text-sm flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan Konfigurasi...' : 'Aktifkan Peran & Masuk'}
                  <ArrowRight className="h-4.5 w-4.5 text-brand-cream" />
                </Button>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}

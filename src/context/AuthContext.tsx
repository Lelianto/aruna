'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'buyer' | 'koperasi' | 'customer' | 'pemerintah' | null;
  associatedId?: string; // id of buyer or cooperative
  address?: string; // primary delivery address for customer
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  needsRoleSelection: boolean;
  signInWithGoogle: (options?: { redirect?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  setRoleForUser: (role: 'admin' | 'buyer' | 'koperasi' | 'customer' | 'pemerintah', associatedId?: string) => Promise<void>;
  updateUserAddress: (address: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Coba baca cache lokal terlebih dahulu agar user experience instan
        const cacheKey = `aruna_user_data_${firebaseUser.uid}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const data = JSON.parse(cachedData) as UserData;
            setUserData(data);
            setNeedsRoleSelection(false);
          } catch (e) {
            // Ignore parse error, fetch fresh instead
          }
        }

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserData;
            setUserData(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
            setNeedsRoleSelection(false);
          } else {
            setUserData(null);
            setNeedsRoleSelection(true);
          }
        } catch (err) {
          console.error("Error loading user profile from Firestore, falling back to cache:", err);
          // Jika offline dan belum dibaca dari cache sebelumnya
          if (!cachedData) {
            setUserData(null);
          }
        }
      } else {
        setUserData(null);
        setNeedsRoleSelection(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (options?: { redirect?: boolean }) => {
    // Default: arahkan otomatis ke dashboard sesuai peran setelah login.
    // Halaman internal (mis. /akses-internal) mematikan ini agar bisa
    // menentukan peran elevated sendiri tanpa dilempar keluar.
    const shouldRedirect = options?.redirect ?? true;
    if (!auth || !db) {
      console.warn('Firebase auth is unavailable. Skipping sign-in.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData;
        setUserData(data);
        localStorage.setItem(`aruna_user_data_${firebaseUser.uid}`, JSON.stringify(data));
        setNeedsRoleSelection(false);
        if (!shouldRedirect) return;
        if (data.role === 'admin') {
          // Admin mendarat di Pusat Kendali Admin (data mitra/pengguna + antrean
          // validasi KYC & pembayaran), bukan portal operasional koperasi.
          router.push('/admin');
        } else if (data.role === 'koperasi') {
          router.push('/mitra-dashboard');
        } else if (data.role === 'pemerintah') {
          router.push('/potensi-desa');
        } else if (data.role === 'buyer' || data.role === 'customer') {
          // Customer umum & Buyer Industri langsung diarahkan ke Pasar Digital
          // sebagai halaman fungsional utama mereka (lihat riset marketplace UX).
          router.push('/marketplace');
        } else {
          router.push('/');
        }
      } else {
        setUserData(null);
        setNeedsRoleSelection(true);
        if (!shouldRedirect) return;
        router.push('/select-role');
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.clear(); // Clear all user-related data
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.warn("Firebase Auth signOut failed, proceeding with UI logout:", error);
    } finally {
      setUser(null);
      setUserData(null);
      setLoading(false);
      router.push('/');
    }
  };

  const setRoleForUser = async (role: 'admin' | 'buyer' | 'koperasi' | 'customer' | 'pemerintah', associatedId?: string) => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const updatedProfile: UserData = {
      uid: user.uid,
      name: user.displayName || 'Pengguna Baru',
      email: user.email || '',
      role
    };

    if (associatedId !== undefined) {
      updatedProfile.associatedId = associatedId;
    }

    try {
      await setDoc(userDocRef, updatedProfile);
    } catch (err) {
      console.warn("Offline setDoc failed, saving to local cache:", err);
    }
    setUserData(updatedProfile);
    localStorage.setItem(`aruna_user_data_${user.uid}`, JSON.stringify(updatedProfile));
    setNeedsRoleSelection(false);
  };

  const updateUserAddress = async (address: string) => {
    if (!user || !userData) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updatedProfile = { ...userData, address };
    try {
      await setDoc(userDocRef, updatedProfile);
    } catch (err) {
      console.warn("Offline address update failed, saving to local cache:", err);
    }
    setUserData(updatedProfile);
    localStorage.setItem(`aruna_user_data_${user.uid}`, JSON.stringify(updatedProfile));
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      needsRoleSelection,
      signInWithGoogle,
      logout,
      setRoleForUser,
      updateUserAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

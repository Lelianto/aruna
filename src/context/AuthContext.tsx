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
  role: 'admin' | 'buyer' | 'koperasi' | 'customer' | null;
  associatedId?: string; // id of buyer or cooperative
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  needsRoleSelection: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setRoleForUser: (role: 'admin' | 'buyer' | 'koperasi' | 'customer', associatedId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mockFirebaseUser = {
    uid: 'mock-user-123',
    displayName: 'Admin Koperasi Lampung Makmur',
    email: 'admin.lampung@koperasi.id',
    emailVerified: true,
  } as any;

  const mockUserData: UserData = {
    uid: 'mock-user-123',
    name: 'Admin Koperasi Lampung Makmur',
    email: 'admin.lampung@koperasi.id',
    role: 'koperasi',
    associatedId: 'coop-lampung-tani'
  };

  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Read from localStorage to check bypass login state (default to true if not set)
    const isLoggedIn = localStorage.getItem('bypass_logged_in') !== 'false';
    if (isLoggedIn) {
      setUser(mockFirebaseUser);
      setUserData(mockUserData);
    } else {
      setUser(null);
      setUserData(null);
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.setItem('bypass_logged_in', 'true');
      setUser(mockFirebaseUser);
      setUserData(mockUserData);
      setLoading(false);
      router.push('/mitra-dashboard');
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.setItem('bypass_logged_in', 'false');
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setLoading(false);
      router.push('/');
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false);
    }
  };

  const setRoleForUser = async (role: 'admin' | 'buyer' | 'koperasi' | 'customer', associatedId?: string) => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const updatedProfile: UserData = {
      uid: user.uid,
      name: user.displayName || 'Pengguna Baru',
      email: user.email || '',
      role,
      associatedId
    };

    await setDoc(userDocRef, updatedProfile);
    setUserData(updatedProfile);
    setNeedsRoleSelection(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      needsRoleSelection,
      signInWithGoogle,
      logout,
      setRoleForUser
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

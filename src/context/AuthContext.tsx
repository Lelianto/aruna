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
  address?: string; // primary delivery address for customer
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  needsRoleSelection: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setRoleForUser: (role: 'admin' | 'buyer' | 'koperasi' | 'customer', associatedId?: string) => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
            setNeedsRoleSelection(false);
          } else {
            setUserData(null);
            setNeedsRoleSelection(true);
          }
        } catch (err) {
          console.error("Error loading user profile from Firestore:", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
        setNeedsRoleSelection(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
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
        setNeedsRoleSelection(false);
        if (data.role === 'koperasi' || data.role === 'admin') {
          router.push('/mitra-dashboard');
        } else {
          router.push('/');
        }
      } else {
        setUserData(null);
        setNeedsRoleSelection(true);
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
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase Auth signOut failed, proceeding with UI logout:", error);
    } finally {
      setUser(null);
      setUserData(null);
      setLoading(false);
      router.push('/');
    }
  };

  const setRoleForUser = async (role: 'admin' | 'buyer' | 'koperasi' | 'customer', associatedId?: string) => {
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

    await setDoc(userDocRef, updatedProfile);
    setUserData(updatedProfile);
    setNeedsRoleSelection(false);
  };

  const updateUserAddress = async (address: string) => {
    if (!user || !userData) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updatedProfile = { ...userData, address };
    await setDoc(userDocRef, updatedProfile);
    setUserData(updatedProfile);
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

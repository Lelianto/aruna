'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch custom user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserData;
          setUserData(data);
          setNeedsRoleSelection(!data.role);
        } else {
          // New user, create entry but leaves role empty
          const newProfile: UserData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Pengguna Baru',
            email: firebaseUser.email || '',
            role: null
          };
          await setDoc(userDocRef, newProfile);
          setUserData(newProfile);
          setNeedsRoleSelection(true);
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
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
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

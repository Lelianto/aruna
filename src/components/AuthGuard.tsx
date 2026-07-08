'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, needsRoleSelection, signInWithGoogle } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public paths that do not require authentication
  const isPublicPath = pathname === '/' || pathname === '/pitch';

  // Temporary: all pages accessible without login — do NOT commit
  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';

export default function PetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lock body scroll so only the sidebar list scrolls, not the entire page
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return <>{children}</>;
}

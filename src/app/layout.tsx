import type { Metadata, Viewport } from 'next';
// Mona Sans (variable) — self-hosted via Fontsource. Provides the primary UI
// typeface; Helvetica Neue is the system fallback (see --font-sans in globals).
import '@fontsource-variable/mona-sans';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import PwaRegistration from '@/components/PwaRegistration';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'ARUNA - Analitik Usaha Rakyat Nusantara',
  description: 'Menghubungkan Potensi Komoditas Desa ke Pasar Nasional Melalui Gotong Royong Digital - Koperasi Indonesia 2026',
  manifest: '/manifest.webmanifest',
  applicationName: 'ARUNA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ARUNA',
  },
};

// Native-app feel: lock the viewport so the page cannot be pinch/double-tap
// zoomed. NOTE: disabling user scaling reduces accessibility for low-vision
// users; kept per product requirement for an app-like experience.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#003049',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-slate-900 pb-16 lg:pb-0">
        <PwaRegistration />
        <AuthProvider>
          <Navbar />

          <main className="flex-1 flex flex-col">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>
        </AuthProvider>

        <Footer />
      </body>
    </html>
  );
}

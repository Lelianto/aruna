import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import PwaRegistration from '@/components/PwaRegistration';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'ARUNA - Analitik Usaha Rakyat Nusantara',
  description: 'Menghubungkan Potensi Komoditas Desa ke Pasar Nasional Melalui Gotong Royong Digital - Koperasi Indonesia 2026',
  manifest: '/manifest.webmanifest',
  applicationName: 'ARUNA',
  themeColor: '#003049',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ARUNA',
  },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-slate-900">
        <PwaRegistration />
        <AuthProvider>
          <Navbar />

          <main className="flex-1 flex flex-col">
            <AuthGuard>
              {children}
            </AuthGuard>
          </main>
        </AuthProvider>

        <footer className="border-t border-slate-200 bg-white py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <span className="text-sm font-bold text-slate-800">
                  ARUNA &copy; 2026
                </span>
                <span className="text-xs text-slate-500 text-center sm:text-left">
                  Digital Cooperatives Expo 2026 - Pilar 3: Pemanfaatan Potensi Ekonomi Desa
                </span>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-red"></span> Gotong royong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-navy"></span> Rantai pasok
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-orange"></span> Berbasis data
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

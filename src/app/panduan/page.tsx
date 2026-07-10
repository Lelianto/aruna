import { Suspense } from 'react';
import type { Metadata } from 'next';
import PanduanClient from '@/components/panduan/PanduanClient';

export const metadata: Metadata = {
  title: 'Panduan Pengguna - ARUNA',
  description:
    'Panduan lengkap penggunaan platform ARUNA untuk setiap peran: customer, buyer industri, koperasi, pemerintah, dan admin.',
};

export default function PanduanPage() {
  return (
    <Suspense fallback={null}>
      <PanduanClient />
    </Suspense>
  );
}

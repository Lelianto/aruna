import type { ComponentType } from 'react';
import {
  BarChart3,
  Map,
  ShoppingBag,
  Award,
  Lightbulb,
  Compass,
  UserPlus,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';

export type UserRole = 'admin' | 'buyer' | 'koperasi' | 'customer' | 'pemerintah' | null;

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

// Single source of truth for the primary destinations. Both the top Navbar and
// the dashboard sidebar consume this list so navigation stays consistent.
export const NAV_ITEMS: NavItem[] = [
  { name: 'Pusat Admin', href: '/admin', icon: ShieldAlert },
  { name: 'Peta Potensi', href: '/potensi-desa', icon: Map },
  { name: 'Dashboard Nasional', href: '/dashboard', icon: BarChart3 },
  { name: 'Komoditas', href: '/komoditas', icon: Compass },
  { name: 'Pasar Digital', href: '/marketplace', icon: ShoppingBag },
  { name: 'Skor Kelayakan', href: '/scoring', icon: Award },
  { name: 'Analisis AI', href: '/insights', icon: Lightbulb },
  { name: 'Pendaftaran', href: '/onboarding-mitra', icon: UserPlus },
  { name: 'Portal Saya', href: '/mitra-dashboard', icon: LayoutDashboard },
];

// Restrict destinations to those each role can actually reach (routes guarded
// elsewhere are hidden here to avoid dead links / redirect bounces).
export function filterNavItems(hasUser: boolean, role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    // Guest without login / role — only truly public pages.
    if (!hasUser || !role) {
      return item.href === '/marketplace' || item.href === '/komoditas';
    }
    // Buyer — public catalog & digital market only.
    if (role === 'buyer') {
      return item.href === '/marketplace' || item.href === '/komoditas';
    }
    // Customer (retail buyer) — digital market only.
    if (role === 'customer') {
      return item.href === '/marketplace';
    }
    // Koperasi — partner portal, catalog & AI analysis.
    if (role === 'koperasi') {
      return (
        item.href === '/komoditas' ||
        item.href === '/insights' ||
        item.href === '/mitra-dashboard'
      );
    }
    // Pemerintah — oversight & analytics tools.
    if (role === 'pemerintah') {
      return (
        item.href === '/potensi-desa' ||
        item.href === '/dashboard' ||
        item.href === '/scoring' ||
        item.href === '/insights' ||
        item.href === '/komoditas' ||
        item.href === '/marketplace'
      );
    }
    // Admin — pengawasan & onboarding platform. Admin bukan pelaku transaksi,
    // jadi Pasar Digital (/marketplace) & Portal Saya (/mitra-dashboard) yang
    // umumnya dipakai koperasi tidak ditampilkan untuk admin.
    if (role === 'admin') {
      return item.href !== '/marketplace' && item.href !== '/mitra-dashboard';
    }
    return true;
  });
}

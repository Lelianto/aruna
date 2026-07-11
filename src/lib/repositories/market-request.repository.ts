import { MarketRequest, MarketRequestWithBuyer } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { supplyMatchRepository } from './supply-match.repository';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  const port = process.env.PORT || '3000';
  const host = process.env.VERCEL_URL || `localhost:${port}`;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export type CreateMarketRequestInput = Omit<MarketRequest, 'id'>;

export interface MarketRequestRepository {
  getAll(): Promise<MarketRequest[]>;
  getById(id: string): Promise<MarketRequest | null>;
  getAllWithBuyer(): Promise<MarketRequestWithBuyer[]>;
  getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null>;
  create(request: CreateMarketRequestInput): Promise<string>;
  updateStatus(id: string, status: MarketRequest['status']): Promise<void>;
  approvePayment(request: MarketRequest): Promise<void>;
}

export class PrismaMarketRequestRepository implements MarketRequestRepository {
  async getAll(): Promise<MarketRequest[]> {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/market-requests`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch market requests from PG API');
      return await res.json();
    } catch (error) {
      console.error('Error in marketRequestRepository.getAll:', error);
      return [];
    }
  }

  async getById(id: string): Promise<MarketRequest | null> {
    if (!id) return null;
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/market-requests?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(`Error in marketRequestRepository.getById for ${id}:`, error);
      return null;
    }
  }

  async getAllWithBuyer(): Promise<MarketRequestWithBuyer[]> {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/market-requests?withBuyer=1`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch market requests from PG API');
      return await res.json();
    } catch (error) {
      console.error('Error in marketRequestRepository.getAllWithBuyer:', error);
      return [];
    }
  }

  async getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null> {
    if (!id) return null;
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/market-requests?id=${encodeURIComponent(id)}&withBuyer=1`, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(`Error in marketRequestRepository.getByIdWithBuyer for ${id}:`, error);
      return null;
    }
  }

  async create(request: CreateMarketRequestInput): Promise<string> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/market-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(`Failed to create market request: ${res.status}`);
    }
    const { id } = await res.json();
    return id as string;
  }

  async updateStatus(id: string, status: MarketRequest['status']): Promise<void> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/market-requests?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update market request status: ${res.status}`);
    }
  }

  // Verifikasi pembayaran oleh admin: kurangi stok komoditas koperasi penyuplai
  // (berdasarkan supply match di Postgres), lalu tandai permintaan 'Terpenuhi'.
  // Catatan: stok komoditas tetap dikelola lewat lapisan override Firestore
  // (commodities di luar cakupan migrasi aruna_ ini).
  async approvePayment(request: MarketRequest): Promise<void> {
    // 1. Cari alokasi pasok (supply match) untuk permintaan ini via Postgres.
    const match = await supplyMatchRepository.getByRequestId(request.id);

    // 2. Jika ada, kurangi stok komoditas koperasi terkait (Firestore override).
    if (match) {
      const comSnap = await getDocs(collection(db, 'commodities'));
      let targetComId: string | null = null;
      let currentStock = 0;
      comSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (
          d.cooperative_id === match.cooperative_id &&
          typeof d.name === 'string' &&
          d.name.toLowerCase() === request.commodity_name.toLowerCase()
        ) {
          targetComId = docSnap.id;
          currentStock = d.available_stock || 0;
        }
      });

      if (targetComId) {
        await updateDoc(doc(db, 'commodities', targetComId), {
          available_stock: Math.max(0, currentStock - request.quantity),
        });
      }
    }

    // 3. Tandai permintaan sebagai Terpenuhi di Postgres.
    await this.updateStatus(request.id, 'Terpenuhi');
  }
}

export const marketRequestRepository: MarketRequestRepository = new PrismaMarketRequestRepository();

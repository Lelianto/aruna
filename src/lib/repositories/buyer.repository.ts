import { Buyer } from '@/types';

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

export type CreateBuyerInput = Omit<Buyer, 'id'>;

export interface BuyerRepository {
  getAll(): Promise<Buyer[]>;
  getById(id: string): Promise<Buyer | null>;
  create(data: CreateBuyerInput): Promise<string>;
  setVerified(id: string, verified: boolean): Promise<void>;
  delete(id: string): Promise<void>;
}

export class PrismaBuyerRepository implements BuyerRepository {
  async getAll(): Promise<Buyer[]> {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/buyers`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch buyers from PG API');
      return await res.json();
    } catch (error) {
      console.error('Error in buyerRepository.getAll:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Buyer | null> {
    if (!id) return null;
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/buyers?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(`Error in buyerRepository.getById for ${id}:`, error);
      return null;
    }
  }

  async create(data: CreateBuyerInput): Promise<string> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/buyers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to create buyer: ${res.status}`);
    }
    const { id } = await res.json();
    return id as string;
  }

  // Validasi manual oleh admin: set status terverifikasi sebuah buyer.
  async setVerified(id: string, verified: boolean): Promise<void> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/buyers?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update buyer verification: ${res.status}`);
    }
  }

  async delete(id: string): Promise<void> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/buyers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete buyer: ${res.status}`);
    }
  }
}

export const buyerRepository: BuyerRepository = new PrismaBuyerRepository();

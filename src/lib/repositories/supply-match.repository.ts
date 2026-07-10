import { SupplyMatch } from '@/types';

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

export type CreateSupplyMatchInput = Omit<SupplyMatch, 'id' | 'matched_at'> & { matched_at?: string };

export interface SupplyMatchRepository {
  getAll(): Promise<SupplyMatch[]>;
  getByCooperativeId(cooperativeId: string): Promise<SupplyMatch[]>;
  getByRequestId(requestId: string): Promise<SupplyMatch | null>;
  create(data: CreateSupplyMatchInput): Promise<string>;
}

export class PrismaSupplyMatchRepository implements SupplyMatchRepository {
  async getAll(): Promise<SupplyMatch[]> {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/supply-matches`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch supply matches from PG API');
      return await res.json();
    } catch (error) {
      console.error('Error in supplyMatchRepository.getAll:', error);
      return [];
    }
  }

  async getByCooperativeId(cooperativeId: string): Promise<SupplyMatch[]> {
    if (!cooperativeId) return [];
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(
        `${baseUrl}/api/supply-matches?cooperativeId=${encodeURIComponent(cooperativeId)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error(`Error in supplyMatchRepository.getByCooperativeId for ${cooperativeId}:`, error);
      return [];
    }
  }

  async getByRequestId(requestId: string): Promise<SupplyMatch | null> {
    if (!requestId) return null;
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(
        `${baseUrl}/api/supply-matches?requestId=${encodeURIComponent(requestId)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(`Error in supplyMatchRepository.getByRequestId for ${requestId}:`, error);
      return null;
    }
  }

  async create(data: CreateSupplyMatchInput): Promise<string> {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/supply-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to create supply match: ${res.status}`);
    }
    const { id } = await res.json();
    return id as string;
  }
}

export const supplyMatchRepository: SupplyMatchRepository = new PrismaSupplyMatchRepository();

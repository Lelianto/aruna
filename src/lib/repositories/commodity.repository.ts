import { Commodity } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export interface CommodityRepository {
  getAll(): Promise<Commodity[]>;
  getCommodityOverrides(): Promise<Map<string, Partial<Commodity>>>;
  getInStockPage(limit: number, offset: number, overrides?: Map<string, Partial<Commodity>>): Promise<{ items: Commodity[]; total: number }>;
  getById(id: string): Promise<Commodity | null>;
  getByCooperativeId(cooperativeId: string): Promise<Commodity[]>;
  getUniqueNames(): Promise<string[]>;
  getTotalsByCategory(): Promise<Record<string, { capacity: number; stock: number }>>;
  addCommodity(data: Omit<Commodity, 'id'>): Promise<string>;
  updateCommodity(id: string, data: Partial<Omit<Commodity, 'id'>>): Promise<void>;
  deleteCommodity(id: string): Promise<void>;
}

export class HybridCommodityRepository implements CommodityRepository {
  async getAll(): Promise<Commodity[]> {
    try {
      // 1. Fetch baseline from PostgreSQL
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/commodities`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch from PG API');
      const pgList: Commodity[] = await res.json();

      // 2. Fetch overrides & custom commodities from Firestore
      const fsSnap = await getDocs(collection(db, 'commodities'));
      const fsList: Commodity[] = [];
      fsSnap.forEach((docSnap) => {
        fsList.push({ id: docSnap.id, ...docSnap.data() } as Commodity);
      });

      // 3. Merge: overrides replace pg values, new ones are appended
      const merged = [...pgList];
      fsList.forEach(fsComm => {
        const idx = merged.findIndex(c => c.id === fsComm.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...fsComm };
        } else {
          merged.push(fsComm);
        }
      });

      return merged;
    } catch (error) {
      console.error('Error in commodityRepository.getAll:', error);
      return [];
    }
  }

  // Fetch the Firestore override/custom-commodity layer once. Callers can pass
  // the returned map into getInStockPage() to apply live stock edits to each
  // page without re-reading Firestore per batch.
  async getCommodityOverrides(): Promise<Map<string, Partial<Commodity>>> {
    const overrides = new Map<string, Partial<Commodity>>();
    try {
      const fsSnap = await getDocs(collection(db, 'commodities'));
      fsSnap.forEach((docSnap) => {
        overrides.set(docSnap.id, docSnap.data() as Partial<Commodity>);
      });
    } catch (error) {
      console.error('Error loading commodity overrides from Firestore:', error);
    }
    return overrides;
  }

  // Paginated, in-stock-only slice of the catalog for progressive (batched)
  // loading in the marketplace. Applies Firestore overrides when provided.
  async getInStockPage(
    limit: number,
    offset: number,
    overrides?: Map<string, Partial<Commodity>>
  ): Promise<{ items: Commodity[]; total: number }> {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/commodities?inStock=1&limit=${limit}&offset=${offset}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch in-stock commodities page');
      const data = (await res.json()) as { items: Commodity[]; total: number };

      const items = overrides && overrides.size > 0
        ? data.items.map((it) => (overrides.has(it.id) ? ({ ...it, ...overrides.get(it.id) } as Commodity) : it))
        : data.items;

      return { items, total: data.total };
    } catch (error) {
      console.error('Error in commodityRepository.getInStockPage:', error);
      return { items: [], total: 0 };
    }
  }

  async getById(id: string): Promise<Commodity | null> {
    if (!id) return null;
    try {
      const list = await this.getAll();
      return list.find(c => c.id === id) || null;
    } catch (error) {
      console.error(`Error in commodityRepository.getById for ${id}:`, error);
      return null;
    }
  }

  async getByCooperativeId(cooperativeId: string): Promise<Commodity[]> {
    if (!cooperativeId) return [];
    try {
      // Targeted PG query for just this cooperative — avoids pulling the entire
      // ~14k-row commodity catalog into memory just to filter one cooperative.
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/commodities?cooperativeId=${encodeURIComponent(cooperativeId)}`, { cache: 'no-store' });
      const pgList: Commodity[] = res.ok ? await res.json() : [];

      // Merge Firestore overrides / custom commodities belonging to this coop.
      const fsSnap = await getDocs(collection(db, 'commodities'));
      const merged = [...pgList];
      fsSnap.forEach((docSnap) => {
        const fsComm = { id: docSnap.id, ...docSnap.data() } as Commodity;
        if (fsComm.cooperative_id !== cooperativeId) return;
        const idx = merged.findIndex(c => c.id === fsComm.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...fsComm };
        } else {
          merged.push(fsComm);
        }
      });
      return merged;
    } catch (error) {
      console.error(`Error in commodityRepository.getByCooperativeId for ${cooperativeId}:`, error);
      return [];
    }
  }

  async getUniqueNames(): Promise<string[]> {
    const list = await this.getAll();
    const names = Array.from(new Set(list.map(c => c.name)));
    return names.sort();
  }

  async getTotalsByCategory(): Promise<Record<string, { capacity: number; stock: number }>> {
    const list = await this.getAll();
    const totals: Record<string, { capacity: number; stock: number }> = {};
    for (const c of list) {
      if (!totals[c.category]) {
        totals[c.category] = { capacity: 0, stock: 0 };
      }
      totals[c.category].capacity += c.monthly_capacity;
      totals[c.category].stock += c.available_stock;
    }
    return totals;
  }

  async addCommodity(data: Omit<Commodity, 'id'>): Promise<string> {
    // Save to Firestore as a custom commodity
    const docRef = doc(collection(db, 'commodities'));
    const id = docRef.id;
    await setDoc(docRef, {
      ...data,
      id,
      created_at: new Date().toISOString()
    });
    return id;
  }

  async updateCommodity(id: string, data: Partial<Omit<Commodity, 'id'>>): Promise<void> {
    // Write override to Firestore
    await setDoc(doc(db, 'commodities', id), data, { merge: true });
  }

  async deleteCommodity(id: string): Promise<void> {
    // Delete from Firestore overrides
    await deleteDoc(doc(db, 'commodities', id));
  }
}

export const commodityRepository: CommodityRepository = new HybridCommodityRepository();

import 'server-only';

import { Commodity } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  loadAllCommoditiesFromPg,
  loadCommoditiesByCooperativeIdFromPg,
  loadInStockCommoditiesPageFromPg,
} from '../data/commodities.pg';
import type { CommodityRepository } from './commodity.repository';

async function mergeFirestoreCommodities(pgList: Commodity[], cooperativeId?: string): Promise<Commodity[]> {
  const merged = [...pgList];
  const snap = await getDocs(collection(db, 'commodities'));

  snap.forEach((docSnap) => {
    const fsComm = { id: docSnap.id, ...docSnap.data() } as Commodity;
    if (cooperativeId && fsComm.cooperative_id !== cooperativeId) return;

    const idx = merged.findIndex((c) => c.id === fsComm.id);
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], ...fsComm };
    } else {
      merged.push(fsComm);
    }
  });
  return merged;
}

export class ServerCommodityRepository implements CommodityRepository {
  async getAll(): Promise<Commodity[]> {
    try {
      const pgList = await loadAllCommoditiesFromPg();
      return await mergeFirestoreCommodities(pgList);
    } catch (error) {
      console.error('Error in commodityRepositoryServer.getAll:', error);
      return [];
    }
  }

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

  async getInStockPage(
    limit: number,
    offset: number,
    overrides?: Map<string, Partial<Commodity>>,
  ): Promise<{ items: Commodity[]; total: number }> {
    try {
      const data = await loadInStockCommoditiesPageFromPg(limit, offset);
      const items = overrides && overrides.size > 0
        ? data.items.map((it) => (overrides.has(it.id) ? ({ ...it, ...overrides.get(it.id) } as Commodity) : it))
        : data.items;
      return { items, total: data.total };
    } catch (error) {
      console.error('Error in commodityRepositoryServer.getInStockPage:', error);
      return { items: [], total: 0 };
    }
  }

  async getById(id: string): Promise<Commodity | null> {
    if (!id) return null;
    try {
      const list = await this.getAll();
      return list.find((c) => c.id === id) || null;
    } catch (error) {
      console.error(`Error in commodityRepositoryServer.getById for ${id}:`, error);
      return null;
    }
  }

  async getByCooperativeId(cooperativeId: string): Promise<Commodity[]> {
    if (!cooperativeId) return [];
    try {
      const pgList = await loadCommoditiesByCooperativeIdFromPg(cooperativeId);
      return await mergeFirestoreCommodities(pgList, cooperativeId);
    } catch (error) {
      console.error(`Error in commodityRepositoryServer.getByCooperativeId for ${cooperativeId}:`, error);
      return [];
    }
  }

  async getUniqueNames(): Promise<string[]> {
    const list = await this.getAll();
    return Array.from(new Set(list.map((c) => c.name))).sort();
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
    const docRef = doc(collection(db, 'commodities'));
    const id = docRef.id;
    await setDoc(docRef, {
      ...data,
      id,
      created_at: new Date().toISOString(),
    });
    return id;
  }

  async updateCommodity(id: string, data: Partial<Omit<Commodity, 'id'>>): Promise<void> {
    await setDoc(doc(db, 'commodities', id), data, { merge: true });
  }

  async deleteCommodity(id: string): Promise<void> {
    await deleteDoc(doc(db, 'commodities', id));
  }
}

export const commodityRepositoryServer: CommodityRepository = new ServerCommodityRepository();

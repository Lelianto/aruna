import { Commodity } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { seedDatabaseIfEmpty } from '../firebase/seeder';

export interface CommodityRepository {
  getAll(): Promise<Commodity[]>;
  getById(id: string): Promise<Commodity | null>;
  getByCooperativeId(cooperativeId: string): Promise<Commodity[]>;
  getUniqueNames(): Promise<string[]>;
  getTotalsByCategory(): Promise<Record<string, { capacity: number; stock: number }>>;
  addCommodity(data: Omit<Commodity, 'id'>): Promise<string>;
  updateCommodity(id: string, data: Partial<Omit<Commodity, 'id'>>): Promise<void>;
  deleteCommodity(id: string): Promise<void>;
}

export class FirestoreCommodityRepository implements CommodityRepository {
  async getAll(): Promise<Commodity[]> {
    await seedDatabaseIfEmpty();
    const snap = await getDocs(collection(db, 'commodities'));
    const list: Commodity[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Commodity);
    });
    return list;
  }

  async getById(id: string): Promise<Commodity | null> {
    await seedDatabaseIfEmpty();
    const snap = await getDoc(doc(db, 'commodities', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Commodity;
  }

  async getByCooperativeId(cooperativeId: string): Promise<Commodity[]> {
    if (!cooperativeId) return [];
    await seedDatabaseIfEmpty();
    const q = query(collection(db, 'commodities'), where('cooperative_id', '==', cooperativeId));
    const snap = await getDocs(q);
    const list: Commodity[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Commodity);
    });
    return list;
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
    const ref = await addDoc(collection(db, 'commodities'), {
      ...data,
      created_at: new Date().toISOString(),
    });
    return ref.id;
  }

  async updateCommodity(id: string, data: Partial<Omit<Commodity, 'id'>>): Promise<void> {
    await updateDoc(doc(db, 'commodities', id), data);
  }

  async deleteCommodity(id: string): Promise<void> {
    await deleteDoc(doc(db, 'commodities', id));
  }
}

export const commodityRepository: CommodityRepository = new FirestoreCommodityRepository();

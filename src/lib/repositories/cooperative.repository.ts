import { Cooperative, CooperativeScore, Insight, CooperativeWithCommodities } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { seedDatabaseIfEmpty } from '../firebase/seeder';
import { calculateCooperativeScore } from '../services/score-engine';
import { generateCooperativeInsights } from '../services/insight-engine';
import { commodityRepository } from './commodity.repository';

export interface CooperativeRepository {
  getAll(): Promise<Cooperative[]>;
  getById(id: string): Promise<Cooperative | null>;
  getScore(cooperativeId: string): Promise<CooperativeScore | null>;
  getInsights(cooperativeId: string): Promise<Insight[]>;
  getAllWithDetails(): Promise<CooperativeWithCommodities[]>;
  getByIdWithDetails(id: string): Promise<CooperativeWithCommodities | null>;
  getMaxRevenue(): Promise<number>;
  updateCommodityStock(coopId: string, commId: string, newStock: number): Promise<void>;
  updateCooperative(id: string, data: Partial<Omit<Cooperative, 'id'>>): Promise<void>;
}

export class FirestoreCooperativeRepository implements CooperativeRepository {
  async getAll(): Promise<Cooperative[]> {
    await seedDatabaseIfEmpty();
    const snap = await getDocs(collection(db, 'cooperatives'));
    const list: Cooperative[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Cooperative);
    });
    return list;
  }

  async getById(id: string): Promise<Cooperative | null> {
    await seedDatabaseIfEmpty();
    const snap = await getDoc(doc(db, 'cooperatives', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Cooperative;
  }

  async getMaxRevenue(): Promise<number> {
    const list = await this.getAll();
    if (list.length === 0) return 0;
    return Math.max(...list.map(c => c.annual_revenue), 1);
  }

  async getScore(cooperativeId: string): Promise<CooperativeScore | null> {
    const coop = await this.getById(cooperativeId);
    if (!coop) return null;

    const maxRev = await this.getMaxRevenue();
    const commodities = await commodityRepository.getByCooperativeId(cooperativeId);
    return calculateCooperativeScore(coop, commodities, maxRev);
  }

  async getInsights(cooperativeId: string): Promise<Insight[]> {
    const coop = await this.getById(cooperativeId);
    if (!coop) return [];

    const score = await this.getScore(cooperativeId);
    if (!score) return [];

    const commodities = await commodityRepository.getByCooperativeId(cooperativeId);
    return generateCooperativeInsights(coop, commodities, score);
  }

  async getAllWithDetails(): Promise<CooperativeWithCommodities[]> {
    const coops = await this.getAll();
    const maxRev = await this.getMaxRevenue();
    
    return Promise.all(
      coops.map(async (coop) => {
        const commodities = await commodityRepository.getByCooperativeId(coop.id);
        const score = calculateCooperativeScore(coop, commodities, maxRev);
        const insights = generateCooperativeInsights(coop, commodities, score);
        return {
          ...coop,
          commodities,
          score,
          insights
        };
      })
    );
  }

  async getByIdWithDetails(id: string): Promise<CooperativeWithCommodities | null> {
    const coop = await this.getById(id);
    if (!coop) return null;

    const commodities = await commodityRepository.getByCooperativeId(id);
    const score = await this.getScore(id);
    const insights = await this.getInsights(id);

    return {
      ...coop,
      commodities,
      score: score || undefined,
      insights
    };
  }

  async updateCommodityStock(coopId: string, commId: string, newStock: number): Promise<void> {
    const commRef = doc(db, 'commodities', commId);
    const snap = await getDoc(commRef);
    if (snap.exists()) {
      await updateDoc(commRef, {
        available_stock: Math.max(0, newStock)
      });
    }
  }

  async updateCooperative(id: string, data: Partial<Omit<Cooperative, 'id'>>): Promise<void> {
    await updateDoc(doc(db, 'cooperatives', id), data);
  }
}

export const cooperativeRepository: CooperativeRepository = new FirestoreCooperativeRepository();

import { Cooperative, CooperativeScore, Insight, CooperativeWithCommodities } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { calculateCooperativeScore } from '../services/score-engine';
import { generateCooperativeInsights } from '../services/insight-engine';
import { commodityRepository } from './commodity.repository';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  // Fallback for Vercel/production or dev environments
  const host = process.env.VERCEL_URL || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

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
  verifyCooperativeDocs(coopId: string, type: 'nib' | 'sk', status: 'verified' | 'rejected'): Promise<void>;
}

export class HybridCooperativeRepository implements CooperativeRepository {
  async getAll(): Promise<Cooperative[]> {
    try {
      // 1. Fetch baseline data from PostgreSQL via API
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/cooperatives`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch from PG API');
      const pgList: Cooperative[] = await res.json();

      // 2. Fetch Firestore overrides
      const overridesSnap = await getDocs(collection(db, 'cooperatives'));
      const overridesMap: Record<string, Partial<Cooperative>> = {};
      overridesSnap.forEach((docSnap) => {
        overridesMap[docSnap.id] = docSnap.data() as Partial<Cooperative>;
      });

      // 3. Merge baseline and overrides
      return pgList.map(coop => {
        const override = overridesMap[coop.id];
        if (override) {
          return { ...coop, ...override };
        }
        return coop;
      });
    } catch (error) {
      console.error('Error in cooperativeRepository.getAll:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Cooperative | null> {
    if (!id) return null;
    try {
      // 1. Fetch baseline data from PostgreSQL
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/cooperatives?id=${id}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const pgCoop: Cooperative = await res.json();

      // 2. Fetch Firestore override
      const overrideSnap = await getDoc(doc(db, 'cooperatives', id));
      if (overrideSnap.exists()) {
        return { ...pgCoop, ...overrideSnap.data() } as Cooperative;
      }
      return pgCoop;
    } catch (error) {
      console.error(`Error in cooperativeRepository.getById for ${id}:`, error);
      return null;
    }
  }

  async getMaxRevenue(): Promise<number> {
    const list = await this.getAll();
    if (list.length === 0) return 0;
    return Math.max(...list.map(c => c.annual_revenue), 1);
  }

  async getScore(cooperativeId: string): Promise<CooperativeScore | null> {
    // 1. Check if score already exists in Firestore
    const scoreSnap = await getDoc(doc(db, 'scores', cooperativeId));
    if (scoreSnap.exists()) {
      return { id: scoreSnap.id, ...scoreSnap.data() } as CooperativeScore;
    }

    // 2. Otherwise calculate dynamic score
    const coop = await this.getById(cooperativeId);
    if (!coop) return null;

    const maxRev = await this.getMaxRevenue();
    const commodities = await commodityRepository.getByCooperativeId(cooperativeId);
    return calculateCooperativeScore(coop, commodities, maxRev);
  }

  private async generateInsightsForCooperative(cooperativeId: string): Promise<Insight[]> {
    const coop = await this.getById(cooperativeId);
    if (!coop) return [];

    const score = await this.getScore(cooperativeId);
    if (!score) return [];

    const commodities = await commodityRepository.getByCooperativeId(cooperativeId);
    return generateCooperativeInsights(coop, commodities, score);
  }

  async getInsights(cooperativeId: string): Promise<Insight[]> {
    const generate = () => this.generateInsightsForCooperative(cooperativeId);

    if (typeof window !== 'undefined') {
      try {
        const baseUrl = getBaseUrl();
        const res = await fetch(
          `${baseUrl}/api/insights?cooperativeId=${encodeURIComponent(cooperativeId)}`,
          { cache: 'no-store' },
        );
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        console.error(`Error in cooperativeRepository.getInsights for ${cooperativeId}:`, error);
        return [];
      }
    }

    const { loadOrGenerateCooperativeInsights } = await import('../services/insight-persistence');
    return loadOrGenerateCooperativeInsights(cooperativeId, generate);
  }

  async getAllWithDetails(): Promise<CooperativeWithCommodities[]> {
    const coops = await this.getAll();
    const maxRev = await this.getMaxRevenue();
    
    return Promise.all(
      coops.map(async (coop) => {
        const commodities = await commodityRepository.getByCooperativeId(coop.id);
        const score = await this.getScore(coop.id) || calculateCooperativeScore(coop, commodities, maxRev);
        const insights = await this.getInsights(coop.id);
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
    // Save stock update to Firestore as an override
    const commRef = doc(db, 'commodities', commId);
    await setDoc(commRef, {
      id: commId,
      cooperative_id: coopId,
      available_stock: Math.max(0, newStock),
      updated_at: new Date().toISOString()
    }, { merge: true });
  }

  async updateCooperative(id: string, data: Partial<Omit<Cooperative, 'id'>>): Promise<void> {
    await setDoc(doc(db, 'cooperatives', id), data, { merge: true });
  }

  async verifyCooperativeDocs(coopId: string, type: 'nib' | 'sk', status: 'verified' | 'rejected'): Promise<void> {
    const updateData: any = {};
    if (type === 'nib') {
      updateData.nib_status = status;
    } else {
      updateData.sk_status = status;
    }

    const coopRef = doc(db, 'cooperatives', coopId);
    await setDoc(coopRef, updateData, { merge: true });

    // Dynamic ARUNA Score calculation after verification
    const updatedCoop = await this.getById(coopId);
    if (updatedCoop) {
      const commodities = await commodityRepository.getByCooperativeId(coopId);
      const maxRev = await this.getMaxRevenue();
      const newScore = calculateCooperativeScore(updatedCoop, commodities, maxRev);

      // Save updated score to Firestore
      const scoreRef = doc(db, 'scores', coopId);
      await setDoc(scoreRef, {
        cooperative_id: coopId,
        health_score: newScore.health_score,
        growth_score: newScore.growth_score,
        supply_score: newScore.supply_score,
        final_score: newScore.final_score,
        grade: newScore.grade,
        updated_at: new Date().toISOString()
      });
    }
  }
}

export const cooperativeRepository: CooperativeRepository = new HybridCooperativeRepository();

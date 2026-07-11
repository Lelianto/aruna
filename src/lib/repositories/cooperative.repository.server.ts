import 'server-only';

import {
  Cooperative,
  CooperativeScore,
  CooperativeScoreInput,
  Insight,
  CooperativeWithCommodities,
  Commodity,
} from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { calculateCooperativeScore } from '../services/score-engine';
import { generateCooperativeInsights } from '../services/insight-engine';
import { loadAllCooperativesFromPg, loadCooperativeByIdFromPg } from '../data/cooperatives.pg';
import { commodityRepositoryServer } from './commodity.repository.server';
import type { CooperativeRepository } from './cooperative.repository';

export class ServerCooperativeRepository implements CooperativeRepository {
  async getAll(): Promise<Cooperative[]> {
    try {
      const pgList = await loadAllCooperativesFromPg();
      const overridesSnap = await getDocs(collection(db, 'cooperatives'));
      const overridesMap: Record<string, Partial<Cooperative>> = {};
      overridesSnap.forEach((docSnap) => {
        overridesMap[docSnap.id] = docSnap.data() as Partial<Cooperative>;
      });

      return pgList.map((coop) => {
        const override = overridesMap[coop.id];
        return override ? { ...coop, ...override } : coop;
      });
    } catch (error) {
      console.error('Error in cooperativeRepositoryServer.getAll:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Cooperative | null> {
    if (!id) return null;
    try {
      const pgCoop = await loadCooperativeByIdFromPg(id);
      if (!pgCoop) return null;

      const overrideSnap = await getDoc(doc(db, 'cooperatives', id));
      if (overrideSnap.exists()) {
        return { ...pgCoop, ...overrideSnap.data() } as Cooperative;
      }
      return pgCoop;
    } catch (error) {
      console.error(`Error in cooperativeRepositoryServer.getById for ${id}:`, error);
      return null;
    }
  }

  async getMaxRevenue(): Promise<number> {
    const list = await this.getAll();
    if (list.length === 0) return 0;
    return Math.max(...list.map((c) => c.annual_revenue), 1);
  }

  async getScore(cooperativeId: string): Promise<CooperativeScore | null> {
    try {
      const { loadCooperativeScore } = await import('../services/score-persistence');
      const stored = await loadCooperativeScore(cooperativeId);
      if (stored) return stored;
    } catch (error) {
      console.error(`Error in cooperativeRepositoryServer.getScore for ${cooperativeId}:`, error);
    }

    const coop = await this.getById(cooperativeId);
    if (!coop) return null;

    const maxRev = await this.getMaxRevenue();
    const commodities = await commodityRepositoryServer.getByCooperativeId(cooperativeId);
    return calculateCooperativeScore(coop, commodities, maxRev);
  }

  async upsertCooperativeScore(cooperativeId: string, scoreData: CooperativeScoreInput): Promise<void> {
    const { upsertCooperativeScore } = await import('../services/score-persistence');
    await upsertCooperativeScore(cooperativeId, scoreData);
  }

  async deleteCooperativeScore(cooperativeId: string): Promise<void> {
    const { deleteCooperativeScore } = await import('../services/score-persistence');
    await deleteCooperativeScore(cooperativeId);
  }

  async getInsights(cooperativeId: string): Promise<Insight[]> {
    const generate = async () => {
      const coop = await this.getById(cooperativeId);
      if (!coop) return [];

      const score = await this.getScore(cooperativeId);
      if (!score) return [];

      const commodities = await commodityRepositoryServer.getByCooperativeId(cooperativeId);
      return generateCooperativeInsights(coop, commodities, score);
    };

    try {
      const { loadOrGenerateCooperativeInsights } = await import('../services/insight-persistence');
      return await loadOrGenerateCooperativeInsights(cooperativeId, generate);
    } catch (error) {
      console.error(`Error in cooperativeRepositoryServer.getInsights for ${cooperativeId}:`, error);
      return [];
    }
  }

  async getAllWithDetails(): Promise<CooperativeWithCommodities[]> {
    const [coops, allCommodities, scoresSnap] = await Promise.all([
      this.getAll(),
      commodityRepositoryServer.getAll(),
      getDocs(collection(db, 'scores')),
    ]);

    const commoditiesByCoop = new Map<string, Commodity[]>();
    for (const com of allCommodities) {
      const list = commoditiesByCoop.get(com.cooperative_id);
      if (list) {
        list.push(com);
      } else {
        commoditiesByCoop.set(com.cooperative_id, [com]);
      }
    }

    const scoresMap: Record<string, CooperativeScore> = {};
    scoresSnap.forEach((docSnap) => {
      scoresMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as CooperativeScore;
    });

    const maxRev = coops.length > 0 ? Math.max(...coops.map((c) => c.annual_revenue || 0), 1) : 1;

    return coops.map((coop) => {
      const commodities = commoditiesByCoop.get(coop.id) || [];
      const score = scoresMap[coop.id] || calculateCooperativeScore(coop, commodities, maxRev);
      const insights = generateCooperativeInsights(coop, commodities, score);
      return {
        ...coop,
        commodities,
        score,
        insights,
      };
    });
  }

  async getByIdWithDetails(id: string): Promise<CooperativeWithCommodities | null> {
    const coop = await this.getById(id);
    if (!coop) return null;

    const commodities = await commodityRepositoryServer.getByCooperativeId(id);
    const score = await this.getScore(id);
    const insights = await this.getInsights(id);

    return {
      ...coop,
      commodities,
      score: score || undefined,
      insights,
    };
  }

  async updateCommodityStock(coopId: string, commId: string, newStock: number): Promise<void> {
    const commRef = doc(db, 'commodities', commId);
    await setDoc(commRef, {
      id: commId,
      cooperative_id: coopId,
      available_stock: Math.max(0, newStock),
      updated_at: new Date().toISOString(),
    }, { merge: true });
  }

  async updateCooperative(id: string, data: Partial<Omit<Cooperative, 'id'>>): Promise<void> {
    await setDoc(doc(db, 'cooperatives', id), data, { merge: true });
  }

  async verifyCooperativeDocs(coopId: string, type: 'nib' | 'sk', status: 'verified' | 'rejected'): Promise<void> {
    const updateData: Record<string, string> = {};
    if (type === 'nib') {
      updateData.nib_status = status;
    } else {
      updateData.sk_status = status;
    }

    const coopRef = doc(db, 'cooperatives', coopId);
    await setDoc(coopRef, updateData, { merge: true });

    const updatedCoop = await this.getById(coopId);
    if (updatedCoop) {
      const commodities = await commodityRepositoryServer.getByCooperativeId(coopId);
      const maxRev = await this.getMaxRevenue();
      const newScore = calculateCooperativeScore(updatedCoop, commodities, maxRev);

      await this.upsertCooperativeScore(coopId, {
        health_score: newScore.health_score,
        growth_score: newScore.growth_score,
        supply_score: newScore.supply_score,
        final_score: newScore.final_score,
        grade: newScore.grade,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

export const cooperativeRepositoryServer: CooperativeRepository = new ServerCooperativeRepository();

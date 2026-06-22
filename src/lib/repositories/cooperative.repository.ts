import { Cooperative, CooperativeScore, Insight, CooperativeWithCommodities } from '@/types';
import mockData from '../mock/data.json';
import { calculateCooperativeScore } from '../services/score-engine';
import { generateCooperativeInsights } from '../services/insight-engine';

export interface CooperativeRepository {
  getAll(): Promise<Cooperative[]>;
  getById(id: string): Promise<Cooperative | null>;
  getScore(cooperativeId: string): Promise<CooperativeScore | null>;
  getInsights(cooperativeId: string): Promise<Insight[]>;
  getAllWithDetails(): Promise<CooperativeWithCommodities[]>;
  getByIdWithDetails(id: string): Promise<CooperativeWithCommodities | null>;
  getMaxRevenue(): Promise<number>;
}

export class MockCooperativeRepository implements CooperativeRepository {
  private cooperatives: Cooperative[] = mockData.cooperatives;

  async getAll(): Promise<Cooperative[]> {
    // Simulate network delay
    return new Promise((resolve) => setTimeout(() => resolve(this.cooperatives), 50));
  }

  async getById(id: string): Promise<Cooperative | null> {
    const coop = this.cooperatives.find(c => c.id === id);
    return new Promise((resolve) => setTimeout(() => resolve(coop || null), 50));
  }

  async getMaxRevenue(): Promise<number> {
    if (this.cooperatives.length === 0) return 0;
    return Math.max(...this.cooperatives.map(c => c.annual_revenue), 1);
  }

  async getScore(cooperativeId: string): Promise<CooperativeScore | null> {
    const coop = this.cooperatives.find(c => c.id === cooperativeId);
    if (!coop) return null;
    
    const maxRev = await this.getMaxRevenue();
    const commodities = mockData.commodities.filter(c => c.cooperative_id === cooperativeId);
    const score = calculateCooperativeScore(coop, commodities, maxRev);
    return new Promise((resolve) => resolve(score));
  }

  async getInsights(cooperativeId: string): Promise<Insight[]> {
    const coop = this.cooperatives.find(c => c.id === cooperativeId);
    if (!coop) return [];

    const score = await this.getScore(cooperativeId);
    if (!score) return [];

    const commodities = mockData.commodities.filter(c => c.cooperative_id === cooperativeId);
    const insights = generateCooperativeInsights(coop, commodities, score);
    return new Promise((resolve) => resolve(insights));
  }

  async getAllWithDetails(): Promise<CooperativeWithCommodities[]> {
    const maxRev = await this.getMaxRevenue();
    const result = await Promise.all(
      this.cooperatives.map(async (coop) => {
        const commodities = mockData.commodities.filter(c => c.cooperative_id === coop.id);
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
    return result;
  }

  async getByIdWithDetails(id: string): Promise<CooperativeWithCommodities | null> {
    const coop = this.cooperatives.find(c => c.id === id);
    if (!coop) return null;

    const commodities = mockData.commodities.filter(c => c.cooperative_id === id);
    const score = await this.getScore(id);
    const insights = await this.getInsights(id);

    return {
      ...coop,
      commodities,
      score: score || undefined,
      insights
    };
  }
}

// Export a singleton instance of the repository
export const cooperativeRepository: CooperativeRepository = new MockCooperativeRepository();

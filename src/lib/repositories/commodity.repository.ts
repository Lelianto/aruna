import { Commodity } from '@/types';
import mockData from '../mock/data.json';

export interface CommodityRepository {
  getAll(): Promise<Commodity[]>;
  getById(id: string): Promise<Commodity | null>;
  getByCooperativeId(cooperativeId: string): Promise<Commodity[]>;
  getUniqueNames(): Promise<string[]>;
  getTotalsByCategory(): Promise<Record<string, { capacity: number; stock: number }>>;
}

export class MockCommodityRepository implements CommodityRepository {
  private commodities: Commodity[] = mockData.commodities;

  async getAll(): Promise<Commodity[]> {
    return new Promise((resolve) => setTimeout(() => resolve(this.commodities), 50));
  }

  async getById(id: string): Promise<Commodity | null> {
    const com = this.commodities.find(c => c.id === id);
    return new Promise((resolve) => setTimeout(() => resolve(com || null), 50));
  }

  async getByCooperativeId(cooperativeId: string): Promise<Commodity[]> {
    const list = this.commodities.filter(c => c.cooperative_id === cooperativeId);
    return new Promise((resolve) => resolve(list));
  }

  async getUniqueNames(): Promise<string[]> {
    const names = Array.from(new Set(this.commodities.map(c => c.name)));
    return new Promise((resolve) => resolve(names.sort()));
  }

  async getTotalsByCategory(): Promise<Record<string, { capacity: number; stock: number }>> {
    const totals: Record<string, { capacity: number; stock: number }> = {};
    for (const c of this.commodities) {
      if (!totals[c.category]) {
        totals[c.category] = { capacity: 0, stock: 0 };
      }
      totals[c.category].capacity += c.monthly_capacity;
      totals[c.category].stock += c.available_stock;
    }
    return new Promise((resolve) => resolve(totals));
  }
}

export const commodityRepository: CommodityRepository = new MockCommodityRepository();

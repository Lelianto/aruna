import { Buyer } from '@/types';
import mockData from '../mock/data.json';

export interface BuyerRepository {
  getAll(): Promise<Buyer[]>;
  getById(id: string): Promise<Buyer | null>;
}

export class MockBuyerRepository implements BuyerRepository {
  private buyers: Buyer[] = mockData.buyers;

  async getAll(): Promise<Buyer[]> {
    return new Promise((resolve) => resolve(this.buyers));
  }

  async getById(id: string): Promise<Buyer | null> {
    const b = this.buyers.find(x => x.id === id);
    return new Promise((resolve) => resolve(b || null));
  }
}

export const buyerRepository: BuyerRepository = new MockBuyerRepository();

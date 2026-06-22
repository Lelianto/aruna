import { MarketRequest, MarketRequestWithBuyer } from '@/types';
import mockData from '../mock/data.json';
import { buyerRepository } from './buyer.repository';

export interface MarketRequestRepository {
  getAll(): Promise<MarketRequest[]>;
  getById(id: string): Promise<MarketRequest | null>;
  getAllWithBuyer(): Promise<MarketRequestWithBuyer[]>;
  getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null>;
}

export class MockMarketRequestRepository implements MarketRequestRepository {
  private requests: MarketRequest[] = mockData.market_requests as MarketRequest[];

  async getAll(): Promise<MarketRequest[]> {
    return new Promise((resolve) => resolve(this.requests));
  }

  async getById(id: string): Promise<MarketRequest | null> {
    const r = this.requests.find(x => x.id === id);
    return new Promise((resolve) => resolve(r || null));
  }

  async getAllWithBuyer(): Promise<MarketRequestWithBuyer[]> {
    const buyers = await buyerRepository.getAll();
    const result = this.requests.map(req => {
      const buyer = buyers.find(b => b.id === req.buyer_id);
      return {
        ...req,
        buyer: buyer || { id: req.buyer_id, company_name: 'Unknown Buyer', city: 'Unknown', industry: 'Unknown' }
      };
    });
    return new Promise((resolve) => resolve(result));
  }

  async getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null> {
    const req = this.requests.find(x => x.id === id);
    if (!req) return null;
    
    const buyer = await buyerRepository.getById(req.buyer_id);
    return {
      ...req,
      buyer: buyer || { id: req.buyer_id, company_name: 'Unknown Buyer', city: 'Unknown', industry: 'Unknown' }
    };
  }
}

export const marketRequestRepository: MarketRequestRepository = new MockMarketRequestRepository();

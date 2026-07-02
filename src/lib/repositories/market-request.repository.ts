import { MarketRequest, MarketRequestWithBuyer } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { seedDatabaseIfEmpty } from '../firebase/seeder';
import { buyerRepository } from './buyer.repository';

export interface MarketRequestRepository {
  getAll(): Promise<MarketRequest[]>;
  getById(id: string): Promise<MarketRequest | null>;
  getAllWithBuyer(): Promise<MarketRequestWithBuyer[]>;
  getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null>;
}

export class FirestoreMarketRequestRepository implements MarketRequestRepository {
  async getAll(): Promise<MarketRequest[]> {
    await seedDatabaseIfEmpty();
    const snap = await getDocs(collection(db, 'market_requests'));
    const list: MarketRequest[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as MarketRequest);
    });
    return list;
  }

  async getById(id: string): Promise<MarketRequest | null> {
    await seedDatabaseIfEmpty();
    const snap = await getDoc(doc(db, 'market_requests', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as MarketRequest;
  }

  async getAllWithBuyer(): Promise<MarketRequestWithBuyer[]> {
    const list = await this.getAll();
    const buyers = await buyerRepository.getAll();
    return list.map(req => {
      const buyer = buyers.find(b => b.id === req.buyer_id);
      return {
        ...req,
        buyer: buyer || { id: req.buyer_id, company_name: 'Unknown Buyer', city: 'Unknown', industry: 'Unknown' }
      };
    });
  }

  async getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null> {
    const req = await this.getById(id);
    if (!req) return null;
    
    const buyer = await buyerRepository.getById(req.buyer_id);
    return {
      ...req,
      buyer: buyer || { id: req.buyer_id, company_name: 'Unknown Buyer', city: 'Unknown', industry: 'Unknown' }
    };
  }
}

export const marketRequestRepository: MarketRequestRepository = new FirestoreMarketRequestRepository();

import { MarketRequest, MarketRequestWithBuyer } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { seedDatabaseIfEmpty } from '../firebase/seeder';
import { buyerRepository } from './buyer.repository';

export interface MarketRequestRepository {
  getAll(): Promise<MarketRequest[]>;
  getById(id: string): Promise<MarketRequest | null>;
  getAllWithBuyer(): Promise<MarketRequestWithBuyer[]>;
  getByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null>;
  create(request: Omit<MarketRequest, 'id'>): Promise<string>;
  approvePayment(request: MarketRequest): Promise<void>;
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

  async create(request: Omit<MarketRequest, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'market_requests'), {
      ...request,
      created_at: new Date().toISOString()
    });
    return docRef.id;
  }

  // Verifikasi pembayaran oleh admin: kurangi stok komoditas koperasi penyuplai
  // (berdasarkan supply match), lalu tandai permintaan sebagai 'Terpenuhi'.
  // Logika ini disamakan dengan alur approve di MarketplaceClient agar konsisten.
  async approvePayment(request: MarketRequest): Promise<void> {
    // 1. Cari alokasi pasok (supply match) untuk permintaan ini
    const matchSnap = await getDocs(collection(db, 'supply_matches'));
    let matchedCoopId: string | null = null;
    matchSnap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.request_id === request.id) {
        matchedCoopId = d.cooperative_id as string;
      }
    });

    // 2. Jika ada, kurangi stok komoditas koperasi terkait
    if (matchedCoopId) {
      const comSnap = await getDocs(collection(db, 'commodities'));
      let targetComId: string | null = null;
      let currentStock = 0;
      comSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (
          d.cooperative_id === matchedCoopId &&
          typeof d.name === 'string' &&
          d.name.toLowerCase() === request.commodity_name.toLowerCase()
        ) {
          targetComId = docSnap.id;
          currentStock = d.available_stock || 0;
        }
      });

      if (targetComId) {
        await updateDoc(doc(db, 'commodities', targetComId), {
          available_stock: Math.max(0, currentStock - request.quantity)
        });
      }
    }

    // 3. Tandai permintaan sebagai Terpenuhi
    await updateDoc(doc(db, 'market_requests', request.id), { status: 'Terpenuhi' });
  }
}

export const marketRequestRepository: MarketRequestRepository = new FirestoreMarketRequestRepository();

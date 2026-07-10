import { Buyer } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { seedDatabaseIfEmpty } from '../firebase/seeder';

export interface BuyerRepository {
  getAll(): Promise<Buyer[]>;
  getById(id: string): Promise<Buyer | null>;
  setVerified(id: string, verified: boolean): Promise<void>;
}

export class FirestoreBuyerRepository implements BuyerRepository {
  async getAll(): Promise<Buyer[]> {
    await seedDatabaseIfEmpty();
    const snap = await getDocs(collection(db, 'buyers'));
    const list: Buyer[] = [];
    snap.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Buyer);
    });
    return list;
  }

  async getById(id: string): Promise<Buyer | null> {
    await seedDatabaseIfEmpty();
    const docRef = doc(db, 'buyers', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Buyer;
  }

  // Validasi manual oleh admin: set status terverifikasi sebuah buyer.
  async setVerified(id: string, verified: boolean): Promise<void> {
    await setDoc(doc(db, 'buyers', id), { verified }, { merge: true });
  }
}

export const buyerRepository: BuyerRepository = new FirestoreBuyerRepository();

import { HelpKnowledgeEntry } from '@/types';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { seedHelpKnowledgeIfEmpty, HELP_KNOWLEDGE_COLLECTION } from '../firebase/seeder';
import { cached } from '../cache';

export interface HelpKnowledgeRepository {
  getAll(): Promise<HelpKnowledgeEntry[]>;
}

// Reads the "Aruna Help" product-knowledge collection — a Firestore
// collection dedicated to the cooperative-dashboard help chatbot, kept
// separate from operational collections (commodities, sales, members, etc).
export class FirestoreHelpKnowledgeRepository implements HelpKnowledgeRepository {
  async getAll(): Promise<HelpKnowledgeEntry[]> {
    await seedHelpKnowledgeIfEmpty();
    // Product knowledge changes rarely, so cache briefly per server instance
    // to avoid re-reading Firestore on every chat message.
    return cached('help-knowledge-base', 5 * 60 * 1000, async () => {
      const snap = await getDocs(collection(db, HELP_KNOWLEDGE_COLLECTION));
      const list: HelpKnowledgeEntry[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as HelpKnowledgeEntry);
      });
      return list;
    });
  }
}

export const helpKnowledgeRepository: HelpKnowledgeRepository = new FirestoreHelpKnowledgeRepository();

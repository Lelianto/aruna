import { db } from './config';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import mockData from '../mock/data.json';
import helpKnowledgeData from '../mock/help-knowledge.json';

// Collection Firestore terpisah, khusus untuk basis pengetahuan (product
// knowledge) chatbot "Aruna Help". Terisolasi dari data operasional koperasi
// (commodities, sales, dll) sehingga aman diberi aturan akses Firestore yang
// berbeda di masa depan jika diperlukan.
export const HELP_KNOWLEDGE_COLLECTION = 'help_knowledge_base';

export async function seedDatabaseIfEmpty() {
  try {
    const coopSnap = await getDocs(collection(db, 'cooperatives'));
    if (!coopSnap.empty) {
      console.log('Firestore is already seeded.');
      return;
    }

    console.log('Firestore is empty. Starting seeding process...');

    // 1. Seed Buyers
    console.log('Seeding buyers...');
    for (const buyer of mockData.buyers as any[]) {
      await setDoc(doc(db, 'buyers', buyer.id), {
        id: buyer.id,
        company_name: buyer.company_name,
        city: buyer.city,
        industry: buyer.industry,
        buyer_type: buyer.buyer_type || 'industri',
        nib: buyer.nib || '',
        siup: buyer.siup || '',
        verified: buyer.verified || false
      });
    }

    // 2. Seed Cooperatives
    console.log('Seeding cooperatives...');
    for (const coop of mockData.cooperatives as any[]) {
      await setDoc(doc(db, 'cooperatives', coop.id), {
        id: coop.id,
        name: coop.name,
        province: coop.province,
        city: coop.city,
        latitude: coop.latitude,
        longitude: coop.longitude,
        member_count: coop.member_count,
        active_members: coop.active_members,
        annual_revenue: coop.annual_revenue,
        simkopdes_id: coop.simkopdes_id || `KDKMP-${Math.floor(10000 + Math.random() * 90000)}`,
        nib: coop.nib || null,
        nib_document_url: coop.nib_document_url || null,
        nib_status: coop.nib_status || 'unsubmitted',
        sk_number: coop.sk_number || null,
        sk_document_url: coop.sk_document_url || null,
        sk_status: coop.sk_status || 'unsubmitted',
        cash_reserve: coop.cash_reserve || 50000000
      });
    }

    // 3. Seed Commodities
    console.log('Seeding commodities...');
    for (const comm of mockData.commodities) {
      await setDoc(doc(db, 'commodities', comm.id), {
        id: comm.id,
        cooperative_id: comm.cooperative_id,
        name: comm.name,
        category: comm.category,
        monthly_capacity: comm.monthly_capacity,
        available_stock: comm.available_stock,
        unit: comm.unit,
        harvest_period: comm.harvest_period
      });
    }

    // 4. Seed Market Requests
    console.log('Seeding market requests...');
    for (const req of mockData.market_requests) {
      await setDoc(doc(db, 'market_requests', req.id), {
        id: req.id,
        buyer_id: req.buyer_id,
        commodity_name: req.commodity_name,
        quantity: req.quantity,
        unit: req.unit,
        status: req.status
      });
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding Firestore database:', error);
  }
}

/**
 * Seeds the "help_knowledge_base" collection — a Firestore collection
 * dedicated to the ARUNA Help chatbot's product knowledge. Kept separate
 * from operational collections (commodities, sales, purchases, etc.) and
 * only ever seeded/read, never mutated by regular cooperative operations.
 */
export async function seedHelpKnowledgeIfEmpty() {
  try {
    const snap = await getDocs(collection(db, HELP_KNOWLEDGE_COLLECTION));
    if (!snap.empty) {
      return;
    }

    console.log('Seeding Aruna Help knowledge base...');
    for (const entry of helpKnowledgeData as any[]) {
      await setDoc(doc(db, HELP_KNOWLEDGE_COLLECTION, entry.id), entry);
    }
    console.log('Aruna Help knowledge base seeded successfully!');
  } catch (error) {
    console.error('Error seeding Aruna Help knowledge base:', error);
  }
}

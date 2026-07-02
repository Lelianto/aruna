import { db } from './config';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import mockData from '../mock/data.json';

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
    for (const buyer of mockData.buyers) {
      await setDoc(doc(db, 'buyers', buyer.id), {
        id: buyer.id,
        company_name: buyer.company_name,
        city: buyer.city,
        industry: buyer.industry
      });
    }

    // 2. Seed Cooperatives
    console.log('Seeding cooperatives...');
    for (const coop of mockData.cooperatives) {
      await setDoc(doc(db, 'cooperatives', coop.id), {
        id: coop.id,
        name: coop.name,
        province: coop.province,
        city: coop.city,
        latitude: coop.latitude,
        longitude: coop.longitude,
        member_count: coop.member_count,
        active_members: coop.active_members,
        annual_revenue: coop.annual_revenue
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

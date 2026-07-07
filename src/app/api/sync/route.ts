import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  getDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { entity_type, action, payload } = await request.json();

    if (!entity_type || !action || !payload) {
      return NextResponse.json({ error: 'Missing required parameters: entity_type, action, payload' }, { status: 400 });
    }

    console.log(`Sync request received: ${entity_type} ${action} for ID ${payload.id}`);

    let realId = payload.id;
    let tempId: string | null = null;

    switch (entity_type) {
      case 'product': {
        const isNew = payload.id.startsWith('new-') || action === 'create';
        const docRef = isNew 
          ? doc(collection(db, 'commodities')) 
          : doc(db, 'commodities', payload.id);
        
        realId = docRef.id;
        if (isNew) tempId = payload.id;

        await setDoc(docRef, {
          ...payload,
          id: realId,
          updated_at: new Date().toISOString()
        });
        break;
      }

      case 'member': {
        const isNew = payload.id.startsWith('mem-') || action === 'create';
        const docRef = isNew 
          ? doc(collection(db, 'members')) 
          : doc(db, 'members', payload.id);

        realId = docRef.id;
        if (isNew) tempId = payload.id;

        await setDoc(docRef, {
          ...payload,
          id: realId,
          joined_at: payload.joined_at || new Date().toISOString()
        });
        break;
      }

      case 'sale': {
        // 1. Save Sales transaction
        await setDoc(doc(db, 'sales', payload.id), {
          ...payload,
          status: 'synced',
          updated_at: new Date().toISOString()
        });

        // 2. Decrement available stock in commodities collection
        for (const item of payload.items) {
          const commodityRef = doc(db, 'commodities', item.commodity_id);
          const snap = await getDoc(commodityRef);
          if (snap.exists()) {
            const currentStock = snap.data().available_stock || 0;
            // Ensure stock doesn't fall below zero on server unless adjustment logic accepts it
            const newStock = Math.max(0, currentStock - item.quantity);
            await updateDoc(commodityRef, { available_stock: newStock });
          }
        }
        break;
      }

      case 'purchase': {
        // 1. Save Purchase transaction
        await setDoc(doc(db, 'purchases', payload.id), {
          ...payload,
          status: 'synced',
          updated_at: new Date().toISOString()
        });

        // 2. Increment available stock in commodities collection
        for (const item of payload.items) {
          const commodityRef = doc(db, 'commodities', item.commodity_id);
          const snap = await getDoc(commodityRef);
          if (snap.exists()) {
            const currentStock = snap.data().available_stock || 0;
            const newStock = currentStock + item.quantity;
            await updateDoc(commodityRef, { available_stock: newStock });
          } else {
            // If commodity doesn't exist, create it
            await setDoc(commodityRef, {
              id: item.commodity_id,
              cooperative_id: payload.cooperative_id,
              name: item.commodity_name,
              category: 'Pangan',
              available_stock: item.quantity,
              monthly_capacity: item.quantity * 2, // arbitrary default
              unit: item.unit,
              harvest_period: 'Pengadaan Masuk'
            });
          }
        }
        break;
      }

      case 'stock': {
        const commodityRef = doc(db, 'commodities', payload.id);
        await updateDoc(commodityRef, {
          available_stock: Math.max(0, payload.available_stock)
        });
        break;
      }

      case 'stock_opname': {
        // 1. Record stock opname audit
        await setDoc(doc(db, 'stock_opnames', payload.id), {
          ...payload,
          status: 'synced',
          created_at: payload.created_at || new Date().toISOString()
        });

        // 2. Adjust available stock value directly
        const commodityRef = doc(db, 'commodities', payload.commodity_id);
        await updateDoc(commodityRef, {
          available_stock: Math.max(0, payload.actual_stock)
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported entity type: ${entity_type}` }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      tempId, 
      realId 
    });

  } catch (error: any) {
    console.error('Error syncing entity to server database:', error);
    return NextResponse.json({ error: error.message || 'Sync operation failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  getDoc, 
  updateDoc, 
  increment,
  deleteDoc
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

function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeUnit(unit: string): string {
  if (!unit) return 'Kg';
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'kg' || normalized === 'kilo') return 'Kg';
  if (normalized === 'ton') return 'Ton';
  if (normalized === 'liter' || normalized === 'ltr') return 'Liter';
  if (normalized === 'butir') return 'Butir';
  if (normalized === 'rak') return 'Rak';
  if (normalized === 'karung') return 'Karung';
  if (normalized === 'bungkus' || normalized === 'bks') return 'Bungkus';
  if (normalized === 'ikat') return 'Ikat';
  if (normalized === 'pcs' || normalized === 'pc') return 'Pcs';
  return unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
}

    switch (entity_type) {
      case 'product': {
        if (action === 'delete') {
          const docRef = doc(db, 'commodities', payload.id);
          await deleteDoc(docRef);
        } else {
          const isNew = payload.id.startsWith('new-');
          const docRef = isNew 
            ? doc(collection(db, 'commodities')) 
            : doc(db, 'commodities', payload.id);
          
          realId = docRef.id;
          if (isNew) tempId = payload.id;

          await setDoc(docRef, {
            ...payload,
            name: normalizeProductName(payload.name),
            unit: normalizeUnit(payload.unit),
            id: realId,
            updated_at: new Date().toISOString()
          });
        }
        break;
      }

      case 'member': {
        const isNew = payload.id.startsWith('mem-');
        const docRef = isNew 
          ? doc(collection(db, 'members')) 
          : doc(db, 'members', payload.id);

        realId = docRef.id;
        if (isNew) tempId = payload.id;

        await setDoc(docRef, {
          ...payload,
          name: normalizeProductName(payload.name),
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
          if (!item.commodity_id) continue;
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
          if (!item.commodity_id) continue;
          const commodityRef = doc(db, 'commodities', item.commodity_id);
          const snap = await getDoc(commodityRef);
          if (snap.exists()) {
            const currentStock = snap.data().available_stock || 0;
            const newStock = currentStock + item.quantity;
            await updateDoc(commodityRef, { available_stock: newStock });
          } else {
            // If commodity doesn't exist, create it with normalized fields and a generated SKU
            const skuName = item.commodity_name || 'PROD';
            const cleanSkuName = skuName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
            const skuNum = Math.floor(100 + Math.random() * 900);
            const sku = `SKU-${cleanSkuName}-${skuNum}`;

            await setDoc(commodityRef, {
              id: item.commodity_id,
              cooperative_id: payload.cooperative_id,
              name: normalizeProductName(item.commodity_name),
              sku: sku,
              category: 'Pangan',
              available_stock: item.quantity,
              monthly_capacity: item.quantity * 2, // arbitrary default
              unit: normalizeUnit(item.unit),
              harvest_period: 'Sepanjang Tahun',
              created_at: new Date().toISOString()
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

import Dexie, { type Table } from 'dexie';
import { 
  Member, 
  Commodity, 
  POSTransaction, 
  PurchaseTransaction, 
  StockOpname, 
  SyncQueueItem, 
  CollaborativeProcurement, 
  CooperativeConnectorTrade 
} from '@/types';

class LocalCoopDatabase extends Dexie {
  members!: Table<Member, string>;
  commodities!: Table<Commodity, string>;
  transactions!: Table<POSTransaction, string>;
  purchases!: Table<PurchaseTransaction, string>;
  stock_opnames!: Table<StockOpname, string>;
  sync_queue!: Table<SyncQueueItem, string>;
  procurements!: Table<CollaborativeProcurement, string>;
  connector_trades!: Table<CooperativeConnectorTrade, string>;

  constructor() {
    super('ArunaCoopLocalDB');
    this.version(1).stores({
      members: 'id, cooperative_id, name, phone, joined_at',
      commodities: 'id, cooperative_id, name, category, available_stock',
      transactions: 'id, cooperative_id, member_id, created_at, status',
      purchases: 'id, cooperative_id, supplier_name, created_at, status',
      stock_opnames: 'id, cooperative_id, commodity_id, created_at, status',
      sync_queue: 'id, entity_type, action, created_at, sync_status',
      procurements: 'id, commodity_name, status',
      connector_trades: 'id, source_cooperative_id, target_cooperative_id, status'
    });
  }
}

// Safety check for Server-Side Rendering (SSR) in Next.js
export const localDb = typeof window !== 'undefined' ? new LocalCoopDatabase() : null as any;

// Helper to push items into the sync queue
export async function queueForSync(
  entityType: SyncQueueItem['entity_type'],
  action: SyncQueueItem['action'],
  payload: any
): Promise<void> {
  if (!localDb) return;
  const syncItem: SyncQueueItem = {
    id: `sync-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    entity_type: entityType,
    action: action,
    payload: JSON.parse(JSON.stringify(payload)), // Deep clone to be serializable
    created_at: new Date().toISOString(),
    retry_count: 0,
    last_retry_time: 0,
    sync_status: 'pending'
  };
  await localDb.sync_queue.add(syncItem);
}

// Seeder function to preload basic commodities if offline database is empty
export async function seedLocalDataIfEmpty(coopId: string, remoteCommodities: Commodity[]) {
  if (!localDb) return;
  const count = await localDb.commodities.count();
  if (count === 0 && remoteCommodities.length > 0) {
    console.log('Seeding local IndexedDB with remote commodities...');
    await localDb.commodities.bulkPut(remoteCommodities);
  }

  // Pre-seed some default members if empty
  const memberCount = await localDb.members.count();
  if (memberCount === 0) {
    const mockMembers: Member[] = [
      { id: 'mem-1', cooperative_id: coopId, name: 'Pak Budi', phone: '08123456789', address: 'Desa Merah Putih RT 01', joined_at: new Date().toISOString() },
      { id: 'mem-2', cooperative_id: coopId, name: 'Ibu Siti', phone: '08129876543', address: 'Desa Merah Putih RT 02', joined_at: new Date().toISOString() },
      { id: 'mem-3', cooperative_id: coopId, name: 'Pak Joko', phone: '08131112223', address: 'Desa Merah Putih RT 03', joined_at: new Date().toISOString() }
    ];
    await localDb.members.bulkPut(mockMembers);

    // Pre-seed some default connector trade recommendations
    const tradeCount = await localDb.connector_trades.count();
    if (tradeCount === 0) {
      await localDb.connector_trades.bulkPut([
        {
          id: 'trade-rec-1',
          source_cooperative_id: 'coop-jabar-garut',
          source_name: 'Koperasi Madu Hutan Priangan (Garut)',
          target_cooperative_id: coopId,
          target_name: 'Koperasi Saya',
          commodity_name: 'Madu Hutan',
          quantity: 200,
          unit: 'Liter',
          status: 'Rekomendasi',
          created_at: new Date().toISOString()
        },
        {
          id: 'trade-rec-2',
          source_cooperative_id: coopId,
          source_name: 'Koperasi Saya',
          target_cooperative_id: 'coop-jateng-boyolali',
          target_name: 'Koperasi Susu Warga Mulya (Boyolali)',
          commodity_name: 'Jagung',
          quantity: 15,
          unit: 'Ton',
          status: 'Rekomendasi',
          created_at: new Date().toISOString()
        }
      ]);
    }

    // Pre-seed collective procurement if empty
    const procCount = await localDb.procurements.count();
    if (procCount === 0) {
      await localDb.procurements.bulkPut([
        {
          id: 'proc-1',
          title: 'Pengadaan Bersama Pupuk Urea Subsidi',
          description: 'Pembelian pupuk urea subsidi secara massal untuk menekan biaya logistik dari pabrik pupuk di Palembang.',
          commodity_name: 'Pupuk Urea',
          target_quantity: 100,
          current_quantity: 45,
          price_per_unit: 220000, // Rp 220.000 / karung 50kg
          unit: 'Karung',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Aktif',
          participants: [
            { cooperative_id: 'coop-lampung-tani', cooperative_name: 'Koperasi Tani Lampung Makmur', quantity: 25 },
            { cooperative_id: 'coop-lampung-timur', cooperative_name: 'Koperasi Agrobisnis Lampung Timur', quantity: 20 }
          ]
        },
        {
          id: 'proc-2',
          title: 'Pengadaan Bibit Jagung Hibrida Pioneer 35',
          description: 'Pemesanan bibit jagung unggul hibrida Pioneer langsung dari produsen benih untuk jaminan keaslian dan harga termurah.',
          commodity_name: 'Bibit Jagung Hibrida',
          target_quantity: 500,
          current_quantity: 320,
          price_per_unit: 95000, // Rp 95.000 / kg
          unit: 'Kg',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Aktif',
          participants: [
            { cooperative_id: 'coop-lampung-tani', cooperative_name: 'Koperasi Tani Lampung Makmur', quantity: 150 },
            { cooperative_id: 'coop-lampung-timur', cooperative_name: 'Koperasi Agrobisnis Lampung Timur', quantity: 120 },
            { cooperative_id: 'coop-jabar-garut', cooperative_name: 'Koperasi Madu Hutan Priangan', quantity: 50 }
          ]
        }
      ]);
    }
  }
}

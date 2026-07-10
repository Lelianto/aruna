export interface Cooperative {
  id: string;
  name: string;
  province: string;
  city: string;
  latitude: number;
  longitude: number;
  member_count: number;
  active_members: number;
  annual_revenue: number;
  address?: string;
  head?: string;
  phone?: string;
  created_at?: string;

  // Document compliance & SimkopDes fields
  nib?: string;
  nib_document_url?: string;
  nib_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  sk_number?: string;
  sk_document_url?: string;
  sk_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  simkopdes_id?: string;
  cash_reserve?: number;
}

export interface Commodity {
  id: string;
  cooperative_id: string;
  name: string;
  sku: string; // Stock Keeping Unit
  category: string;
  monthly_capacity: number;
  available_stock: number;
  minimum_stock?: number; // Alert threshold
  price_per_unit?: number; // Standard price per unit
  unit: string;
  harvest_period?: string;
  description?: string;
  image_url?: string; // Product photo — stored in Firebase Storage
  created_at?: string;
}

export interface Buyer {
  id: string;
  company_name: string;
  city: string;
  industry: string;
  nib?: string;
  siup?: string;
  verified?: boolean;
  created_at?: string;
  buyer_type?: 'industri' | 'umkm';
  address?: string;
}

export interface MarketRequest {
  id: string;
  buyer_id: string;
  commodity_name: string;
  quantity: number;
  unit: string;
  status: 'Menunggu Pembayaran' | 'Menunggu Pemenuhan' | 'Terpenuhi Sebagian' | 'Terpenuhi';
  created_at?: string;
  shipping_address?: string;
  invoice_number?: string;
}

export interface SupplyMatch {
  id: string;
  request_id: string;
  cooperative_id: string;
  allocated_quantity: number;
  matched_at?: string;
}

export interface CooperativeScore {
  id: string;
  cooperative_id: string;
  health_score: number;
  growth_score: number;
  supply_score: number;
  final_score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  updated_at?: string;
}

export interface Insight {
  id: string;
  cooperative_id: string | null; // null for national insight
  title: string;
  description: string;
  recommendation: string;
  severity: 'Info' | 'Peringatan' | 'Kritis';
  created_at?: string;
}

// Custom aggregates and DTOs for view rendering
export interface CooperativeWithCommodities extends Cooperative {
  commodities: Commodity[];
  score?: CooperativeScore;
  insights?: Insight[];
}

export interface MarketRequestWithBuyer extends MarketRequest {
  buyer: Buyer;
}

export interface SupplyMatchWithCooperative extends SupplyMatch {
  cooperative: Cooperative;
}

export interface Member {
  id: string;
  cooperative_id: string;
  name: string;
  phone: string;
  address: string;
  joined_at: string;
}

export interface POSItem {
  commodity_id: string;
  commodity_name: string;
  quantity: number;
  price_per_kg: number;
  unit: string;
}

export interface POSTransaction {
  id: string;
  cooperative_id: string;
  member_id?: string;
  items: POSItem[];
  total_amount: number;
  payment_method: 'Tunai' | 'Transfer' | 'Simpanan' | 'QRIS';
  created_at: string;
  status: 'pending' | 'synced';
  version: number;
  // Buyer identity captured at checkout so the digital receipt (struk) can be
  // sent to the buyer over WhatsApp. Both optional: walk-in buyers may decline.
  customer_name?: string;
  customer_wa?: string; // normalized to 62xxxxxxxxxx (see lib/utils/phone)
  // Public URL of the generated PDF receipt (Firebase Storage) once uploaded.
  receipt_pdf_url?: string;
  // Cash handling for the 'Tunai' method: money handed over and change due.
  // Undefined for non-cash methods (exact amount).
  amount_paid?: number;
  change?: number;
}

export interface PurchaseItem {
  commodity_id: string;
  commodity_name: string;
  quantity: number;
  price_per_kg: number;
  unit: string;
}

export interface PurchaseTransaction {
  id: string;
  cooperative_id: string;
  supplier_name: string;
  items: PurchaseItem[];
  total_amount: number;
  created_at: string;
  status: 'pending' | 'synced';
  version: number;
}

export interface StockOpname {
  id: string;
  cooperative_id: string;
  commodity_id: string;
  commodity_name: string;
  system_stock: number;
  actual_stock: number;
  difference: number;
  reason: string;
  created_at: string;
  status: 'pending' | 'synced';
}

export interface SyncQueueItem {
  id: string;
  entity_type: 'product' | 'stock' | 'sale' | 'purchase' | 'member' | 'stock_opname';
  action: 'create' | 'update' | 'delete';
  payload: any;
  created_at: string;
  retry_count: number;
  last_retry_time: number;
  sync_status: 'pending' | 'failed' | 'processing';
}

export interface CollaborativeProcurement {
  id: string;
  title: string;
  description: string;
  commodity_name: string;
  target_quantity: number;
  current_quantity: number;
  price_per_unit: number;
  unit: string;
  deadline: string;
  status: 'Aktif' | 'Selesai' | 'Dibatalkan';
  participants: Array<{
    cooperative_id: string;
    cooperative_name: string;
    quantity: number;
  }>;
}

export interface CooperativeConnectorTrade {
  id: string;
  source_cooperative_id: string;
  source_name: string;
  target_cooperative_id: string;
  target_name: string;
  commodity_name: string;
  quantity: number;
  unit: string;
  status: 'Rekomendasi' | 'Diproses' | 'Selesai';
  created_at: string;
}

// Product knowledge entry for the "Aruna Help" cooperative-dashboard chatbot.
// Stored in a Firestore collection separate from operational data
// (see src/lib/firebase/seeder.ts -> HELP_KNOWLEDGE_COLLECTION).
export interface HelpKnowledgeEntry {
  id: string;
  title: string;
  group: 'umum' | 'operasional' | 'jejaring' | 'profil';
  tab_key: string | null; // matches ActiveTabKey in MitraDashboardClient, or null for cross-cutting topics
  summary: string;
  steps: string[];
  tips: string[];
}

export interface HelpChatMessage {
  role: 'user' | 'assistant';
  content: string;
}


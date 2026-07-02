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
}

export interface Commodity {
  id: string;
  cooperative_id: string;
  name: string;
  category: string;
  monthly_capacity: number;
  available_stock: number;
  unit: string;
  harvest_period?: string;
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
}

export interface MarketRequest {
  id: string;
  buyer_id: string;
  commodity_name: string;
  quantity: number;
  unit: string;
  status: 'Menunggu Pemenuhan' | 'Terpenuhi Sebagian' | 'Terpenuhi';
  created_at?: string;
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

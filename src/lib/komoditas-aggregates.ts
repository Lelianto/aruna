import 'server-only';

import { Commodity, Cooperative, CooperativeScore } from '@/types';

export interface SupplierDetail {
  coopId: string;
  commodityId: string;
  name: string;
  city: string;
  province: string;
  stock: number;
  capacity: number;
  grade: string;
  price: number;
  minimumStock: number;
}

export interface CommodityAggregate {
  name: string;
  category: string;
  totalCapacity: number;
  totalStock: number;
  unit: string;
  coopCount: number;
  provinces: string[];
  suppliers: SupplierDetail[];
}

export function buildKomoditasAggregates(
  cooperatives: Cooperative[],
  commodities: Commodity[],
  scores: Record<string, CooperativeScore>,
): CommodityAggregate[] {
  const coopMap = new Map(cooperatives.map((c) => [c.id, c]));
  const aggregatesMap: Record<string, CommodityAggregate> = {};

  for (const com of commodities) {
    const coop = coopMap.get(com.cooperative_id);
    if (!coop) continue;

    if (!aggregatesMap[com.name]) {
      aggregatesMap[com.name] = {
        name: com.name,
        category: com.category,
        totalCapacity: 0,
        totalStock: 0,
        unit: com.unit,
        coopCount: 0,
        provinces: [],
        suppliers: [],
      };
    }

    const agg = aggregatesMap[com.name];
    agg.totalCapacity += com.monthly_capacity;
    agg.totalStock += com.available_stock;
    agg.coopCount += 1;

    if (!agg.provinces.includes(coop.province)) {
      agg.provinces.push(coop.province);
    }

    agg.suppliers.push({
      coopId: coop.id,
      commodityId: com.id,
      name: coop.name,
      city: coop.city,
      province: coop.province,
      stock: com.available_stock,
      capacity: com.monthly_capacity,
      grade: scores[coop.id]?.grade || 'D',
      price: com.price_per_unit || 12000,
      minimumStock: com.minimum_stock || 0,
    });
  }

  return Object.values(aggregatesMap).sort((a, b) => b.totalCapacity - a.totalCapacity);
}

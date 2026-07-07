import { Cooperative, Commodity, MarketRequest, CooperativeScore } from '@/types';
import { calculateCooperativeScore } from './score-engine';

export interface AllocationMatch {
  cooperative: Cooperative;
  commodity: Commodity;
  score: CooperativeScore;
  allocated_quantity: number;
}

export interface MatchmakingResult {
  request: MarketRequest;
  matches: AllocationMatch[];
  total_allocated: number;
  is_fully_satisfied: boolean;
}

export function performGotongRoyongMatch(
  request: MarketRequest,
  cooperatives: Cooperative[],
  commodities: Commodity[]
): MatchmakingResult {
  const targetQuantity = request.quantity;
  const commodityName = request.commodity_name.toLowerCase();

  // Find all cooperatives that produce this commodity and have available stock
  const candidateCoops = cooperatives.map(coop => {
    const coopCommodities = commodities.filter(c => c.cooperative_id === coop.id);
    const targetCom = coopCommodities.find(c => c.name.toLowerCase() === commodityName);
    
    if (!targetCom || targetCom.available_stock <= 0) return null;

    // Calculate score
    const maxRevenue = Math.max(...cooperatives.map(c => c.annual_revenue), 1);
    const score = calculateCooperativeScore(coop, commodities, maxRevenue);

    return {
      cooperative: coop,
      commodity: targetCom,
      score
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // Sort candidates by:
  // 1. Final Score descending (favor high-quality, ready co-ops)
  // 2. Available stock descending
  candidateCoops.sort((a, b) => {
    if (b.score.final_score !== a.score.final_score) {
      return b.score.final_score - a.score.final_score;
    }
    return b.commodity.available_stock - a.commodity.available_stock;
  });

  const matches: AllocationMatch[] = [];
  let remaining = targetQuantity;

  const isUmkmRequest = (request as any).buyer?.buyer_type === 'umkm' || targetQuantity < 10;

  for (const candidate of candidateCoops) {
    if (remaining <= 0) break;

    // Direct Match Single Source: For small/UMKM orders, direct match to only 1 best-suited cooperative
    if (isUmkmRequest && matches.length >= 1) {
      break;
    }

    const stock = candidate.commodity.available_stock;
    const allocated = Math.min(remaining, stock);

    if (allocated > 0) {
      matches.push({
        cooperative: candidate.cooperative,
        commodity: candidate.commodity,
        score: candidate.score,
        allocated_quantity: Math.round(allocated * 10) / 10 // round to 1 decimal place
      });
      remaining -= allocated;
    }
  }

  const total_allocated = matches.reduce((sum, m) => sum + m.allocated_quantity, 0);
  const is_fully_satisfied = remaining <= 0;

  return {
    request,
    matches,
    total_allocated: Math.round(total_allocated * 10) / 10,
    is_fully_satisfied
  };
}

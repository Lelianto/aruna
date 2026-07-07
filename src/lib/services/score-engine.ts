import { Cooperative, Commodity, CooperativeScore } from '@/types';

export function calculateCooperativeScore(
  cooperative: Cooperative,
  commodities: Commodity[],
  maxRevenue: number
): CooperativeScore {
  // 1. Member score = active_members / member_count
  const member_score = cooperative.member_count > 0 
    ? cooperative.active_members / cooperative.member_count 
    : 0;

  // 2. Revenue score = annual_revenue / max_revenue
  const revenue_score = maxRevenue > 0 
    ? cooperative.annual_revenue / maxRevenue 
    : 0;

  // 3. Supply score = average of (available_stock / monthly_capacity) for its commodities
  const coopCommodities = commodities.filter(c => c.cooperative_id === cooperative.id);
  let supply_score = 0;
  if (coopCommodities.length > 0) {
    const totalRatio = coopCommodities.reduce((acc, c) => {
      const ratio = c.monthly_capacity > 0 ? c.available_stock / c.monthly_capacity : 0;
      return acc + Math.min(1, ratio); // Cap at 1.0 per commodity
    }, 0);
    supply_score = totalRatio / coopCommodities.length;
  }

  // Final Score: 40% member_score, 30% revenue_score, 30% supply_score (scaled to 100)
  let raw_score = Math.round(
    (0.4 * member_score + 0.3 * revenue_score + 0.3 * supply_score) * 100
  );

  // Document compliance bonus (+15 points if both verified, +7 if only one)
  let complianceBonus = 0;
  if (cooperative.nib_status === 'verified') complianceBonus += 7;
  if (cooperative.sk_status === 'verified') complianceBonus += 8;
  
  const final_score = Math.min(100, raw_score + complianceBonus);

  // Grade Assignment
  let grade: 'A' | 'B' | 'C' | 'D' = 'D';
  if (final_score >= 85) grade = 'A';
  else if (final_score >= 70) grade = 'B';
  else if (final_score >= 50) grade = 'C';

  return {
    id: `score-${cooperative.id}`,
    cooperative_id: cooperative.id,
    health_score: Math.round(member_score * 100),
    growth_score: Math.round(revenue_score * 100),
    supply_score: Math.round(supply_score * 100),
    final_score,
    grade,
    updated_at: new Date().toISOString()
  };
}

import React from 'react';
import KomoditasClient from '@/components/komoditas/KomoditasClient';
import { loadAllCooperativesFromPg } from '@/lib/data/cooperatives.pg';
import { loadAllCommoditiesFromPg } from '@/lib/data/commodities.pg';
import { loadAllCooperativeScores } from '@/lib/services/score-persistence';
import { buildKomoditasAggregates } from '@/lib/komoditas-aggregates';

export const revalidate = 0;

export default async function KomoditasPage() {
  const [cooperatives, commodities, scores] = await Promise.all([
    loadAllCooperativesFromPg(),
    loadAllCommoditiesFromPg(),
    loadAllCooperativeScores(),
  ]);

  const aggregates = buildKomoditasAggregates(cooperatives, commodities, scores);

  return <KomoditasClient aggregates={aggregates} />;
}

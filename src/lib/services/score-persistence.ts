import { CooperativeScore } from '@/types';
import { prisma } from '../prisma';
import type { aruna_cooperative_scores } from '@prisma/client';

export function toCooperativeScore(row: aruna_cooperative_scores): CooperativeScore {
  return {
    id: row.cooperative_id,
    cooperative_id: row.cooperative_id,
    health_score: Number(row.health_score),
    growth_score: Number(row.growth_score),
    supply_score: Number(row.supply_score),
    final_score: Number(row.final_score),
    grade: row.grade as CooperativeScore['grade'],
    updated_at: row.updated_at?.toISOString(),
  };
}

export async function loadCooperativeScore(cooperativeId: string): Promise<CooperativeScore | null> {
  const row = await prisma.aruna_cooperative_scores.findUnique({
    where: { cooperative_id: cooperativeId },
  });
  return row ? toCooperativeScore(row) : null;
}

export async function loadAllCooperativeScores(): Promise<Record<string, CooperativeScore>> {
  const rows = await prisma.aruna_cooperative_scores.findMany();
  const map: Record<string, CooperativeScore> = {};
  for (const row of rows) {
    map[row.cooperative_id] = toCooperativeScore(row);
  }
  return map;
}

export type CooperativeScoreInput = {
  health_score: number;
  growth_score: number;
  supply_score: number;
  final_score: number;
  grade: CooperativeScore['grade'];
  updated_at?: string;
};

export async function upsertCooperativeScore(
  cooperativeId: string,
  scoreData: CooperativeScoreInput,
): Promise<void> {
  const updatedAt = scoreData.updated_at ? new Date(scoreData.updated_at) : new Date();
  await prisma.aruna_cooperative_scores.upsert({
    where: { cooperative_id: cooperativeId },
    create: {
      cooperative_id: cooperativeId,
      health_score: scoreData.health_score,
      growth_score: scoreData.growth_score,
      supply_score: scoreData.supply_score,
      final_score: scoreData.final_score,
      grade: scoreData.grade,
      updated_at: updatedAt,
    },
    update: {
      health_score: scoreData.health_score,
      growth_score: scoreData.growth_score,
      supply_score: scoreData.supply_score,
      final_score: scoreData.final_score,
      grade: scoreData.grade,
      updated_at: updatedAt,
    },
  });
}

export async function deleteCooperativeScore(cooperativeId: string): Promise<void> {
  await prisma.aruna_cooperative_scores.deleteMany({
    where: { cooperative_id: cooperativeId },
  });
}

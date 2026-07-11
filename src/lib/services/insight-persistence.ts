import 'server-only';

import { Insight } from '@/types';
import { prisma } from '../prisma';
import type { aruna_insights } from '@prisma/client';

function toInsight(row: aruna_insights): Insight {
  return {
    id: String(row.id),
    cooperative_id: row.cooperative_id,
    title: row.title,
    description: row.description,
    recommendation: row.recommendation,
    severity: row.severity as Insight['severity'],
    created_at: row.created_at?.toISOString(),
  };
}

export async function loadOrGenerateCooperativeInsights(
  cooperativeId: string,
  generate: () => Promise<Insight[]>,
): Promise<Insight[]> {
  return prisma.$transaction(async (tx) => {
    await tx.aruna_insights.deleteMany({ where: { cooperative_id: cooperativeId } });

    const generated = await generate();
    if (generated.length === 0) return [];

    const created = await Promise.all(
      generated.map((insight) =>
        tx.aruna_insights.create({
          data: {
            cooperative_id: insight.cooperative_id,
            title: insight.title,
            description: insight.description,
            recommendation: insight.recommendation,
            severity: insight.severity,
            created_at: insight.created_at ? new Date(insight.created_at) : new Date(),
          },
        }),
      ),
    );

    return created.map(toInsight);
  });
}

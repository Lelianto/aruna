import 'server-only';

import { SupplyMatch } from '@/types';
import { prisma } from '../prisma';
import type { aruna_supply_matches } from '@prisma/client';

export function toSupplyMatch(row: aruna_supply_matches): SupplyMatch {
  return {
    id: String(row.id),
    request_id: String(row.request_id),
    // cooperative_id stays a String (koperasi_ref); no FK to external tables.
    cooperative_id: row.cooperative_id,
    allocated_quantity: Number(row.allocated_quantity),
    matched_at: row.matched_at?.toISOString(),
  };
}

export async function loadAllSupplyMatches(): Promise<SupplyMatch[]> {
  const rows = await prisma.aruna_supply_matches.findMany({ orderBy: { id: 'asc' } });
  return rows.map(toSupplyMatch);
}

export async function loadSupplyMatchesByCooperative(cooperativeId: string): Promise<SupplyMatch[]> {
  const rows = await prisma.aruna_supply_matches.findMany({
    where: { cooperative_id: cooperativeId },
    orderBy: { id: 'asc' },
  });
  return rows.map(toSupplyMatch);
}

export async function loadSupplyMatchByRequest(requestId: string): Promise<SupplyMatch | null> {
  const numericId = Number(requestId);
  if (!Number.isInteger(numericId)) return null;
  const row = await prisma.aruna_supply_matches.findFirst({
    where: { request_id: numericId },
    orderBy: { id: 'asc' },
  });
  return row ? toSupplyMatch(row) : null;
}

export interface CreateSupplyMatchInput {
  request_id: string;
  cooperative_id: string;
  allocated_quantity: number;
  matched_at?: string;
}

export async function createSupplyMatch(data: CreateSupplyMatchInput): Promise<string> {
  const requestId = Number(data.request_id);
  if (!Number.isInteger(requestId)) {
    throw new Error(`Invalid request_id for supply match: ${data.request_id}`);
  }
  // A request+cooperative pair is unique; upsert keeps re-processing idempotent.
  const row = await prisma.aruna_supply_matches.upsert({
    where: {
      request_id_cooperative_id: {
        request_id: requestId,
        cooperative_id: data.cooperative_id,
      },
    },
    update: {
      allocated_quantity: data.allocated_quantity,
      matched_at: data.matched_at ? new Date(data.matched_at) : new Date(),
    },
    create: {
      request_id: requestId,
      cooperative_id: data.cooperative_id,
      allocated_quantity: data.allocated_quantity,
      matched_at: data.matched_at ? new Date(data.matched_at) : new Date(),
    },
  });
  return String(row.id);
}

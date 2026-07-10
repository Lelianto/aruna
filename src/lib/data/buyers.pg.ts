import 'server-only';

import { Buyer } from '@/types';
import { prisma } from '../prisma';
import type { aruna_buyers } from '@prisma/client';

export function toBuyer(row: aruna_buyers): Buyer {
  return {
    id: String(row.id),
    slug: row.slug ?? undefined,
    company_name: row.company_name,
    city: row.city,
    industry: row.industry,
    nib: row.nib ?? undefined,
    siup: row.siup ?? undefined,
    verified: row.verified ?? false,
    buyer_type: (row.buyer_type as Buyer['buyer_type']) ?? undefined,
    address: row.address ?? undefined,
    created_at: row.created_at?.toISOString(),
  };
}

export async function loadAllBuyers(): Promise<Buyer[]> {
  const rows = await prisma.aruna_buyers.findMany({ orderBy: { company_name: 'asc' } });
  return rows.map(toBuyer);
}

export async function loadBuyerById(id: string): Promise<Buyer | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    // Legacy callers may still pass a slug — resolve it gracefully.
    const bySlug = await prisma.aruna_buyers.findUnique({ where: { slug: id } });
    return bySlug ? toBuyer(bySlug) : null;
  }
  const row = await prisma.aruna_buyers.findUnique({ where: { id: numericId } });
  return row ? toBuyer(row) : null;
}

export interface CreateBuyerInput {
  company_name: string;
  city: string;
  industry: string;
  nib?: string;
  siup?: string;
  verified?: boolean;
  buyer_type?: string;
  address?: string;
  slug?: string;
}

export async function createBuyer(data: CreateBuyerInput): Promise<string> {
  const created = await prisma.aruna_buyers.create({
    data: {
      slug: data.slug ?? null,
      company_name: data.company_name,
      city: data.city,
      industry: data.industry,
      nib: data.nib || null,
      siup: data.siup || null,
      verified: data.verified ?? false,
      buyer_type: data.buyer_type ?? 'industri',
      address: data.address || null,
      created_at: new Date(),
    },
  });
  return String(created.id);
}

export async function setBuyerVerified(id: string, verified: boolean): Promise<void> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return;
  await prisma.aruna_buyers.update({
    where: { id: numericId },
    data: { verified },
  });
}

export async function deleteBuyer(id: string): Promise<void> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return;
  await prisma.aruna_buyers.delete({ where: { id: numericId } });
}

/**
 * Resolves an incoming buyer identifier (integer id string, slug, or the
 * synthetic "guest_customer" sentinel used by the consumer marketplace) to a
 * concrete aruna_buyers.id. Guarantees a valid integer FK for
 * aruna_market_requests.buyer_id by materialising a shared guest buyer when
 * needed.
 */
export async function resolveBuyerId(idOrSlug: string): Promise<number> {
  if (/^\d+$/.test(idOrSlug)) {
    const numericId = Number(idOrSlug);
    const existing = await prisma.aruna_buyers.findUnique({ where: { id: numericId } });
    if (existing) return existing.id;
  } else {
    const bySlug = await prisma.aruna_buyers.findUnique({ where: { slug: idOrSlug } });
    if (bySlug) return bySlug.id;
  }

  // Fall back to a shared guest buyer (created once, reused for all
  // walk-in/consumer orders that have no registered offtaker profile).
  const guestSlug = /^\d+$/.test(idOrSlug) ? 'guest_customer' : idOrSlug;
  const guest = await prisma.aruna_buyers.upsert({
    where: { slug: guestSlug },
    update: {},
    create: {
      slug: guestSlug,
      company_name: guestSlug === 'guest_customer' ? 'Pelanggan Umum' : guestSlug,
      city: '-',
      industry: 'Umum',
      buyer_type: 'umkm',
      verified: false,
      created_at: new Date(),
    },
  });
  return guest.id;
}

import 'server-only';

import { MarketRequest, MarketRequestWithBuyer } from '@/types';
import { prisma } from '../prisma';
import type { aruna_market_requests, aruna_buyers } from '@prisma/client';
import { toBuyer, resolveBuyerId } from './buyers.pg';

type MarketRequestRow = aruna_market_requests & { buyer?: aruna_buyers | null };

export function toMarketRequest(row: MarketRequestRow): MarketRequest {
  return {
    id: String(row.id),
    buyer_id: String(row.buyer_id),
    commodity_name: row.commodity_name,
    quantity: Number(row.quantity),
    unit: row.unit,
    status: row.status as MarketRequest['status'],
    created_at: row.created_at?.toISOString(),
    shipping_address: row.shipping_address ?? undefined,
    invoice_number: row.invoice_number ?? undefined,
    coop_name: row.coop_name ?? undefined,
    total_price: row.total_price != null ? Number(row.total_price) : undefined,
  };
}

const UNKNOWN_BUYER = {
  company_name: 'Unknown Buyer',
  city: 'Unknown',
  industry: 'Unknown',
};

export async function loadAllMarketRequests(): Promise<MarketRequest[]> {
  const rows = await prisma.aruna_market_requests.findMany({ orderBy: { created_at: 'desc' } });
  return rows.map(toMarketRequest);
}

export async function loadMarketRequestById(id: string): Promise<MarketRequest | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  const row = await prisma.aruna_market_requests.findUnique({ where: { id: numericId } });
  return row ? toMarketRequest(row) : null;
}

export async function loadAllMarketRequestsWithBuyer(): Promise<MarketRequestWithBuyer[]> {
  const rows = await prisma.aruna_market_requests.findMany({
    orderBy: { created_at: 'desc' },
    include: { buyer: true },
  });
  return rows.map((row) => ({
    ...toMarketRequest(row),
    buyer: row.buyer ? toBuyer(row.buyer) : { id: String(row.buyer_id), ...UNKNOWN_BUYER },
  }));
}

export async function loadMarketRequestByIdWithBuyer(id: string): Promise<MarketRequestWithBuyer | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return null;
  const row = await prisma.aruna_market_requests.findUnique({
    where: { id: numericId },
    include: { buyer: true },
  });
  if (!row) return null;
  return {
    ...toMarketRequest(row),
    buyer: row.buyer ? toBuyer(row.buyer) : { id: String(row.buyer_id), ...UNKNOWN_BUYER },
  };
}

export interface CreateMarketRequestInput {
  buyer_id: string;
  commodity_name: string;
  quantity: number;
  unit: string;
  status: string;
  created_at?: string;
  shipping_address?: string;
  invoice_number?: string;
  coop_name?: string;
  total_price?: number;
}

export async function createMarketRequest(data: CreateMarketRequestInput): Promise<string> {
  const buyerId = await resolveBuyerId(data.buyer_id);
  const created = await prisma.aruna_market_requests.create({
    data: {
      buyer_id: buyerId,
      commodity_name: data.commodity_name,
      quantity: data.quantity,
      unit: data.unit,
      status: data.status,
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      shipping_address: data.shipping_address ?? null,
      invoice_number: data.invoice_number ?? null,
      coop_name: data.coop_name ?? null,
      total_price: data.total_price ?? null,
    },
  });
  return String(created.id);
}

export async function updateMarketRequestStatus(id: string, status: string): Promise<void> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) return;
  await prisma.aruna_market_requests.update({
    where: { id: numericId },
    data: { status },
  });
}

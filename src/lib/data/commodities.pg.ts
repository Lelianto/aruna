import 'server-only';

import { Commodity } from '@/types';
import { query } from '@/lib/db';
import { cached } from '@/lib/cache';

const COMMODITIES_TTL_MS = 2 * 60 * 1000;

export function getProductCategory(name: string): string {
  const cleanName = (name || '').toLowerCase();
  if (cleanName.includes('gas') || cleanName.includes('lpg') || cleanName.includes('bensin') || cleanName.includes('solar')) {
    return 'Energi';
  }
  if (cleanName.includes('gula') || cleanName.includes('minyak') || cleanName.includes('beras') || cleanName.includes('telur') || cleanName.includes('susu') || cleanName.includes('tepung') || cleanName.includes('indomie')) {
    return 'Pangan';
  }
  if (cleanName.includes('kopi') || cleanName.includes('teh') || cleanName.includes('madu') || cleanName.includes('cokelat')) {
    return 'Perkebunan';
  }
  if (cleanName.includes('sapi') || cleanName.includes('kambing') || cleanName.includes('ayam') || cleanName.includes('daging')) {
    return 'Peternakan';
  }
  if (cleanName.includes('ikan') || cleanName.includes('udang') || cleanName.includes('kepiting') || cleanName.includes('lobster')) {
    return 'Perikanan';
  }
  return 'Pertanian';
}

interface CommodityRow {
  id: string;
  cooperative_id: string;
  name: string;
  unit: string | null;
  available_stock: string | number;
}

export function mapCommodityRow(row: CommodityRow): Commodity {
  const stock = parseFloat(String(row.available_stock)) || 0;
  return {
    id: row.id,
    cooperative_id: row.cooperative_id,
    name: row.name,
    sku: row.id || '',
    category: getProductCategory(row.name),
    available_stock: stock,
    monthly_capacity: stock > 0 ? stock * 2 : 100,
    unit: row.unit || 'Kg',
    harvest_period: 'Sepanjang Tahun',
  };
}

async function fetchCatalog(inStock: boolean): Promise<Commodity[]> {
  const stockFilter = inStock ? 'WHERE COALESCE(ip.stok, 0) > 0' : '';
  const result = await query(`
    SELECT 
      pk.produk_sample_id AS id,
      pk.koperasi_ref AS cooperative_id,
      pk.nama_produk AS name,
      pk.unit,
      COALESCE(ip.stok, 0) AS available_stock
    FROM produk_koperasi pk
    LEFT JOIN inventaris_produk ip ON pk.produk_sample_id = ip.produk_sample_id AND pk.koperasi_ref = ip.koperasi_ref
    ${stockFilter}
    ORDER BY COALESCE(ip.stok, 0) DESC, pk.nama_produk ASC
  `);
  return result.rows.map(mapCommodityRow);
}

export async function loadAllCommoditiesFromPg(): Promise<Commodity[]> {
  return cached('commodities:all', COMMODITIES_TTL_MS, () => fetchCatalog(false));
}

export async function loadInStockCommoditiesPageFromPg(
  limit: number,
  offset: number,
): Promise<{ items: Commodity[]; total: number }> {
  const catalog = await cached('commodities:instock', COMMODITIES_TTL_MS, () => fetchCatalog(true));
  return {
    items: catalog.slice(offset, offset + limit),
    total: catalog.length,
  };
}

export async function loadCommoditiesByCooperativeIdFromPg(cooperativeId: string): Promise<Commodity[]> {
  const result = await query(`
    SELECT 
      pk.produk_sample_id AS id,
      pk.koperasi_ref AS cooperative_id,
      pk.nama_produk AS name,
      pk.unit,
      COALESCE(ip.stok, 0) AS available_stock
    FROM produk_koperasi pk
    LEFT JOIN inventaris_produk ip ON pk.produk_sample_id = ip.produk_sample_id AND pk.koperasi_ref = ip.koperasi_ref
    WHERE pk.koperasi_ref = $1
  `, [cooperativeId]);
  return result.rows.map(mapCommodityRow);
}

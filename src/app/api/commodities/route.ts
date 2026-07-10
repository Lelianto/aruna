import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cached } from '@/lib/cache';

// Product catalog changes rarely at the Postgres baseline; live stock changes
// flow through the Firestore merge in the repository. A short TTL cache turns
// the ~14k-row scan into a single DB hit per window and prevents the slow
// shared Postgres from being scanned on every request (which was timing out).
const COMMODITIES_TTL_MS = 2 * 60 * 1000;

function getProductCategory(name: string): string {
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

function mapRow(row: CommodityRow) {
  const stock = parseFloat(String(row.available_stock)) || 0;
  return {
    id: row.id,
    cooperative_id: row.cooperative_id,
    name: row.name,
    category: getProductCategory(row.name),
    available_stock: stock,
    monthly_capacity: stock > 0 ? stock * 2 : 100, // default/mock capacity
    unit: row.unit || 'Kg',
    harvest_period: 'Sepanjang Tahun',
  };
}

// Fetch + map the full catalog (optionally only in-stock rows). Cached per
// variant so pagination just slices an in-memory array.
async function fetchCatalog(inStock: boolean) {
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
  return result.rows.map(mapRow);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');
  const inStock = searchParams.get('inStock') === '1' || searchParams.get('inStock') === 'true';
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  try {
    // Per-cooperative lookup (uncached; small result set).
    if (cooperativeId) {
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
      return NextResponse.json(result.rows.map(mapRow));
    }

    // Full (or in-stock) catalog, cached; pagination slices the cached array.
    const cacheKey = inStock ? 'commodities:instock' : 'commodities:all';
    const catalog = await cached(cacheKey, COMMODITIES_TTL_MS, () => fetchCatalog(inStock));

    // Paginated response when a limit is supplied → { items, total }.
    if (limitParam !== null) {
      const limit = Math.max(1, Math.min(1000, parseInt(limitParam, 10) || 60));
      const offset = Math.max(0, parseInt(offsetParam || '0', 10) || 0);
      return NextResponse.json({
        items: catalog.slice(offset, offset + limit),
        total: catalog.length,
      });
    }

    // Backward-compatible: no limit → full array (used by getAll()).
    return NextResponse.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('Error fetching commodities from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch commodities: ' + message }, { status: 500 });
  }
}

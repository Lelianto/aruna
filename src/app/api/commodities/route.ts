import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');

  try {
    let result;
    if (cooperativeId) {
      result = await query(`
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
    } else {
      result = await query(`
        SELECT 
          pk.produk_sample_id AS id,
          pk.koperasi_ref AS cooperative_id,
          pk.nama_produk AS name,
          pk.unit,
          COALESCE(ip.stok, 0) AS available_stock
        FROM produk_koperasi pk
        LEFT JOIN inventaris_produk ip ON pk.produk_sample_id = ip.produk_sample_id AND pk.koperasi_ref = ip.koperasi_ref
      `);
    }

    const commodities = result.rows.map(row => {
      const stock = parseFloat(row.available_stock) || 0;
      return {
        id: row.id,
        cooperative_id: row.cooperative_id,
        name: row.name,
        category: getProductCategory(row.name),
        available_stock: stock,
        monthly_capacity: stock > 0 ? stock * 2 : 100, // default/mock capacity
        unit: row.unit || 'Kg',
        harvest_period: 'Sepanjang Tahun'
      };
    });

    return NextResponse.json(commodities);
  } catch (error: any) {
    console.error('Error fetching commodities from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch commodities: ' + error.message }, { status: 500 });
  }
}

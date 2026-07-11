import { NextRequest, NextResponse } from 'next/server';
import {
  loadAllCommoditiesFromPg,
  loadCommoditiesByCooperativeIdFromPg,
  loadInStockCommoditiesPageFromPg,
} from '@/lib/data/commodities.pg';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');
  const inStock = searchParams.get('inStock') === '1' || searchParams.get('inStock') === 'true';
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');

  try {
    if (cooperativeId) {
      const items = await loadCommoditiesByCooperativeIdFromPg(cooperativeId);
      return NextResponse.json(items);
    }

    if (inStock && limitParam !== null) {
      const limit = Math.max(1, Math.min(1000, parseInt(limitParam, 10) || 60));
      const offset = Math.max(0, parseInt(offsetParam || '0', 10) || 0);
      const page = await loadInStockCommoditiesPageFromPg(limit, offset);
      return NextResponse.json(page);
    }

    const catalog = await loadAllCommoditiesFromPg();
    return NextResponse.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('Error fetching commodities from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch commodities: ' + message }, { status: 500 });
  }
}

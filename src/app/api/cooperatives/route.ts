import { NextRequest, NextResponse } from 'next/server';
import { loadAllCooperativesFromPg, loadCooperativeByIdFromPg } from '@/lib/data/cooperatives.pg';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const cooperative = await loadCooperativeByIdFromPg(id);
      if (!cooperative) {
        return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
      }
      return NextResponse.json(cooperative);
    }

    const list = await loadAllCooperativesFromPg();
    return NextResponse.json(list);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching cooperatives from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch cooperatives: ' + message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  loadAllSupplyMatches,
  loadSupplyMatchesByCooperative,
  loadSupplyMatchByRequest,
  createSupplyMatch,
} from '@/lib/data/supply-matches.pg';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');
  const requestId = searchParams.get('requestId');

  try {
    if (requestId) {
      const match = await loadSupplyMatchByRequest(requestId);
      return NextResponse.json(match);
    }
    if (cooperativeId) {
      const list = await loadSupplyMatchesByCooperative(cooperativeId);
      return NextResponse.json(list);
    }
    const list = await loadAllSupplyMatches();
    return NextResponse.json(list);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching supply matches from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch supply matches: ' + message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await createSupplyMatch(body);
    return NextResponse.json({ id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating supply match:', error);
    return NextResponse.json({ error: `Failed to create supply match: ${message}` }, { status: 500 });
  }
}

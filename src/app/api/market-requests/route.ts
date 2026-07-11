import { NextRequest, NextResponse } from 'next/server';
import {
  loadAllMarketRequests,
  loadMarketRequestById,
  loadAllMarketRequestsWithBuyer,
  loadMarketRequestByIdWithBuyer,
  createMarketRequest,
  updateMarketRequestStatus,
} from '@/lib/data/market-requests.pg';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const withBuyer = searchParams.get('withBuyer') === '1';

  try {
    if (id) {
      const result = withBuyer
        ? await loadMarketRequestByIdWithBuyer(id)
        : await loadMarketRequestById(id);
      if (!result) {
        return NextResponse.json({ error: 'Market request not found' }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const list = withBuyer ? await loadAllMarketRequestsWithBuyer() : await loadAllMarketRequests();
    return NextResponse.json(list);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching market requests from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch market requests: ' + message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await createMarketRequest(body);
    return NextResponse.json({ id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating market request:', error);
    return NextResponse.json({ error: `Failed to create market request: ${message}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    await updateMarketRequestStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating market request:', error);
    return NextResponse.json({ error: `Failed to update market request: ${message}` }, { status: 500 });
  }
}

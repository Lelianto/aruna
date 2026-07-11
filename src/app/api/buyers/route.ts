import { NextRequest, NextResponse } from 'next/server';
import { loadAllBuyers, loadBuyerById, createBuyer, setBuyerVerified, deleteBuyer } from '@/lib/data/buyers.pg';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const buyer = await loadBuyerById(id);
      if (!buyer) {
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
      }
      return NextResponse.json(buyer);
    }
    const list = await loadAllBuyers();
    return NextResponse.json(list);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching buyers from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch buyers: ' + message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await createBuyer(body);
    return NextResponse.json({ id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating buyer:', error);
    return NextResponse.json({ error: `Failed to create buyer: ${message}` }, { status: 500 });
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
    await setBuyerVerified(id, Boolean(body.verified));
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating buyer:', error);
    return NextResponse.json({ error: `Failed to update buyer: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await deleteBuyer(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting buyer:', error);
    return NextResponse.json({ error: `Failed to delete buyer: ${message}` }, { status: 500 });
  }
}

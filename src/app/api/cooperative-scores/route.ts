import { NextRequest, NextResponse } from 'next/server';
import {
  loadCooperativeScore,
  upsertCooperativeScore,
  deleteCooperativeScore,
  CooperativeScoreInput,
} from '@/lib/services/score-persistence';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');

  if (!cooperativeId) {
    return NextResponse.json({ error: 'Missing cooperativeId' }, { status: 400 });
  }

  try {
    const score = await loadCooperativeScore(cooperativeId);
    return NextResponse.json(score);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching score for ${cooperativeId}:`, error);
    return NextResponse.json({ error: `Failed to fetch score: ${message}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cooperativeId, ...scoreData } = body as { cooperativeId: string } & CooperativeScoreInput;

    if (!cooperativeId) {
      return NextResponse.json({ error: 'Missing cooperativeId' }, { status: 400 });
    }

    await upsertCooperativeScore(cooperativeId, scoreData);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error upserting cooperative score:', error);
    return NextResponse.json({ error: `Failed to upsert score: ${message}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');

  if (!cooperativeId) {
    return NextResponse.json({ error: 'Missing cooperativeId' }, { status: 400 });
  }

  try {
    await deleteCooperativeScore(cooperativeId);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error deleting score for ${cooperativeId}:`, error);
    return NextResponse.json({ error: `Failed to delete score: ${message}` }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');

  if (!cooperativeId) {
    return NextResponse.json({ error: 'Missing cooperativeId' }, { status: 400 });
  }

  try {
    const insights = await cooperativeRepository.getInsights(cooperativeId);
    return NextResponse.json(insights);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching insights for ${cooperativeId}:`, error);
    return NextResponse.json({ error: `Failed to fetch insights: ${message}` }, { status: 500 });
  }
}

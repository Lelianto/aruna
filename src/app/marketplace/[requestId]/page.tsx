import React from 'react';
import { notFound } from 'next/navigation';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { commodityRepository } from '@/lib/repositories/commodity.repository';
import { performGotongRoyongMatch } from '@/lib/services/supply-engine';
import MatchDetailsClient from '@/components/marketplace/MatchDetailsClient';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function MatchDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const requestId = resolvedParams.requestId;

  // 1. Fetch details
  const request = await marketRequestRepository.getByIdWithBuyer(requestId);
  if (!request) {
    notFound();
  }

  // 2. Fetch all cooperatives & commodities
  const [cooperatives, commodities] = await Promise.all([
    cooperativeRepository.getAllWithDetails(),
    commodityRepository.getAll()
  ]);

  // 3. Buyer coordinate database mapping
  const buyerCoordsMap: Record<string, { lat: number; lng: number }> = {
    'buyer-indofood': { lat: -6.2088, lng: 106.8456 }, // Jakarta
    'buyer-kapalapi': { lat: -7.2575, lng: 112.7521 }, // Surabaya
    'buyer-mayora': { lat: -6.1783, lng: 106.6319 }, // Tangerang
    'buyer-sidomuncul': { lat: -6.9932, lng: 110.4203 }, // Semarang
    'buyer-charoen': { lat: -6.2088, lng: 106.8456 } // Jakarta
  };

  const buyerCoords = buyerCoordsMap[request.buyer_id] || { lat: -6.2088, lng: 106.8456 };

  // 4. Run Greedy Gotong Royong Matching
  const result = performGotongRoyongMatch(request, cooperatives, commodities);

  return (
    <MatchDetailsClient
      request={request}
      result={result}
      cooperatives={cooperatives}
      buyerCoords={buyerCoords}
    />
  );
}

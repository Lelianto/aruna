import React from 'react';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import MarketplaceClient from '@/components/marketplace/MarketplaceClient';

export const revalidate = 0;

export default async function MarketplacePage() {
  const requests = await marketRequestRepository.getAllWithBuyer();

  return <MarketplaceClient initialRequests={requests} />;
}

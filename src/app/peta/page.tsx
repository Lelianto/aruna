import React from 'react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { commodityRepository } from '@/lib/repositories/commodity.repository';
import PetaClient from '@/components/map/PetaClient';

export const revalidate = 0; // Fresh data for demo flow

export default async function PetaPage() {
  // Fetch data
  const [cooperatives, commodityNames] = await Promise.all([
    cooperativeRepository.getAllWithDetails(),
    commodityRepository.getUniqueNames()
  ]);

  // Extract unique provinces
  const provinces = Array.from(
    new Set(cooperatives.map(c => c.province))
  ).sort();

  return (
    <PetaClient 
      cooperatives={cooperatives}
      provinces={provinces}
      commodityNames={commodityNames}
    />
  );
}

import React from 'react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import ScoringClient from '@/components/scoring/ScoringClient';

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ coopId?: string }>;
}

export default async function ScoringPage({ searchParams }: PageProps) {
  const cooperatives = await cooperativeRepository.getAllWithDetails();
  const resolvedSearchParams = await searchParams;
  const initialCoopId = resolvedSearchParams.coopId;

  return (
    <ScoringClient 
      cooperatives={cooperatives}
      initialCoopId={initialCoopId}
    />
  );
}

import React from 'react';
import { cooperativeRepositoryServer } from '@/lib/repositories/cooperative.repository.server';
import ScoringClient from '@/components/scoring/ScoringClient';

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ coopId?: string }>;
}

export default async function ScoringPage({ searchParams }: PageProps) {
  const cooperatives = await cooperativeRepositoryServer.getAllWithDetails();
  const resolvedSearchParams = await searchParams;
  const initialCoopId = resolvedSearchParams.coopId;

  return (
    <ScoringClient 
      cooperatives={cooperatives}
      initialCoopId={initialCoopId}
    />
  );
}

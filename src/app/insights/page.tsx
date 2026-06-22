import React from 'react';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import InsightsClient from '@/components/insights/InsightsClient';

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ coopId?: string }>;
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const cooperatives = await cooperativeRepository.getAllWithDetails();
  const resolvedSearchParams = await searchParams;
  const initialCoopId = resolvedSearchParams.coopId;

  return (
    <InsightsClient 
      cooperatives={cooperatives}
      initialCoopId={initialCoopId}
    />
  );
}

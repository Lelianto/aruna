import React from 'react';
import { cooperativeRepositoryServer } from '@/lib/repositories/cooperative.repository.server';
import { commodityRepositoryServer } from '@/lib/repositories/commodity.repository.server';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const revalidate = 0; // Disable caching for demo data integrity

export default async function DashboardPage() {
  // 1. Fetch all data via repositories
  const [cooperatives, commodities, requests] = await Promise.all([
    cooperativeRepositoryServer.getAllWithDetails(),
    commodityRepositoryServer.getAll(),
    marketRequestRepository.getAllWithBuyer()
  ]);

  // 2. Calculate Stats
  const totalCooperatives = cooperatives.length;
  const totalMembers = cooperatives.reduce((acc, c) => acc + (c.member_count || 0), 0);
  const totalActiveMembers = cooperatives.reduce((acc, c) => acc + (c.active_members || 0), 0);
  const totalCapacity = commodities.reduce((acc, c) => acc + (c.monthly_capacity || 0), 0);
  const totalRequests = requests.reduce((acc, r) => acc + (r.quantity || 0), 0);
  const totalProvinces = new Set(cooperatives.map(c => c.province).filter(Boolean)).size;
  const activeRequestCount = requests.filter(r => r.status === 'Menunggu Pemenuhan').length;
  
  const averageScore = cooperatives.length > 0
    ? Math.round(cooperatives.reduce((acc, c) => acc + (c.score?.final_score || 0), 0) / cooperatives.length)
    : 0;

  // 3. Compute Chart Data
  
  // Chart 1: Top Commodities Stock vs Capacity (Aggregate by name)
  const commodityAggregates: Record<string, { capacity: number; stock: number }> = {};
  commodities.forEach(c => {
    if (!commodityAggregates[c.name]) {
      commodityAggregates[c.name] = { capacity: 0, stock: 0 };
    }
    commodityAggregates[c.name].capacity += c.monthly_capacity;
    commodityAggregates[c.name].stock += c.available_stock;
  });
  
  const topCommodities = Object.entries(commodityAggregates)
    .map(([name, data]) => ({
      name,
      capacity: Math.round(data.capacity * 10) / 10,
      stock: Math.round(data.stock * 10) / 10
    }))
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 7); // Get top 7 commodities

  // Chart 2: Provinces Production Capacity
  const provinceAggregates: Record<string, { capacity: number; cooperatives: Set<string> }> = {};
  cooperatives.forEach(coop => {
    if (!provinceAggregates[coop.province]) {
      provinceAggregates[coop.province] = { capacity: 0, cooperatives: new Set() };
    }
    provinceAggregates[coop.province].cooperatives.add(coop.id);
  });
  commodities.forEach(c => {
    const coop = cooperatives.find(x => x.id === c.cooperative_id);
    if (coop) {
      provinceAggregates[coop.province].capacity += c.monthly_capacity;
    }
  });

  const provincesData = Object.entries(provinceAggregates)
    .map(([name, data]) => ({
      name,
      capacity: Math.round(data.capacity * 10) / 10,
      cooperatives: data.cooperatives.size
    }))
    .sort((a, b) => b.capacity - a.capacity)
    .slice(0, 8); // Top 8 provinces

  // Chart 3: Category Requests (Pie Chart of Requests Grouped by Commodity Name Category)
  // Let's match each request to a commodity category by searching for a commodity with the same name.
  const categoryRequestAggregates: Record<string, { quantity: number; count: number }> = {};
  requests.forEach(req => {
    // Find category for this commodity name
    const matchCom = commodities.find(c => c.name.toLowerCase() === req.commodity_name.toLowerCase());
    const category = matchCom ? matchCom.category : 'Lain-lain';

    if (!categoryRequestAggregates[category]) {
      categoryRequestAggregates[category] = { quantity: 0, count: 0 };
    }
    categoryRequestAggregates[category].quantity += req.quantity;
    categoryRequestAggregates[category].count += 1;
  });

  const categoriesData = Object.entries(categoryRequestAggregates)
    .map(([name, data]) => ({
      name,
      value: Math.round(data.quantity * 10) / 10,
      requests: data.count
    }))
    .sort((a, b) => b.value - a.value);

  const stats = {
    totalCooperatives,
    totalMembers,
    totalActiveMembers,
    totalCapacity: Math.round(totalCapacity),
    totalRequests: Math.round(totalRequests),
    totalProvinces,
    activeRequestCount,
    averageScore
  };

  const charts = {
    topCommodities,
    provincesData,
    categoriesData
  };

  return <DashboardClient stats={stats} charts={charts} requests={requests} />;
}

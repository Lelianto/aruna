'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PotensiMapWrapper from './PotensiMapWrapper';
import CooperativeExplorerPanel from '@/components/map/CooperativeExplorerPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  Lightbulb, AlertCircle, Compass, Search, MapPin,
  TrendingUp, Users, Sprout, Landmark, ArrowRight,
  BrainCircuit, Lock, LogIn, BarChart3, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buyerRepository } from '@/lib/repositories/buyer.repository';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { Buyer, Cooperative, CooperativeWithCommodities } from '@/types';

interface PotentialItem {
  id: string;
  name: string;
  category: string;
  volume: number;
  value: number;
  province: string;
  city: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  sdm_terlibat: number;
}

interface Stats {
  total_economic_value: number;
  total_volume: number;
  total_farmers: number;
  hotspot_count: number;
}

interface PotensiDesaClientProps {
  initialStats: Stats;
  initialPotentials: PotentialItem[];
  detailedCooperatives: CooperativeWithCommodities[];
  provinces: string[];
  commodityNames: string[];
}

export default function PotensiDesaClient({ initialStats, initialPotentials, detailedCooperatives, provinces, commodityNames }: PotensiDesaClientProps) {
  const { user, userData, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !userData || (userData.role !== 'admin' && userData.role !== 'pemerintah')) {
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<'map' | 'koperasi' | 'matching'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPotentialId, setSelectedPotentialId] = useState<string | undefined>(undefined);

  // AI Matching states
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [matchingTriggered, setMatchingTriggered] = useState<boolean>(false);

  // Perspective states
  const [perspective, setPerspective] = useState<'general' | 'industry' | 'cooperative'>('general');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [selectedCooperativeId, setSelectedCooperativeId] = useState<string>('');

  // Category list for select options
  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori Potensi' },
    { value: 'Pertanian', label: 'Pertanian' },
    { value: 'Perkebunan', label: 'Perkebunan' },
    { value: 'Peternakan', label: 'Peternakan' },
    { value: 'Perikanan', label: 'Perikanan' },
    { value: 'Pariwisata', label: 'Pariwisata' },
    { value: 'Industri Kreatif', label: 'Industri Kreatif' }
  ];

  // Load buyers and cooperatives on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [buyerList, coopList] = await Promise.all([
          buyerRepository.getAll(),
          cooperativeRepository.getAll()
        ]);
        setBuyers(buyerList);
        setCooperatives(coopList);

        // Auto-select based on user role
        if (userData?.role === 'buyer' && userData.associatedId) {
          setPerspective('industry');
          setSelectedBuyerId(userData.associatedId);
        } else if (userData?.role === 'koperasi' && userData.associatedId) {
          setPerspective('cooperative');
          setSelectedCooperativeId(userData.associatedId);
        }
      } catch (err) {
        console.error("Failed to load buyers/coops in PotensiDesaClient:", err);
      }
    }
    loadData();
  }, [userData]);

  // Filtering potentials based on search query and category select
  const filteredPotentials = useMemo(() => {
    return initialPotentials.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const cleanQuery = searchQuery.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(cleanQuery) ||
        item.village.toLowerCase().includes(cleanQuery) ||
        item.city.toLowerCase().includes(cleanQuery) ||
        item.province.toLowerCase().includes(cleanQuery);
      return matchCat && matchSearch;
    });
  }, [initialPotentials, selectedCategory, searchQuery]);

  // Dynamic calculations based on filtered potentials
  const filteredStats = useMemo(() => {
    const totalVal = filteredPotentials.reduce((acc, p) => acc + p.value, 0);
    const totalVol = filteredPotentials.reduce((acc, p) => acc + p.volume, 0);
    const totalFarmers = filteredPotentials.reduce((acc, p) => acc + p.sdm_terlibat, 0);
    return {
      total_economic_value: totalVal,
      total_volume: totalVol,
      total_farmers: totalFarmers,
      hotspot_count: filteredPotentials.length
    };
  }, [filteredPotentials]);

  // Show loading/redirect placeholder
  if (loading || !user || !userData || (userData.role !== 'admin' && userData.role !== 'pemerintah')) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-[#f7f8fa]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-semibold">Memuat...</p>
        </div>
      </div>
    );
  }

  // Run Gemini AI matching
  const runAiMatching = async () => {
    if (!user) return;
    setLoadingMatches(true);
    setMatchingError(null);
    setMatchingTriggered(true);
    try {
      const res = await fetch('/api/business-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perspective,
          buyer_id: perspective === 'industry' ? selectedBuyerId : undefined,
          cooperative_id: perspective === 'cooperative' ? selectedCooperativeId : undefined
        })
      });
      if (!res.ok) throw new Error('API returned an error code');
      const data = await res.json();
      if (data.success && data.matches) {
        let filteredMatches = data.matches;
        // Sort matches by Match Score descending
        filteredMatches.sort((a: any, b: any) => b.match_score - a.match_score);
        setMatches(filteredMatches);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (err: any) {
      console.error('Failed to run AI matching:', err);
      setMatchingError('Gagal memproses pencocokan AI. Sistem akan memuat rekomendasi alternatif.');

      // Load fallbacks depending on perspective
      let fallbackMatches: any[] = [];
      if (perspective === 'industry') {
        fallbackMatches = [
          {
            match_id: 'MATCH-IND-FB1',
            buyer_name: buyers.find(b => b.id === selectedBuyerId)?.company_name || 'PT Indofood CBP',
            commodity_name: 'Singkong',
            quantity_demanded: 500,
            unit: 'ton',
            cooperative_name: 'Koperasi Tani Mulya',
            city: 'Garut',
            province: 'Jawa Barat',
            available_stock: 450,
            coop_unit: 'ton',
            aruna_score: 91,
            aruna_grade: 'A',
            match_score: 93,
            recommendation: 'Koperasi Tani Mulya siap memasok Singkong karena memiliki kapasitas panen melimpah dengan kualitas standardisasi A. Disarankan menggunakan rute logistik kargo darat.'
          },
          {
            match_id: 'MATCH-IND-FB2',
            buyer_name: buyers.find(b => b.id === selectedBuyerId)?.company_name || 'PT Indofood CBP',
            commodity_name: 'Jagung',
            quantity_demanded: 300,
            unit: 'ton',
            cooperative_name: 'Koperasi Lestari Jaya',
            city: 'Boyolali',
            province: 'Jawa Tengah',
            available_stock: 120,
            coop_unit: 'ton',
            aruna_score: 82,
            aruna_grade: 'B',
            match_score: 84,
            recommendation: 'Koperasi Lestari Jaya memiliki stok berkualitas tinggi namun jumlah terbatas. Kerjasama split-pooling dengan Koperasi Kartika Makmur Boyolali disarankan untuk mencukupi kuota.'
          }
        ];
      } else if (perspective === 'cooperative') {
        fallbackMatches = [
          {
            match_id: 'MATCH-COOP-FB1',
            cooperative_name: cooperatives.find(c => c.id === selectedCooperativeId)?.name || 'Koperasi Desa Merah Putih',
            commodity_name: 'Singkong',
            cooperative_available_stock: 450,
            cooperative_unit: 'ton',
            buyer_name: 'PT Indofood CBP',
            buyer_city: 'Jakarta',
            quantity_demanded: 500,
            unit: 'ton',
            match_score: 95,
            recommendation: 'Tawarkan stok singkong Anda kepada PT Indofood CBP yang sedang membutuhkan pasokan besar. Kurang 50 ton dapat disuplai melalui gotong royong dengan Koperasi Subur Makmur.'
          },
          {
            match_id: 'MATCH-COOP-FB2',
            cooperative_name: cooperatives.find(c => c.id === selectedCooperativeId)?.name || 'Koperasi Desa Merah Putih',
            commodity_name: 'Jagung',
            cooperative_available_stock: 100,
            cooperative_unit: 'ton',
            buyer_name: 'PT Sinar Mas Agro',
            buyer_city: 'Surabaya',
            quantity_demanded: 1200,
            unit: 'ton',
            match_score: 72,
            recommendation: 'PT Sinar Mas Agro sedang mencari Jagung dalam volume sangat besar. Sangat disarankan untuk membentuk konsorsium multi-koperasi (Gotong Royong) di Jawa Barat untuk memenuhi kuota tersebut.'
          }
        ];
      } else {
        fallbackMatches = [
          {
            match_id: 'MATCH-001',
            buyer_name: 'PT Indofood CBP',
            commodity_name: 'Singkong',
            quantity_demanded: 500,
            unit: 'ton',
            village_name: 'Desa Sidodadi',
            city: 'KOTA SAMARINDA',
            province: 'KALIMANTAN TIMUR',
            potential_volume: 850,
            economic_value: 1200000000,
            match_score: 92,
            recommendation: 'Koperasi Kelurahan Sidodadi disarankan mengonsolidasikan kelompok tani singkong setempat untuk diolah menjadi tepung tapioka curah berkualitas tinggi sebelum dikirim ke PT Indofood CBP guna mendapatkan nilai tambah.'
          },
          {
            match_id: 'MATCH-002',
            buyer_name: 'Kopi Kenangan Group',
            commodity_name: 'Kopi Gayo',
            quantity_demanded: 80,
            unit: 'ton',
            village_name: 'Kampung Lestari Cahaya',
            city: 'KAB. MERAUKE',
            province: 'PAPUA SELATAN',
            potential_volume: 120,
            economic_value: 2400000000,
            match_score: 84,
            recommendation: 'Koperasi Kampung Lestari disarankan memfasilitasi sertifikasi organik bagi para petani kopi lokal dan menyediakan fasilitas penjemuran modern untuk menjaga kualitas kadar air biji kopi kering di bawah 12%.'
          }
        ];
      }
      setMatches(fallbackMatches);
    } finally {
      setLoadingMatches(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="page-shell flex-1 py-8 bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
              <Landmark className="h-8 w-8 text-brand-navy" /> Peta Potensi &amp; AI Business Matching
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Tema 2: Optimalisasi dan Hilirisasi Komoditas Ekonomi Desa Unggulan Melalui Ekosistem Koperasi
            </p>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-navy"></div>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potensi Ekonomi Terpetakan</p>
                <h3 className="text-lg font-semibold text-slate-800 mt-1">
                  Rp {filteredStats.total_economic_value.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-400 group-hover:text-brand-navy transition-colors">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimasi Volume</p>
                <h3 className="text-lg font-semibold text-slate-800 mt-1">
                  {filteredStats.total_volume.toLocaleString('id-ID')} Ton
                </h3>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-400 group-hover:text-amber-500 transition-colors">
                <Sprout className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Petani/SDM Terlibat</p>
                <h3 className="text-lg font-semibold text-slate-800 mt-1">
                  {filteredStats.total_farmers.toLocaleString('id-ID')} Orang
                </h3>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-red"></div>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hotspot Desa Unggulan</p>
                <h3 className="text-lg font-semibold text-slate-800 mt-1">
                  {filteredStats.hotspot_count} Desa
                </h3>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl text-slate-400 group-hover:text-brand-red transition-colors">
                <Compass className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-6 bg-slate-100/50 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'map'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Compass className="h-4 w-4" /> 1. Peta Sebaran Potensi Desa
          </button>

          <button
            onClick={() => setActiveTab('koperasi')}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'koperasi'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Layers className="h-4 w-4" /> 2. Sebaran Koperasi
          </button>

          <button
            onClick={() => setActiveTab('matching')}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all relative ${activeTab === 'matching'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <BrainCircuit className="h-4 w-4" /> 3. AI Business Matching (B2B)
          </button>
        </div>

        {/* Tab 1: Peta Sebaran */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Map Column */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-200/80 bg-white overflow-hidden shadow-sm">
                <CardContent className="p-2">
                  <PotensiMapWrapper
                    potentials={filteredPotentials}
                    selectedPotentialId={selectedPotentialId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Filter & List Column */}
            <div className="space-y-4">
              <Card className="border-slate-200/80 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-800">Cari &amp; Filter Komoditas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari desa, kota, komoditas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-navy"
                    />
                  </div>

                  {/* Category select */}
                  <CustomSelect
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={categoryOptions}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Potentials List */}
              <Card className="border-slate-200/80 bg-white shadow-sm flex flex-col h-[300px]">
                <CardHeader className="pb-3 border-b border-slate-100 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-800">Daftar Wilayah Potensi</span>
                    <span className="text-[10px] font-semibold text-brand-navy bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                      {filteredPotentials.length} Ditemukan
                    </span>
                  </div>
                </CardHeader>

                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {filteredPotentials.length === 0 ? (
                    <div className="py-12 text-center text-xs font-semibold text-slate-400">
                      Tidak ada potensi daerah yang cocok.
                    </div>
                  ) : (
                    filteredPotentials.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPotentialId(item.id)}
                        className={`p-3 text-left transition-all cursor-pointer flex justify-between items-center hover:bg-slate-50/50 ${selectedPotentialId === item.id ? 'bg-amber-50/40 border-l-4 border-amber-500' : ''
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-semibold uppercase text-slate-500">{item.category}</span>
                            <span className="text-[10px] font-semibold text-slate-800">• Desa {item.village}</span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 text-slate-400" /> {item.district}, {item.city}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-semibold text-emerald-600 block tabular-nums">
                            Rp {item.value.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">{item.volume.toLocaleString('id-ID')} Ton</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Sebaran Koperasi (peta koperasi + inspector) */}
        {activeTab === 'koperasi' && (
          <CooperativeExplorerPanel
            cooperatives={detailedCooperatives}
            provinces={provinces}
            commodityNames={commodityNames}
          />
        )}

        {/* Tab 3: AI Business Matching */}
        {activeTab === 'matching' && (
          <div className="space-y-6">

            {/* Intro & Run Button */}
            <Card className="border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2 mb-1.5">
                    <BrainCircuit className="h-5 w-5 text-amber-500" /> AI Supply-Demand Matching Engine
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Sistem AI ARUNA akan memetakan data transaksi dan potensi komoditas desa yang terdaftar di PostgreSQL, kemudian mencocokkannya dengan order pembelian (*market requests*) dari industri/offtaker besar yang terdaftar di sistem.
                  </p>
                </div>

                <Button
                  onClick={runAiMatching}
                  disabled={loadingMatches || (perspective === 'industry' && !selectedBuyerId) || (perspective === 'cooperative' && !selectedCooperativeId)}
                  className="bg-brand-navy hover:bg-brand-navy/95 text-white text-xs font-semibold py-3 px-6 rounded-xl gap-2 active:scale-95 transition-transform flex-shrink-0 cursor-pointer shadow-md"
                >
                  {loadingMatches ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Menghitung Matching...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" /> Analisis Kecocokan AI
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Perspective selector tabs bar */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-semibold gap-1 shadow-sm border border-slate-200">
              <button
                onClick={() => {
                  setPerspective('general');
                  setMatchingTriggered(false);
                  setMatches([]);
                }}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${perspective === 'general' ? 'bg-white text-brand-navy shadow' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Compass className="h-4 w-4" /> Potensi Desa (Umum)
              </button>
              <button
                onClick={() => {
                  setPerspective('industry');
                  setMatchingTriggered(false);
                  setMatches([]);
                  if (buyers.length > 0 && !selectedBuyerId) {
                    setSelectedBuyerId(buyers[0].id);
                  }
                }}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${perspective === 'industry' ? 'bg-white text-brand-navy shadow' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Landmark className="h-4 w-4" /> Perspektif Industri
              </button>
              <button
                onClick={() => {
                  setPerspective('cooperative');
                  setMatchingTriggered(false);
                  setMatches([]);
                  if (cooperatives.length > 0 && !selectedCooperativeId) {
                    setSelectedCooperativeId(cooperatives[0].id);
                  }
                }}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${perspective === 'cooperative' ? 'bg-white text-brand-navy shadow' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Users className="h-4 w-4" /> Perspektif Koperasi
              </button>
            </div>

            {/* Dropdown selectors for context */}
            {perspective !== 'general' && (
              <Card className="border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {perspective === 'industry' && (
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pilih Perusahaan Industri / Buyer</label>
                      {buyers.length > 0 ? (
                        <CustomSelect
                          options={buyers.map(b => ({ value: b.id, label: `${b.company_name} (${b.city})` }))}
                          value={selectedBuyerId}
                          onChange={(val) => {
                            setSelectedBuyerId(val);
                            setMatchingTriggered(false);
                            setMatches([]);
                          }}
                          className="w-full max-w-md bg-white border border-slate-200"
                        />
                      ) : (
                        <p className="text-xs text-slate-400">Loading daftar industri...</p>
                      )}
                    </div>
                  )}
                  {perspective === 'cooperative' && (
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pilih Koperasi Desa Merah Putih</label>
                      {cooperatives.length > 0 ? (
                        <CustomSelect
                          options={cooperatives.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))}
                          value={selectedCooperativeId}
                          onChange={(val) => {
                            setSelectedCooperativeId(val);
                            setMatchingTriggered(false);
                            setMatches([]);
                          }}
                          className="w-full max-w-md bg-white border border-slate-200"
                        />
                      ) : (
                        <p className="text-xs text-slate-400">Loading daftar koperasi...</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Error Banner */}
            {matchingError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 font-semibold max-w-4xl">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>{matchingError}</div>
              </div>
            )}

            {/* Match Results */}
            {matchingTriggered && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-navy" /> Hasil Analisis AI Matcher
                </h3>

                {loadingMatches ? (
                  // Skeleton Loading
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(idx => (
                      <Card key={idx} className="border-slate-100 bg-white p-5 animate-pulse space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-slate-200 rounded-full w-24"></div>
                          <div className="h-5 bg-slate-200 rounded-full w-12"></div>
                        </div>
                        <div className="h-6 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="h-3 bg-slate-100 rounded-full w-full"></div>
                          <div className="h-3 bg-slate-100 rounded-full w-5/6"></div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-12 text-xs font-semibold text-slate-400 bg-white border border-slate-200/80 rounded-xl">
                    Tidak ada komoditas demand yang cocok dengan kriteria saat ini.
                  </div>
                ) : (
                  // Actual Cards
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matches.map((item, idx) => (
                      <Card key={item.match_id || idx} className="border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">

                        {/* Card Content based on perspective */}
                        <div className="p-5 pb-3">
                          {perspective === 'industry' ? (
                            // --- Buyer Perspective View ---
                            <>
                              <div className="flex justify-between items-start gap-4 mb-2.5">
                                <div>
                                  <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                                    {item.commodity_name}
                                  </span>
                                  <h4 className="text-md font-semibold text-slate-900 mt-2 leading-tight">
                                    {item.cooperative_name}
                                  </h4>
                                </div>
                                <div className={`text-xs font-semibold border px-2.5 py-1 rounded-full flex items-center gap-1 ${getScoreColor(item.match_score)}`}>
                                  <BrainCircuit className="h-3.5 w-3.5" /> {item.match_score}% Match
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mb-3">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{item.city}, {item.province}</span>
                              </div>

                              {/* ARUNA Score badge info */}
                              <div className="mb-4 flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  ARUNA Score: {item.aruna_score || 80}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${item.aruna_grade === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  item.aruna_grade === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                  Grade {item.aruna_grade || 'B'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs mb-4">
                                <div>
                                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Kebutuhan Anda</span>
                                  <span className="text-slate-800 font-semibold mt-0.5 block">{item.quantity_demanded} {item.unit}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Stok Tersedia</span>
                                  <span className="text-emerald-600 font-semibold mt-0.5 block">{item.available_stock} {item.coop_unit || 'ton'}</span>
                                </div>
                              </div>
                            </>
                          ) : perspective === 'cooperative' ? (
                            // --- Cooperative Perspective View ---
                            <>
                              <div className="flex justify-between items-start gap-4 mb-2.5">
                                <div>
                                  <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                                    {item.commodity_name}
                                  </span>
                                  <h4 className="text-md font-semibold text-slate-900 mt-2 leading-tight">
                                    {item.buyer_name}
                                  </h4>
                                </div>
                                <div className={`text-xs font-semibold border px-2.5 py-1 rounded-full flex items-center gap-1 ${getScoreColor(item.match_score)}`}>
                                  <BrainCircuit className="h-3.5 w-3.5" /> {item.match_score}% Match
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mb-4">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>{item.buyer_city || 'Nasional'}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs mb-4">
                                <div>
                                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Stok Koperasi Anda</span>
                                  <span className="text-emerald-600 font-semibold mt-0.5 block">{item.cooperative_available_stock} {item.cooperative_unit}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Permintaan Industri</span>
                                  <span className="text-slate-800 font-semibold mt-0.5 block">{item.quantity_demanded} {item.unit}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            // --- General Perspective View ---
                            <>
                              <div className="flex justify-between items-start gap-4 mb-2.5">
                                <div>
                                  <span className="text-[10px] font-semibold uppercase text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                                    {item.commodity_name}
                                  </span>
                                  <h4 className="text-md font-semibold text-slate-900 mt-2 leading-tight">
                                    {item.buyer_name}
                                  </h4>
                                </div>
                                <div className={`text-xs font-semibold border px-2.5 py-1 rounded-full flex items-center gap-1 ${getScoreColor(item.match_score)}`}>
                                  <BrainCircuit className="h-3.5 w-3.5" /> {item.match_score}% Match
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold mb-4">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span>Desa {item.village_name}, {item.city}, {item.province}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs mb-4">
                                <div>
                                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Permintaan Pasar</span>
                                  <span className="text-slate-800 font-semibold mt-0.5 block">{item.quantity_demanded} {item.unit}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">Offtaker B2B</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Potensi Desa</span>
                                  <span className="text-emerald-600 font-semibold mt-0.5 block">{item.potential_volume} {item.unit}</span>
                                  <span className="text-[10px] text-emerald-600 font-semibold">Nilai: Rp {item.economic_value.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                            </>
                          )}

                          {/* AI Recommendation */}
                          <div className="border-t border-slate-100 pt-3">
                            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold flex gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span>{item.recommendation}</span>
                            </p>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-slate-400">ID: {item.match_id}</span>
                          <Link
                            href={`/marketplace`}
                            className="text-xs font-semibold text-brand-navy hover:text-brand-navy/80 flex items-center gap-1 active:scale-95 transition-transform"
                          >
                            {perspective === 'cooperative' ? 'Tawarkan Pasokan' : 'Hubungkan Koperasi'} <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

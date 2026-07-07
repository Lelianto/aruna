'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MarketRequestWithBuyer, CooperativeWithCommodities } from '@/types';
import { MatchmakingResult } from '@/lib/services/supply-engine';
import { Badge } from '@/components/ui/badge';
import MapWrapper from '@/components/map/MapWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, ArrowRight, Building2, MapPin, Compass, 
  CheckCircle2, AlertTriangle, Award, Lightbulb, 
  FileText, Check, Plus, Trash2, Users, TrendingUp, Boxes, X
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface MatchDetailsClientProps {
  request: MarketRequestWithBuyer;
  result: MatchmakingResult;
  cooperatives: CooperativeWithCommodities[];
  buyerCoords: { lat: number; lng: number };
}

const buyerDetailsMap: Record<string, { address: string; persona: string; phone: string }> = {
  'buyer-indofood': {
    address: 'Kawasan Industri Ancol, Jl. Ancol I No. 9-10, Pademangan, Jakarta Utara, DKI Jakarta 14430',
    persona: 'Bpk. Herlambang Wijaya (Manager Logistik & Bahan Baku)',
    phone: '+62 811-2345-6789'
  },
  'buyer-kapalapi': {
    address: 'Jl. Gilang No. 159, Sidoarjo (Gudang Kopi Raya Surabaya), Jawa Timur 61257',
    persona: 'Ibu Maria Utami (VP Coffee Supply Chain)',
    phone: '+62 812-9876-5432'
  },
  'buyer-mayora': {
    address: 'Kawasan Industri Jatake, Jl. Industri Raya No. 21, Jatiuwung, Tangerang, Banten 15136',
    persona: 'Ibu Shinta Larasati (Kepala Gudang & QC)',
    phone: '+62 813-1111-2222'
  },
  'buyer-sidomuncul': {
    address: 'Jl. Soekarno Hatta Km. 28, Kec. Klepu, Bergas, Semarang, Jawa Tengah 50552',
    persona: 'Dr. Budi Santoso (Direktur Pengadaan Bahan Herbal)',
    phone: '+62 815-5555-8888'
  },
  'buyer-charoen': {
    address: 'Jl. Ancol Barat VIII No. 1, Pademangan, Jakarta Utara, DKI Jakarta 14430',
    persona: 'Bpk. Robert Siregar (SVP Raw Material Sourcing)',
    phone: '+62 812-4444-5555'
  }
};

const coopDetailsMap: Record<string, { address: string; head: string; phone: string }> = {
  'coop-aceh-gayo': {
    address: 'Jl. Takengon-Bintang Km 4, Takengon, Aceh Tengah, Aceh',
    head: 'Bpk. Mahdi Gayo',
    phone: '+62 852-1234-9900'
  },
  'coop-sumut-toba': {
    address: 'Jl. Sisingamangaraja No. 80, Balige, Toba, Sumatera Utara',
    head: 'Bpk. Parlindungan Sipahutar',
    phone: '+62 813-7000-8811'
  },
  'coop-sumbar-solok': {
    address: 'Jl. Raya Solok-Alahan Panjang Km 12, Solok, Sumatera Barat',
    head: 'Bpk. Alfadrian Solok',
    phone: '+62 821-6600-7788'
  },
  'coop-lampung-tani': {
    address: 'Jl. Lintas Sumatera Km 55, Kalianda, Lampung Selatan, Lampung',
    head: 'Bpk. Ahmad Dahlan',
    phone: '+62 811-9988-7766'
  },
  'coop-lampung-timur': {
    address: 'Jl. Raya Metro-Sukadana No. 22, Metro, Lampung',
    head: 'Bpk. Yusuf Wijaya',
    phone: '+62 853-2200-3344'
  },
  'coop-jabar-garut': {
    address: 'Jl. Raya Cikajang No. 15, Garut, Jawa Barat',
    head: 'Ibu Elis Priangan',
    phone: '+62 819-0099-8877'
  },
  'coop-jateng-boyolali': {
    address: 'Jl. Pandanaran No. 210, Boyolali, Jawa Tengah',
    head: 'Bpk. H. Suparno',
    phone: '+62 812-3344-5566'
  },
  'coop-jateng-daging': {
    address: 'Jl. Raya Solo-Semarang Km 6, Boyolali, Jawa Tengah',
    head: 'Bpk. Joko Subandrio',
    phone: '+62 815-6677-8899'
  },
  'coop-jatim-banyuwangi': {
    address: 'Jl. Raya Banyuwangi No. 108, Kalipuro, Banyuwangi, Jawa Timur',
    head: 'Bpk. Wawan Setiawan',
    phone: '+62 812-4455-6677'
  },
  'coop-jatim-nelayan': {
    address: 'Jl. Pelabuhan Muncar No. 5, Banyuwangi, Jawa Timur',
    head: 'Bpk. Sutrisno',
    phone: '+62 813-5566-7788'
  },
  'coop-jatim-malang': {
    address: 'Jl. Raya Kawi No. 45, Kepanjen, Malang, Jawa Timur',
    head: 'Bpk. Bambang Kawi',
    phone: '+62 811-8899-0011'
  },
  'coop-bali-kintamani': {
    address: 'Jl. Raya Penelokan, Kintamani, Bangli, Bali',
    head: 'I Ketut Suarta',
    phone: '+62 819-2233-4455'
  },
  'coop-ntb-lombok': {
    address: 'Jl. Hasanuddin No. 42, Sumbawa Besar, Sumbawa, NTB',
    head: 'Bpk. Lalu Muhammad',
    phone: '+62 878-5544-3322'
  },
  'coop-ntb-rumputlaut': {
    address: 'Jl. Raya Sekotong No. 8, Lombok Barat, NTB',
    head: 'Bpk. Wayan Sukra',
    phone: '+62 877-6655-4433'
  },
  'coop-kalsel-madu': {
    address: 'Jl. Lintas Kalimantan, Martapura, Banjar, Kalimantan Selatan',
    head: 'Bpk. Noor Halim',
    phone: '+62 851-0011-2233'
  },
  'coop-sulsel-bantaeng': {
    address: 'Jl. Lanto dg Pasewang No. 12, Bantaeng, Sulawesi Selatan',
    head: 'Bpk. Imran Bantaeng',
    phone: '+62 853-4455-6677'
  },
  'coop-sulsel-pinrang': {
    address: 'Jl. Jenderal Sudirman No. 90, Pinrang, Sulawesi Selatan',
    head: 'Bpk. H. Syamsul',
    phone: '+62 812-7788-9900'
  },
  'coop-sulut-minahasa': {
    address: 'Jl. Sam Ratulangi No. 14, Tondano, Minahasa, Sulawesi Utara',
    head: 'Bpk. Christian Tumewu',
    phone: '+62 811-4300-4400'
  }
};

// Visual mini Progress Ring for ARUNA Score
function ProgressRing({ value, size = 64, strokeWidth = 6, colorClass = 'stroke-primary' }: { value: number, size?: number, strokeWidth?: number, colorClass?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="stroke-slate-100"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-500 ease-out`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-[11px] font-black text-slate-800 leading-none">{value}</span>
      </div>
    </div>
  );
}

export default function MatchDetailsClient({
  request,
  result,
  cooperatives,
  buyerCoords
}: MatchDetailsClientProps) {
  // 1. Find all candidate cooperatives that produce this specific commodity
  const candidateCoops = useMemo(() => {
    return cooperatives.map(coop => {
      const targetCom = coop.commodities.find(c => c.name.toLowerCase() === request.commodity_name.toLowerCase());
      if (!targetCom) return null;
      return {
        cooperative: coop,
        commodity: targetCom,
        score: coop.score,
        insights: coop.insights || []
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [cooperatives, request.commodity_name]);

  // 2. State for dynamic allocations (initialized from static supply-engine matchmaking results)
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    candidateCoops.forEach(item => {
      const initialMatch = result.matches.find(m => m.cooperative.id === item.cooperative.id);
      initial[item.cooperative.id] = initialMatch ? initialMatch.allocated_quantity : 0;
    });
    return initial;
  });

  // 3. Selection focus for inspector panel & map focus
  const [selectedCoopId, setSelectedCoopId] = useState<string | undefined>(
    result.matches[0]?.cooperative.id || undefined
  );

  // 4. Modal and Release states
  const [isSpkOpen, setIsSpkOpen] = useState(false);
  const [isSpkReleased, setIsSpkReleased] = useState(false);
  const [isDigitallySigned, setIsDigitallySigned] = useState(false);
  const [transactionStep, setTransactionStep] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Firestore transaction sync helpers
  const saveTransactionToFirestore = async (
    step?: number,
    spkReleased?: boolean,
    signed?: boolean,
    newAllocations?: Record<string, number>
  ) => {
    try {
      const docRef = doc(db, 'transactions', request.id);
      await setDoc(docRef, {
        request_id: request.id,
        transactionStep: step !== undefined ? step : transactionStep,
        isSpkReleased: spkReleased !== undefined ? spkReleased : isSpkReleased,
        isDigitallySigned: signed !== undefined ? signed : isDigitallySigned,
        allocations: newAllocations !== undefined ? newAllocations : allocations
      }, { merge: true });
    } catch (err) {
      console.error("Error saving transaction state to Firestore:", err);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'transactions', request.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.allocations) {
          setAllocations(data.allocations);
        }
        if (data.isSpkReleased !== undefined) setIsSpkReleased(data.isSpkReleased);
        if (data.isDigitallySigned !== undefined) setIsDigitallySigned(data.isDigitallySigned);
        if (data.transactionStep !== undefined) setTransactionStep(data.transactionStep);
      }
    });
    return () => unsub();
  }, [request.id]);

  // Gemini AI Insights state
  const [geminiInsights, setGeminiInsights] = useState<Record<string, { summary: string; analysis: string[]; recommendations: string[] }>>({});
  const [loadingGemini, setLoadingGemini] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedCoopId) {
      if (geminiInsights[selectedCoopId]) return;

      const cacheKey = `aruna_ai_insights_${selectedCoopId}`;
      const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          const ONE_DAY = 24 * 60 * 60 * 1000;
          if (age < ONE_DAY) {
            setGeminiInsights(prev => ({ ...prev, [selectedCoopId]: parsed.data }));
            return;
          }
        } catch (e) {
          console.error("Failed to parse cached insights", e);
        }
      }

      const fetchAiInsights = async () => {
        setLoadingGemini(prev => ({ ...prev, [selectedCoopId]: true }));
        try {
          const res = await fetch(`/api/ai-insights?cooperativeId=${selectedCoopId}`);
          if (res.ok) {
            const data = await res.json();
            setGeminiInsights(prev => ({ ...prev, [selectedCoopId]: data }));
            if (typeof window !== 'undefined') {
              localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching Gemini insights:", err);
        } finally {
          setLoadingGemini(prev => ({ ...prev, [selectedCoopId]: false }));
        }
      };
      fetchAiInsights();
    }
  }, [selectedCoopId, geminiInsights]);

  // 5. Calculations based on dynamic state
  const totalAllocated = useMemo(() => {
    const total = Object.values(allocations).reduce((sum, qty) => sum + qty, 0);
    return Math.round(total * 10) / 10;
  }, [allocations]);

  const percentFulfilled = Math.min(100, Math.round((totalAllocated / request.quantity) * 100));
  const isFullySatisfied = totalAllocated >= request.quantity;

  const activeMatches = useMemo(() => {
    return candidateCoops.filter(c => allocations[c.cooperative.id] > 0);
  }, [candidateCoops, allocations]);

  const inactiveMatches = useMemo(() => {
    return candidateCoops.filter(c => allocations[c.cooperative.id] === 0);
  }, [candidateCoops, allocations]);

  // Update allocation value safely
  const handleUpdateAllocation = (coopId: string, value: number, maxStock: number) => {
    const clampedValue = Math.max(0, Math.min(maxStock, Math.round(value * 10) / 10));
    const nextAllocations = {
      ...allocations,
      [coopId]: clampedValue
    };
    setAllocations(nextAllocations);
    saveTransactionToFirestore(undefined, undefined, undefined, nextAllocations);
  };

  // Inspect specific cooperative
  const handleInspectCoop = (coopId: string) => {
    setSelectedCoopId(coopId);
  };

  // Get current cooperative being inspected
  const selectedCoopDetails = useMemo(() => {
    if (!selectedCoopId) return null;
    return candidateCoops.find(c => c.cooperative.id === selectedCoopId) || null;
  }, [selectedCoopId, candidateCoops]);

  // Pricing helper (Rp 10.500 / kg standard demo pricing)
  const UNIT_PRICE = 10500; 

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100dvh-68px)] overflow-hidden bg-slate-50">
      
      {/* Sidebar Panel - Left Column */}
      <div className="w-full md:w-[480px] lg:w-[520px] border-r border-slate-200 bg-white flex flex-col h-[50%] md:h-full overflow-y-auto shadow-sm">
        <div className="p-5 space-y-5">
          
          {/* Back Button & Header */}
          <div className="flex items-center justify-between">
            <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
            <span className="text-[10px] bg-brand-cream border border-brand-navy/10 px-2.5 py-0.5 rounded-full font-extrabold text-brand-navy uppercase tracking-wider">
              Command Center
            </span>
          </div>

          {/* Offtaker Info Card */}
          <div className="bg-[#fcfbf9] border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-navy text-white flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-brand-orange font-bold uppercase tracking-wider block">Buyer Nasional (Offtaker)</span>
                <h2 className="text-base font-black text-brand-navy leading-tight">
                  {request.buyer.company_name}
                </h2>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2.5 space-y-2 text-xs text-slate-650">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-brand-red/70 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-700 block">Alamat Pabrik Penerima:</span>
                  <span className="text-slate-600 block leading-relaxed">{buyerDetailsMap[request.buyer_id]?.address || `${request.buyer.city}, Indonesia`}</span>
                </div>
              </div>
              <div className="pl-6 border-l-2 border-slate-100 flex flex-col gap-0.5 text-[11px] text-slate-500 font-semibold">
                <span>Persona Penerima: <strong className="text-slate-700">{buyerDetailsMap[request.buyer_id]?.persona || 'Bpk. Logistik Manager'}</strong></span>
                <span>Kontak: <strong className="text-slate-700">{buyerDetailsMap[request.buyer_id]?.phone || '+62 8xx'}</strong></span>
              </div>
            </div>
          </div>

          {/* Commodity Demand Details */}
          <div className="p-4 bg-brand-cream/35 border border-brand-navy/5 rounded-xl space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Kebutuhan Utama</span>
              <Badge variant="accent" className="text-[10px] px-2 py-0">
                Gotong Royong
              </Badge>
            </div>
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <Compass className="h-6 w-6 text-brand-orange" />
                <span className="text-lg font-black text-brand-navy">
                  {request.commodity_name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block font-bold uppercase">Volume Target</span>
                <span className="text-xl font-black text-brand-red">
                  {request.quantity} {request.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Aggregated Engine Result Status */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status Pemenuhan</span>
              <span className="text-xs text-slate-400">Target: {request.quantity} ton</span>
            </div>

            {isFullySatisfied ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex gap-3 items-start shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">Target Terpenuhi</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed mt-0.5">
                    Sebanyak <span className="font-bold">{activeMatches.length} koperasi</span> berkolaborasi memenuhi {totalAllocated} ton dari total {request.quantity} ton.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/70 border border-amber-200 text-amber-800 rounded-xl flex gap-3 items-start shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">Terpenuhi Sebagian</h4>
                  <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                    Stok terkumpul baru <span className="font-bold">{totalAllocated} ton</span> ({percentFulfilled}%). Naikkan alokasi atau tambah koperasi pendukung di bawah.
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-brand-navy">
                <span>Total Agregasi: {totalAllocated} {request.unit}</span>
                <span>{percentFulfilled}%</span>
              </div>
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-brand-red h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentFulfilled}%` }}
                />
              </div>
            </div>
          </div>

          {/* ACTIVE GOTONG ROYONG CONTRIBUTORS */}
          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
              Koperasi Pengirim Aktif ({activeMatches.length})
            </span>

            {activeMatches.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed">
                Belum ada koperasi yang dialokasikan. Tambahkan kontributor di bawah.
              </p>
            ) : (
              <div className="space-y-2">
                {activeMatches.map((item) => {
                  const coop = item.cooperative;
                  const isSelected = coop.id === selectedCoopId;
                  const allocatedVal = allocations[coop.id] || 0;
                  const grade = item.score?.grade || 'D';

                  return (
                    <div 
                      key={coop.id}
                      onClick={() => handleInspectCoop(coop.id)}
                      className={`cursor-pointer p-3.5 bg-white border rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? 'border-brand-navy ring-1 ring-brand-navy/20 shadow-md bg-brand-cream/5'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block font-extrabold text-[10px] px-1.5 py-0.5 rounded text-white ${
                              grade === 'A' ? 'bg-emerald-500' :
                              grade === 'B' ? 'bg-blue-500' :
                              grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                            }`}>
                              {grade}
                            </span>
                            <span className="font-bold text-sm text-slate-800 hover:text-brand-red transition-colors">
                              {coop.name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-1">
                            {coop.city}, {coop.province}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Alokasi Pasok</span>
                          <span className="font-black text-base text-brand-red">
                            {allocatedVal} {request.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Maks: {item.commodity.available_stock} t
                          </span>
                        </div>
                      </div>

                      {/* Accordion Inspector Panel (Only displayed when selected/clicked) */}
                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Warehouse Origin details */}
                          <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-lg text-xs space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-700 block">Gudang Pengirim (Origin):</span>
                                <span className="text-slate-600 block leading-relaxed">{coopDetailsMap[coop.id]?.address || `${coop.city}, ${coop.province}`}</span>
                              </div>
                            </div>
                            <div className="pl-6 border-l-2 border-slate-100 flex flex-col gap-0.5 text-[11px] text-slate-500 font-semibold">
                              <span>Ketua Koperasi: <strong className="text-slate-700">{coopDetailsMap[coop.id]?.head || 'Bpk. Ketua Koperasi'}</strong></span>
                              <span>Kontak Pengiriman: <strong className="text-slate-700">{coopDetailsMap[coop.id]?.phone || '+62 8xx'}</strong></span>
                            </div>
                          </div>

                          {/* 4 Score Gauges */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                              ARUNA Kesiapan Skor (Detail)
                            </span>
                            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border">
                              <div className="flex flex-col items-center">
                                <ProgressRing value={item.score?.final_score || 0} size={48} strokeWidth={5} colorClass="stroke-brand-red" />
                                <span className="text-[9px] font-bold text-slate-500 mt-1 text-center">FINAL</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <ProgressRing value={item.score?.health_score || 0} size={48} strokeWidth={5} colorClass="stroke-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-500 mt-1 text-center">KEAKTIFAN</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <ProgressRing value={item.score?.growth_score || 0} size={48} strokeWidth={5} colorClass="stroke-blue-500" />
                                <span className="text-[9px] font-bold text-slate-500 mt-1 text-center">KEUANGAN</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <ProgressRing value={item.score?.supply_score || 0} size={48} strokeWidth={5} colorClass="stroke-brand-orange" />
                                <span className="text-[9px] font-bold text-slate-500 mt-1 text-center">PASOKAN</span>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic slider control for allocation */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-brand-navy flex items-center gap-1">
                                <Boxes className="h-4 w-4 text-brand-orange" /> Atur Jumlah Pengiriman:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="number"
                                  value={allocatedVal}
                                  onChange={(e) => handleUpdateAllocation(coop.id, parseFloat(e.target.value) || 0, item.commodity.available_stock)}
                                  className="w-16 p-1 border rounded text-right font-black text-slate-800 text-xs focus:ring-1 focus:ring-brand-navy"
                                  min={0}
                                  max={item.commodity.available_stock}
                                  step={0.1}
                                />
                                <span className="font-bold text-slate-500 text-xs">Ton</span>
                              </div>
                            </div>
                            
                            <input 
                              type="range"
                              value={allocatedVal}
                              onChange={(e) => handleUpdateAllocation(coop.id, parseFloat(e.target.value) || 0, item.commodity.available_stock)}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red"
                              min={0}
                              max={item.commodity.available_stock}
                              step={0.1}
                            />
                            
                            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                              <span>0 Ton</span>
                              <span>Kapasitas Stok: {item.commodity.available_stock} Ton</span>
                            </div>
                          </div>

                          {/* AI Diagnosis Insights */}
                          {item.insights.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                                AI Rekomendasi & Temuan Koperasi
                              </span>
                              <div className="space-y-1.5">
                                {item.insights.map(ins => (
                                  <div 
                                    key={ins.id}
                                    className={`p-2.5 rounded-lg border text-xs leading-relaxed flex gap-2 items-start ${
                                      ins.severity === 'Kritis' ? 'bg-red-50/50 border-red-200 text-red-800' :
                                      ins.severity === 'Peringatan' ? 'bg-amber-50/50 border-amber-200 text-amber-800' :
                                      'bg-blue-50/50 border-blue-200 text-blue-800'
                                    }`}
                                  >
                                    <Lightbulb className={`h-4 w-4 shrink-0 mt-0.5 ${
                                      ins.severity === 'Kritis' ? 'text-brand-red' :
                                      ins.severity === 'Peringatan' ? 'text-brand-orange' :
                                      'text-blue-500'
                                    }`} />
                                    <div>
                                      <p className="font-bold text-slate-800">{ins.title}</p>
                                      <p className="text-slate-600 text-[11px] mt-0.5">{ins.description}</p>
                                      <p className="text-brand-navy text-[11px] font-bold mt-1">Rekomendasi: {ins.recommendation}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gemini AI Smart Advisor */}
                          <div className="bg-brand-cream/55 border border-brand-navy/15 rounded-xl p-3.5 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-brand-navy text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider block">
                                Gemini AI Smart Advisor
                              </span>
                              {loadingGemini[coop.id] && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-red animate-ping shrink-0"></span>
                              )}
                            </div>

                            {loadingGemini[coop.id] ? (
                              <div className="space-y-2 py-2">
                                <div className="h-2.5 bg-slate-200 rounded-full w-3/4 animate-pulse"></div>
                                <div className="h-2.5 bg-slate-200 rounded-full w-5/6 animate-pulse"></div>
                                <div className="h-2.5 bg-slate-200 rounded-full w-2/3 animate-pulse"></div>
                              </div>
                            ) : geminiInsights[coop.id] ? (
                              <div className="space-y-2.5 text-xs">
                                <p className="font-semibold text-slate-800 italic leading-relaxed">
                                  &ldquo;{geminiInsights[coop.id].summary}&rdquo;
                                </p>
                                
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase">Temuan Kendala</span>
                                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px] leading-relaxed">
                                    {geminiInsights[coop.id].analysis.map((pt, idx) => (
                                      <li key={idx}>{pt}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[9px] font-black text-slate-400 block uppercase">Rekomendasi Gotong Royong</span>
                                  <ul className="list-disc pl-4 space-y-0.5 text-brand-navy text-[11px] font-extrabold leading-relaxed">
                                    {geminiInsights[coop.id].recommendations.map((rec, idx) => (
                                      <li key={idx}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic font-medium">Gagal memuat rekomendasi AI. Harap cek kunci API Anda.</p>
                            )}
                          </div>

                          {/* Remove allocation option */}
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs gap-1 border-red-200 hover:bg-red-50 hover:text-brand-red"
                              onClick={() => handleUpdateAllocation(coop.id, 0, item.commodity.available_stock)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Hapus Alokasi
                            </Button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INACTIVE GOTONG ROYONG CANDIDATES */}
          {inactiveMatches.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                Koperasi Mitra Alternatif Tersedia ({inactiveMatches.length})
              </span>
              <div className="grid grid-cols-1 gap-2">
                {inactiveMatches.map((item) => {
                  const coop = item.cooperative;
                  const grade = item.score?.grade || 'D';
                  return (
                    <div 
                      key={coop.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block font-extrabold text-[9px] px-1 py-0.5 rounded text-white ${
                            grade === 'A' ? 'bg-emerald-500' :
                            grade === 'B' ? 'bg-blue-500' :
                            grade === 'C' ? 'bg-amber-500' : 'bg-red-500'
                          }`}>
                            {grade}
                          </span>
                          <span className="font-bold text-xs text-slate-700">
                            {coop.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {coop.city}, {coop.province} (Stok: {item.commodity.available_stock} Ton)
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs border-brand-navy/20 hover:bg-brand-navy hover:text-white"
                        onClick={() => {
                          handleUpdateAllocation(coop.id, Math.min(10, item.commodity.available_stock), item.commodity.available_stock);
                          setSelectedCoopId(coop.id);
                        }}
                      >
                        <Plus className="h-3 w-3" /> Tambah
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction Execution Action Area */}
          <div className="pt-4 border-t border-slate-200">
            {isSpkReleased ? (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-xs animate-fade-slide-up">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Pelacakan & Pembayaran</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    transactionStep === 1 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    transactionStep === 2 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    transactionStep === 3 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {transactionStep === 1 ? 'SPK Diterbitkan' :
                     transactionStep === 2 ? 'Dalam Perjalanan' :
                     transactionStep === 3 ? 'Verifikasi Kargo' : 'Selesai & Lunas'}
                  </span>
                </div>

                {/* Progress Steps Visualizer */}
                <div className="relative flex justify-between items-center py-2 px-1">
                  <div className="absolute top-[21px] left-3 right-3 h-0.5 bg-slate-200 z-0"></div>
                  <div className="absolute top-[21px] left-3 h-0.5 bg-brand-navy transition-all duration-500 z-0" style={{ width: `${(transactionStep - 1) * 33.33}%` }}></div>
                  
                  {[
                    { label: 'SPK', step: 1 },
                    { label: 'Kirim', step: 2 },
                    { label: 'Verifikasi', step: 3 },
                    { label: 'Cair', step: 4 }
                  ].map((s) => (
                    <div key={s.step} className="flex flex-col items-center z-10">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-300 border ${
                        transactionStep >= s.step
                          ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        {transactionStep > s.step ? <Check className="h-3 w-3" /> : s.step}
                      </div>
                      <span className="text-[9px] font-bold mt-1 text-slate-500">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Step Info Callout */}
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-xs leading-relaxed space-y-1.5">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    {transactionStep === 1 && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>}
                    {transactionStep === 2 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>}
                    {transactionStep === 3 && <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                    {transactionStep === 4 && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
                    {transactionStep === 1 && 'Langkah 1: Pengemasan Logistik'}
                    {transactionStep === 2 && 'Langkah 2: Dalam Pengiriman'}
                    {transactionStep === 3 && 'Langkah 3: Penerimaan & Verifikasi'}
                    {transactionStep === 4 && 'Langkah 4: Pencairan Dana Sukses'}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    {transactionStep === 1 && 'Seluruh koperasi mitra telah menerima Surat Perintah Kerja (SPK) digital dan saat ini sedang menyiapkan armada logistik untuk pengiriman gabungan.'}
                    {transactionStep === 2 && 'Muatan sedang melintasi jalur logistik nasional. Kargo Lampung Makmur terpantau di Pelabuhan Merak, NTB Sejahtera transit di Surabaya.'}
                    {transactionStep === 3 && 'Truk pengangkut telah tiba di pabrik. Petugas sedang memverifikasi timbangan digital dan kadar air jagung.'}
                    {transactionStep === 4 && `Verifikasi sukses! Dana gotong royong Rp ${(totalAllocated * 1000 * UNIT_PRICE).toLocaleString('id-ID')} telah sukses dicairkan langsung ke rekening gotong royong masing-masing koperasi secara proporsional.`}
                  </p>
                </div>

                {/* Simulator controls */}
                <div className="flex gap-2">
                  {transactionStep < 4 ? (
                    <Button 
                      className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs py-2 gap-1.5 justify-center"
                      onClick={() => {
                        setIsSimulating(true);
                        setTimeout(() => {
                          const nextStep = transactionStep + 1;
                          setTransactionStep(nextStep);
                          saveTransactionToFirestore(nextStep);
                          setIsSimulating(false);
                        }, 800);
                      }}
                      disabled={isSimulating}
                    >
                      {isSimulating ? 'Memproses Simulasi...' : (
                        transactionStep === 1 ? 'Simulasikan Pengiriman' :
                        transactionStep === 2 ? 'Simulasikan Verifikasi' : 'Selesaikan Transaksi & Cairkan'
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-brand-cream" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 gap-1.5 justify-center"
                        onClick={() => setIsReceiptOpen(true)}
                      >
                        <FileText className="h-4 w-4" /> Kwitansi Resmi
                      </Button>
                      <Button
                        variant="outline"
                        className="text-xs font-bold py-2 border-slate-200"
                        onClick={() => {
                          setTransactionStep(1);
                          setIsSpkReleased(false);
                          setIsDigitallySigned(false);
                          saveTransactionToFirestore(1, false, false);
                        }}
                      >
                        Reset
                      </Button>
                    </>
                  )}
                </div>

                <Button 
                  variant="outline"
                  className="w-full text-xs border-slate-200 flex items-center justify-center gap-1 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsSpkOpen(true)}
                >
                  <FileText className="h-4 w-4" /> Lihat Dokumen SPK Rilis
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsSpkOpen(true)}
                disabled={activeMatches.length === 0}
                className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-sm flex items-center justify-center gap-2 py-3 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
              >
                <FileText className="h-4.5 w-4.5 text-brand-cream" />
                Konfirmasi & Rilis SPK Gotong Royong
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Map Panel - Right Column */}
      <div className="flex-1 h-[50%] md:h-full bg-slate-200 relative">
        <MapWrapper
          cooperatives={cooperatives}
          buyerLocation={{
            latitude: buyerCoords.lat,
            longitude: buyerCoords.lng,
            company_name: request.buyer.company_name,
            name: request.buyer.city
          }}
          connections={activeMatches.map(m => ({
            coopId: m.cooperative.id,
            allocated_quantity: allocations[m.cooperative.id] || 0
          }))}
          selectedCoopId={selectedCoopId}
          zoom={5}
        />

        {/* Selected cooperative float tooltip */}
        {selectedCoopDetails && (
          <div className="absolute top-4 left-4 z-[999] bg-white border border-slate-200/80 rounded-xl p-3 shadow-lg max-w-sm hidden sm:block">
            <span className="text-[9px] uppercase font-extrabold text-brand-orange block tracking-wider">Koperasi Fokus Peta</span>
            <h4 className="font-bold text-sm text-brand-navy mt-1">{selectedCoopDetails.cooperative.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{selectedCoopDetails.cooperative.city}, {selectedCoopDetails.cooperative.province}</p>
            <div className="flex items-center gap-4 mt-2 pt-2 border-t text-xs">
              <div>
                <span className="text-slate-400 block text-[9px]">ALOKASI</span>
                <span className="font-black text-brand-red">{allocations[selectedCoopId || ''] || 0} Ton</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px]">GRADE</span>
                <span className="font-black text-emerald-600">{selectedCoopDetails.score?.grade} ({selectedCoopDetails.score?.final_score})</span>
              </div>
              <button 
                onClick={() => setSelectedCoopId(undefined)}
                className="ml-auto text-[10px] font-bold text-slate-400 hover:text-slate-700 hover:underline"
              >
                Reset Focus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rilis SPK Gotong Royong Modal */}
      {isSpkOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 bg-brand-navy text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-yellow" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  Draft Surat Perintah Kerja (SPK) Gotong Royong
                </h3>
              </div>
              <button 
                onClick={() => setIsSpkOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
              
              {/* Kop Surat */}
              <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
                <h2 className="font-black text-base text-slate-900 tracking-wider">ALIANSI KOPERASI USAHA RAKYAT NUSANTARA (ARUNA)</h2>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Pusat Agregasi & Rantai Pasok Digital Desa - Digital Cooperatives Expo 2026
                </p>
                <p className="text-[10px] text-slate-400">Gedung Expo Kemakmuran Rakyat, Jakarta, Indonesia</p>
              </div>

              {/* Judul SPK */}
              <div className="text-center space-y-1">
                <h4 className="font-black text-slate-900 underline uppercase">SURAT PERINTAH KERJA (SPK) AGREGASI LOGISTIK</h4>
                <p className="text-xs text-slate-500 font-bold">Nomor: SPK-GR/{request.id}/{new Date().getFullYear()}</p>
              </div>

              <div className="space-y-4">
                <p>
                  Yang bertanda tangan di bawah ini menerangkan bahwa pihak penyelenggara platform <strong>ARUNA</strong> memberikan amanah penugasan penyediaan komoditas secara gotong royong kepada koperasi-koperasi terpilih untuk memenuhi permintaan dari:
                </p>

                {/* Buyer & Shipping Address Block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Penerima & Alamat Pengiriman (Buyer)</span>
                    <span className="font-black text-brand-navy text-sm block">{request.buyer.company_name}</span>
                    <p className="text-slate-650 leading-relaxed font-semibold">
                      {buyerDetailsMap[request.buyer_id]?.address || `${request.buyer.city}, Indonesia`}
                    </p>
                    <span className="text-slate-500 block text-[11px] font-semibold mt-1">
                      UP: {buyerDetailsMap[request.buyer_id]?.persona || 'Bpk. Logistik Manager'} ({buyerDetailsMap[request.buyer_id]?.phone || '+62 8xx'})
                    </span>
                  </div>
                  <div className="space-y-1.5 md:border-l md:pl-4">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Spesifikasi Permintaan</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-semibold">KOMODITAS</span>
                        <span className="font-bold text-slate-850">{request.commodity_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">TARGET VOLUME</span>
                        <span className="font-bold text-brand-red">{request.quantity} {request.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">TERPENUHI</span>
                        <span className="font-bold text-emerald-600">{totalAllocated} {request.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">STATUS</span>
                        <span className="font-bold text-brand-navy">{isFullySatisfied ? '100% Terpenuhi' : 'Terpenuhi Sebagian'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allocation details table */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase block">Rincian Pembagian Kuota Gotong Royong:</span>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold text-slate-500">
                          <th className="p-2.5">Koperasi Mitra</th>
                          <th className="p-2.5">Asal Provinsi</th>
                          <th className="p-2.5 text-center">Grade</th>
                          <th className="p-2.5 text-right">Kuota Pasokan</th>
                          <th className="p-2.5 text-right">Nilai Kontrak (Est)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {activeMatches.map((item) => {
                          const coop = item.cooperative;
                          const qty = allocations[coop.id] || 0;
                          const valueEst = qty * 1000 * UNIT_PRICE; // in Rp
                          return (
                            <tr key={coop.id}>
                              <td className="p-2.5 font-bold text-slate-900">{coop.name}</td>
                              <td className="p-2.5 text-slate-600">{coop.province}</td>
                              <td className="p-2.5 text-center font-bold text-emerald-600">{item.score?.grade}</td>
                              <td className="p-2.5 text-right font-black text-brand-navy">{qty} Ton</td>
                              <td className="p-2.5 text-right font-semibold text-slate-800">Rp {valueEst.toLocaleString('id-ID')}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-brand-cream/20 font-black border-t-2">
                          <td className="p-2.5" colSpan={3}>TOTAL ALOKASI GOTONG ROYONG</td>
                          <td className="p-2.5 text-right text-brand-red">{totalAllocated} Ton</td>
                          <td className="p-2.5 text-right text-slate-900">
                            Rp {(totalAllocated * 1000 * UNIT_PRICE).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* S&K */}
                <div className="space-y-1.5 text-[11px] text-slate-550 leading-relaxed border-t pt-3">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">Syarat & Ketentuan Logistik Gotong Royong:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Pengiriman komoditas dari masing-masing koperasi mitra akan ditujukan langsung ke alamat pabrik penerima: <strong>{buyerDetailsMap[request.buyer_id]?.address || `${request.buyer.city}`}</strong>.</li>
                    <li>Pihak pengirim dari masing-masing koperasi dipimpin oleh Ketua Koperasi masing-masing yang bertindak sebagai Narahubung Pengiriman Utama.</li>
                    <li>Pembayaran termin pertama (50%) akan otomatis cair setelah kargo tiba di gerbang pabrik dan lolos Verifikasi Kualitas oleh <strong>{buyerDetailsMap[request.buyer_id]?.persona.split(' (')[0] || 'Representatif Buyer'}</strong>.</li>
                  </ul>
                </div>
              </div>

              {/* Signature Area */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100 text-xs justify-items-center">
                <div className="text-center space-y-12">
                  <span className="block text-slate-400 font-bold uppercase">Representatif Buyer ({request.buyer.company_name})</span>
                  {isDigitallySigned ? (
                    <div className="space-y-1">
                      <div className="inline-flex h-9 w-32 items-center justify-center border border-emerald-500 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase">
                        TANDATANGAN DIGITAL
                      </div>
                      <span className="block font-bold text-slate-800">
                        {buyerDetailsMap[request.buyer_id]?.persona.split(' (')[0] || 'Representatif Buyer'}
                      </span>
                    </div>
                  ) : (
                    <span className="block border-b border-dashed border-slate-400 w-32 pt-6"></span>
                  )}
                </div>
                <div className="text-center space-y-12">
                  <span className="block text-slate-400 font-bold uppercase">Direktur Rantai Pasok ARUNA</span>
                  {isSpkReleased ? (
                    <div className="space-y-1">
                      <div className="inline-flex h-9 w-32 items-center justify-center border border-brand-navy rounded bg-brand-cream text-brand-navy font-extrabold text-[10px] uppercase">
                        DISESUAIKAN & RILIS
                      </div>
                      <span className="block font-bold text-slate-800">Adi Wijaya, M.Sc.</span>
                    </div>
                  ) : (
                    <span className="block border-b border-dashed border-slate-400 w-32 pt-6"></span>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsSpkOpen(false)}
                className="text-xs font-bold"
              >
                Tutup Draft
              </Button>
              
              {!isSpkReleased ? (
                <div className="flex gap-2">
                  {!isDigitallySigned && (
                    <Button 
                      onClick={() => {
                        setIsDigitallySigned(true);
                        saveTransactionToFirestore(undefined, undefined, true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Tanda Tangan Buyer
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setIsSpkReleased(true);
                      setIsDigitallySigned(true);
                      setIsSpkOpen(false);
                      saveTransactionToFirestore(1, true, true);
                    }}
                    disabled={!isDigitallySigned}
                    className="bg-brand-red hover:bg-brand-red/90 text-white font-black text-xs gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Rilis Kontrak SPK
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="h-4 w-4" /> Surat Perintah Kerja Telah Dirilis Resmi
                </span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Kwitansi Pembayaran Resmi Modal */}
      {isReceiptOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-fade-slide-up">
            
            {/* Stamp Lunas/Paid */}
            <div className="absolute top-20 right-8 transform rotate-12 border-4 border-emerald-500 rounded-xl px-4 py-2 text-emerald-500 font-black text-3xl opacity-20 select-none pointer-events-none">
              LUNAS / PAID
            </div>

            {/* Modal Header */}
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <h3 className="font-black text-sm uppercase tracking-wider">
                  Kwitansi Pembayaran Gotong Royong
                </h3>
              </div>
              <button 
                onClick={() => setIsReceiptOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-700 leading-relaxed font-sans">
              <div className="text-center space-y-1 pb-3 border-b">
                <h3 className="font-black text-slate-900 text-sm">ALIANSI KOPERASI USAHA RAKYAT NUSANTARA (ARUNA)</h3>
                <p className="text-[10px] text-slate-400">Bukti Pembayaran Valid & Terenkripsi Digital</p>
              </div>

              <div className="grid grid-cols-2 gap-y-3 pt-2">
                <div>
                  <span className="text-slate-400 font-bold block">NOMOR KWITANSI</span>
                  <span className="font-bold text-slate-800 text-[11px]">REC-GR/{request.id}/{new Date().getFullYear()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block">TANGGAL TRANSAKSI</span>
                  <span className="font-bold text-slate-800 text-[11px]">{new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                </div>
                
                <div className="col-span-2 border-t pt-2 mt-1">
                  <span className="text-slate-400 font-bold block">TELAH DITERIMA DARI</span>
                  <span className="font-black text-brand-navy text-sm">{request.buyer.company_name}</span>
                </div>

                <div className="col-span-2 border-t pt-2">
                  <span className="text-slate-400 font-bold block">UNTUK PEMBAYARAN</span>
                  <span className="font-bold text-slate-800">Agregasi Komoditas {request.commodity_name} sebanyak {totalAllocated} Ton</span>
                </div>
              </div>

              {/* Breakdown of disbursement */}
              <div className="space-y-1.5 pt-2 border-t">
                <span className="font-bold text-slate-800 uppercase block">Distribusi Pencairan Dana ke Koperasi:</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border divide-y space-y-1.5 text-[11px]">
                  {activeMatches.map((item) => {
                    const coop = item.cooperative;
                    const qty = allocations[coop.id] || 0;
                    const val = qty * 1000 * UNIT_PRICE;
                    return (
                      <div key={coop.id} className="flex justify-between items-center pt-1.5 first:pt-0">
                        <div>
                          <span className="font-bold text-slate-800 block">{coop.name}</span>
                          <span className="text-slate-400 font-medium">Porsi Pasokan: {qty} Ton ({Math.round(qty/totalAllocated*100)}%)</span>
                        </div>
                        <span className="font-bold text-emerald-600">Rp {val.toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-1.5 font-bold text-slate-900 border-t-2">
                    <span>TOTAL DANA CAIR</span>
                    <span className="text-brand-navy text-xs">Rp {(totalAllocated * 1000 * UNIT_PRICE).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <p className="text-[10px] text-slate-400 text-center italic mt-4">
                ARUNA Smart Payment: Dana ditransfer instan menggunakan Rekening Gotong Royong Terpusat.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t flex justify-end gap-2">
              <Button 
                onClick={() => window.print()}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs"
              >
                Cetak Bukti PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsReceiptOpen(false)}
                className="text-xs font-bold"
              >
                Tutup
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

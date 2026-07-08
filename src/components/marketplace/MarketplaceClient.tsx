'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MarketRequestWithBuyer, Buyer, MarketRequest, Cooperative, Commodity } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { 
  ShoppingBag, ArrowRight, Building2, MapPin, Compass, 
  Plus, X, Search, Filter, Loader2, AlertCircle, CheckCircle2,
  Navigation, Truck, Clock, ShieldAlert, Award, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import { buyerRepository } from '@/lib/repositories/buyer.repository';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { commodityRepository } from '@/lib/repositories/commodity.repository';

interface MarketplaceClientProps {
  initialRequests: MarketRequestWithBuyer[];
}

// Haversine formula to compute distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

export default function MarketplaceClient({ initialRequests }: MarketplaceClientProps) {
  const { user, userData } = useAuth();
  
  // Tab control: 'gotong_royong' (Industrial requests) or 'customer' (Direct consumer search) or 'pesanan' (My orders)
  const [activeMarketTab, setActiveMarketTab] = useState<'gotong_royong' | 'customer' | 'pesanan'>('gotong_royong');
  const [isUmkmUser, setIsUmkmUser] = useState(false);

  const showToggle = useMemo(() => {
    if (userData?.role === 'admin') return true;
    if (userData?.role === 'buyer' && !isUmkmUser) return true;
    return false;
  }, [userData, isUmkmUser]);

  // Set default view based on role and buyer scale
  useEffect(() => {
    if (userData?.role === 'customer') {
      setActiveMarketTab('customer');
    } else if (userData?.role === 'buyer' && userData.associatedId) {
      const checkBuyerType = async () => {
        try {
          const docRef = doc(db, 'buyers', userData.associatedId!);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.buyer_type === 'umkm') {
              setIsUmkmUser(true);
              setActiveMarketTab('customer');
            }
          }
        } catch (e) {
          console.error("Error fetching buyer type:", e);
        }
      };
      checkBuyerType();
    }
  }, [userData]);

  // ─── STATE 1: GOTONG ROYONG ENGINE ──────────────────────────────────────────
  const [requests, setRequests] = useState<MarketRequestWithBuyer[]>(initialRequests);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [supplyMatches, setSupplyMatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Menunggu Pemenuhan' | 'Terpenuhi'>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [commodityName, setCommodityName] = useState('Jagung');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ─── STATE 2: CUSTOMER CENTRIC MARKETPLACE ──────────────────────────────────
  const [coops, setCoops] = useState<any[]>([]);
  const [allCommodities, setAllCommodities] = useState<Commodity[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: -6.2088, lng: 106.8456 }); // Default: Jakarta
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [shippingOption, setShippingOption] = useState<'single' | 'split'>('single');

  // Shopping Cart States
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aruna_cart');
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse cart storage:", e);
        }
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aruna_cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.name === product.name);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.name === product.name) 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (id: string, name: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => !(item.id === id && item.name === name)));
    } else {
      setCart(prev => prev.map(item => 
        (item.id === id && item.name === name) 
          ? { ...item, quantity: qty }
          : item
      ));
    }
  };

  const removeFromCart = (id: string, name: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.name === name)));
  };

  // Real-time listener for requests
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'market_requests'), async (snapshot) => {
      try {
        const reqList: MarketRequest[] = [];
        snapshot.forEach((docSnap) => {
          reqList.push({ id: docSnap.id, ...docSnap.data() } as MarketRequest);
        });

        const buyerList = await buyerRepository.getAll();
        setBuyers(buyerList);

        const merged = reqList.map((req) => {
          const buyer = buyerList.find((b) => b.id === req.buyer_id);
          return {
            ...req,
            buyer: buyer || {
              id: req.buyer_id,
              company_name: 'Unknown Buyer',
              city: 'Unknown',
              industry: 'Unknown',
            },
          };
        }).sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });

        setRequests(merged);
      } catch (err) {
        console.error('Error processing real-time updates:', err);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load Cooperatives & Commodities for Customer search
  useEffect(() => {
    async function loadCustomerMarketData() {
      try {
        const coopList = await cooperativeRepository.getAllWithDetails();
        const comList = await commodityRepository.getAll();
        setCoops(coopList);
        setAllCommodities(comList);
      } catch (err) {
        console.error(err);
      }
    }
    loadCustomerMarketData();
  }, []);

  // Request browser geolocation for hyperlocal ranking
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation access denied. Using mock default center (Jakarta).", err);
        }
      );
    }
  }, []);

  // Real-time listener for supply matches
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'supply_matches'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setSupplyMatches(list);
    });
    return () => unsubscribe();
  }, []);

  const COMMODITY_OPTIONS = [
    { value: 'Jagung', label: 'Jagung' },
    { value: 'Rumput Laut', label: 'Rumput Laut' },
    { value: 'Madu Hutan', label: 'Madu Hutan' },
    { value: 'Kopi Arabika', label: 'Kopi Arabika' },
    { value: 'Kopi Robusta', label: 'Kopi Robusta' },
    { value: 'Beras Organik', label: 'Beras Organik' },
    { value: 'Cengkeh', label: 'Cengkeh' },
    { value: 'Kakao', label: 'Kakao' },
  ];

  // 1. Gotong Royong Industrial search filters
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = 
        req.commodity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.buyer.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.buyer.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'Semua' || 
        req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // 2. Customer Search Hyperlocal matching & Proximity ranking
  const searchedProducts = useMemo(() => {
    if (!customerSearch.trim()) return [];
    
    // Filter matching commodities
    const matchingComs = allCommodities.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.category.toLowerCase().includes(customerSearch.toLowerCase())
    );

    // Compute distance, delivery cost, and ETA for each penyedia coop
    return matchingComs.map(com => {
      const coop = coops.find(x => x.id === com.cooperative_id);
      const distance = coop 
        ? calculateDistance(coords.lat, coords.lng, coop.latitude, coop.longitude)
        : 15.0; // mock default distance
      
      const pricePerKg = 12000; // Mock base price
      const deliveryCost = Math.max(10000, Math.round(distance * 2500)); // Rp 2.5k / km, min 10k
      
      // ETA calculation
      let eta = '';
      if (distance < 5) eta = '30 - 45 Menit';
      else if (distance < 20) eta = '1 - 2 Jam';
      else if (distance < 100) eta = '1 Hari Kerja';
      else eta = '2 - 3 Hari (Kargo)';

      return {
        ...com,
        coopName: coop?.name || 'Koperasi Mitra Tani',
        city: coop?.city || 'Garut',
        province: coop?.province || 'Jawa Barat',
        grade: coop?.score?.grade || 'B',
        coopPhone: coop?.phone || '082122345566',
        distance,
        deliveryCost,
        eta,
        pricePerKg
      };
    }).sort((a, b) => a.distance - b.distance); // Hyperlocal First (Closest distance first)
  }, [allCommodities, coops, customerSearch, coords]);

  const myOrdersWithCoops = useMemo(() => {
    const isUserAdmin = userData?.role === 'admin';
    const targetBuyerId = userData?.associatedId || 'guest_customer';
    
    // Filter requests
    const filtered = requests.filter(req => isUserAdmin || req.buyer_id === targetBuyerId);
    
    return filtered.map(req => {
      const match = supplyMatches.find(m => m.request_id === req.id);
      const coop = match ? coops.find(c => c.id === match.cooperative_id) : null;
      return {
        ...req,
        coopName: coop ? coop.name : 'Platform System',
        coopCity: coop ? coop.city : 'N/A',
        coopPhone: coop ? coop.phone : '082122345566'
      };
    });
  }, [requests, supplyMatches, coops, userData]);

  // Check if current user is authorized to create requests
  const canCreate = useMemo(() => {
    return userData?.role === 'admin' || userData?.role === 'buyer';
  }, [userData]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetBuyerId = userData?.role === 'admin' ? selectedBuyerId : userData?.associatedId;
    if (!targetBuyerId) {
      setErrorMsg('Pilih perusahaan pengirim permintaan terlebih dahulu.');
      return;
    }

    const numericQty = parseFloat(quantity);
    if (isNaN(numericQty) || numericQty <= 0) {
      setErrorMsg('Volume kuota harus berupa angka positif yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await marketRequestRepository.create({
        buyer_id: targetBuyerId,
        commodity_name: commodityName,
        quantity: numericQty,
        unit: 'Ton',
        status: 'Menunggu Pemenuhan'
      });

      setSuccessMsg('Kebutuhan komoditas berhasil diposting!');
      setQuantity('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error('Failed to create request:', err);
      setErrorMsg('Gagal memposting permintaan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Payment State for Bank Transfer verification
  const [activePayment, setActivePayment] = useState<{
    items: any[];
    totalAmount: number;
    isCart: boolean;
    isReadOnly?: boolean;
  } | null>(null);

  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  const initiateDirectPayment = () => {
    if (!checkoutItem) return;
    setUseCustomAddress(false);
    setCustomAddress('');
    const totalAmount = checkoutQuantity * checkoutItem.pricePerKg + (shippingOption === 'split' ? checkoutItem.deliveryCost * 1.5 : checkoutItem.deliveryCost);
    setActivePayment({
      items: [{
        id: checkoutItem.id,
        name: checkoutItem.name,
        coopName: checkoutItem.coopName,
        cooperative_id: checkoutItem.cooperative_id,
        quantity: checkoutQuantity,
        pricePerKg: checkoutItem.pricePerKg,
        unit: checkoutItem.unit,
        deliveryCost: checkoutItem.deliveryCost
      }],
      totalAmount,
      isCart: false
    });
    setCheckoutItem(null); // Close direct modal
  };

  const initiateCartPayment = () => {
    if (cart.length === 0) return;
    setUseCustomAddress(false);
    setCustomAddress('');
    const totalAmount = cart.reduce((sum, item) => sum + (item.pricePerKg * item.quantity), 0) + cart.reduce((sum, item) => sum + item.deliveryCost, 0);
    setActivePayment({
      items: cart.map(item => ({
        ...item,
        cooperative_id: item.cooperative_id || item.cooperativeId || (coops.length > 0 ? coops[0].id : 'coop-jabar-garut')
      })),
      totalAmount,
      isCart: true
    });
    setIsCartOpen(false); // Close cart drawer
  };

  const confirmPaymentTransfer = async () => {
    if (!activePayment) return;
    setVerifyingPayment(true);
    
    // Simulate bank transfer checking for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const buyerId = userData?.associatedId || 'guest_customer';
      const currentBuyer = buyers.find(b => b.id === buyerId);
      const defaultAddress = currentBuyer?.address || currentBuyer?.city || 'Alamat profil';
      const resolvedAddress = useCustomAddress ? customAddress : defaultAddress;
      
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // 260707
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase(); // A3F9
      const baseInvoice = `ARN-${dateStr}-${randomHex}`;

      // Process each item in the payment
      let index = 0;
      for (const item of activePayment.items) {
        const invoiceNum = activePayment.items.length > 1 ? `${baseInvoice}-${index + 1}` : baseInvoice;

        // 1. Create pending market request (we DO NOT decrement stock yet to prevent miscom!)
        const reqCol = collection(db, 'market_requests');
        const newReqDoc = await addDoc(reqCol, {
          buyer_id: buyerId,
          commodity_name: item.name,
          quantity: item.quantity,
          unit: 'Kg',
          status: 'Menunggu Pembayaran',
          shipping_address: resolvedAddress,
          created_at: now.toISOString(),
          invoice_number: invoiceNum
        });

        // 2. Create supply matching record
        const matchCol = collection(db, 'supply_matches');
        await addDoc(matchCol, {
          request_id: newReqDoc.id,
          cooperative_id: item.cooperative_id || item.cooperativeId || (coops.length > 0 ? coops[0].id : 'coop-jabar-garut'),
          allocated_quantity: item.quantity,
          matched_at: now.toISOString()
        });

        // Save it back to the item for current session reference
        item.invoice_number = invoiceNum;
        index++;
      }

      // Refresh local UI data
      const coopList = await cooperativeRepository.getAllWithDetails();
      const comList = await commodityRepository.getAll();
      setCoops(coopList);
      setAllCommodities(comList);

      setPaymentSuccess(true);
      if (activePayment.isCart) {
        setCart([]); // Clear cart
      }
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setActivePayment(null);
        setPaymentSuccess(false);
        setUseCustomAddress(false);
        setCustomAddress('');
      }, 2000);

    } catch (err) {
      console.error("Failed to process payment database update:", err);
      alert("Gagal memverifikasi pembayaran. Silakan coba lagi.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleAdminApprovePayment = async (req: MarketRequestWithBuyer) => {
    if (confirm(`Apakah Anda yakin ingin memverifikasi pembayaran untuk pesanan ${req.commodity_name} sebanyak ${req.quantity} ${req.unit} ini?`)) {
      try {
        // 1. Fetch matching supply allocation from supply_matches collection
        const matchSnap = await getDocs(collection(db, 'supply_matches'));
        let matchDoc: any = null;
        matchSnap.forEach(docSnap => {
          const d = docSnap.data();
          if (d.request_id === req.id) {
            matchDoc = { id: docSnap.id, ...d };
          }
        });

        if (matchDoc) {
          // 2. Find the commodity of this cooperative with the matching name
          const comSnap = await getDocs(collection(db, 'commodities'));
          let targetComDocId: string | null = null;
          let currentStock = 0;
          
          comSnap.forEach(docSnap => {
            const d = docSnap.data();
            if (d.cooperative_id === matchDoc.cooperative_id && d.name.toLowerCase() === req.commodity_name.toLowerCase()) {
              targetComDocId = docSnap.id;
              currentStock = d.available_stock || 0;
            }
          });

          // 3. Decrement stock in Firestore
          if (targetComDocId) {
            const comRef = doc(db, 'commodities', targetComDocId);
            const newStock = Math.max(0, currentStock - req.quantity);
            await updateDoc(comRef, { available_stock: newStock });
          }
        }

        // 4. Update request status to 'Terpenuhi'
        const reqRef = doc(db, 'market_requests', req.id);
        await updateDoc(reqRef, { status: 'Terpenuhi' });

        // Refresh local UI lists
        const coopList = await cooperativeRepository.getAllWithDetails();
        const comList = await commodityRepository.getAll();
        setCoops(coopList);
        setAllCommodities(comList);

        alert("✅ Pembayaran berhasil diverifikasi! Status pesanan diperbarui menjadi Terpenuhi dan stok koperasi telah dipotong.");
      } catch (err) {
        console.error("Error approving payment:", err);
        alert("Gagal memverifikasi pembayaran.");
      }
    }
  };

  return (
    <div className="page-shell flex-1 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Toggle Marketplace mode tab */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-brand-red" />
              ARUNA Commerce Network
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Jaringan logistik nasional yang mempertemukan Koperasi, Industri, dan Pelanggan Umum.
            </p>
          </div>
          
          {showToggle ? (
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold shrink-0">
              <button 
                onClick={() => setActiveMarketTab('gotong_royong')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeMarketTab === 'gotong_royong' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Industrial Gotong Royong
              </button>
              <button 
                onClick={() => setActiveMarketTab('customer')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeMarketTab === 'customer' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Customer Marketplace
              </button>
              <button 
                onClick={() => setActiveMarketTab('pesanan')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeMarketTab === 'pesanan' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Pesanan Saya
              </button>
            </div>
          ) : (
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold shrink-0">
              <button 
                onClick={() => setActiveMarketTab('customer')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeMarketTab === 'customer' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Belanja Komoditas
              </button>
              <button 
                onClick={() => setActiveMarketTab('pesanan')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${activeMarketTab === 'pesanan' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Pesanan Saya
              </button>
            </div>
          )}
        </div>

        {activeMarketTab === 'gotong_royong' && (
          /* ====================================================================
             VIEW A: GOTONG ROYONG INDUSTRIAL DEMAND ENGINE
             ==================================================================== */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex w-full sm:w-auto items-center gap-3">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari komoditas atau industri..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center shrink-0">
                  <CustomSelect
                    options={[
                      { value: 'Semua', label: 'Semua Status' },
                      { value: 'Menunggu Pemenuhan', label: 'Menunggu Pemenuhan' },
                      { value: 'Terpenuhi', label: 'Terpenuhi' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val as any)}
                    className="w-40"
                  />
                </div>
              </div>

              {canCreate && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto bg-brand-red hover:bg-brand-red/90 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 justify-center"
                >
                  <Plus className="h-4.5 w-4.5" /> Posting Kebutuhan Baru
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map((req) => (
                <Card key={req.id} className="border-slate-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                  <CardHeader className="pb-3 flex flex-row justify-between items-start gap-3">
                    <div className="space-y-1">
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        req.status === 'Menunggu Pembayaran' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        req.status === 'Menunggu Pemenuhan' ? 'bg-amber-50 text-brand-orange border border-amber-200' : 
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {req.status}
                      </span>
                      <h3 className="text-base font-black text-slate-900 pt-1.5">
                        {req.commodity_name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Volume</span>
                      <span className="text-sm font-black text-brand-red">{req.quantity} {req.unit}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Offtaker</span>
                        {req.buyer.company_name} ({req.buyer.city})
                      </div>
                    </div>
                    {req.status === 'Menunggu Pemenuhan' && (
                      <Link href={`/marketplace/${req.id}`} className="block">
                        <Button className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-xs py-2 flex items-center justify-center gap-1 cursor-pointer rounded-xl">
                          Uji Gotong Royong Engine <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {req.status === 'Menunggu Pembayaran' && (
                      <div className="space-y-2">
                        {userData?.role === 'admin' ? (
                          <Button 
                            onClick={() => handleAdminApprovePayment(req)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Verifikasi Pembayaran
                          </Button>
                        ) : (
                          <div className="text-[10px] text-rose-500 font-extrabold flex items-center gap-1 bg-rose-50 p-2.5 rounded-lg border border-rose-100/50 justify-center">
                            <Clock className="h-4 w-4 animate-spin text-rose-500" />
                            Menunggu Verifikasi Admin
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeMarketTab === 'customer' && (
          /* ====================================================================
             VIEW B: CUSTOMER-CENTRIC HYPERLOCAL MARKETPLACE
             ==================================================================== */
          <div className="space-y-6">
            {/* National Search bar */}
            <div className="max-w-2xl mx-auto space-y-4 text-center">
              <h2 className="text-lg font-black text-slate-800">Cari Komoditas Desa di Seluruh Koperasi Indonesia</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik produk yang Anda cari (cth: 'Beras Organik', 'Cabai', 'Jagung')..."
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm bg-white font-bold focus:outline-none focus:ring-1 focus:ring-brand-navy"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase flex items-center justify-center gap-1">
                <Navigation className="h-3 w-3 text-brand-orange animate-pulse" /> Terpetakan ke Koordinat Anda: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            </div>

            {/* Results Grid ranked by Proximity */}
            {customerSearch.trim() && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {searchedProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400 font-bold text-xs">
                    Komoditas "{customerSearch}" tidak ditemukan di koperasi manapun.
                  </div>
                ) : (
                  searchedProducts.map(prod => (
                    <Card key={prod.id} className="border-slate-200/80 bg-white hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                      <CardHeader className="pb-3 flex flex-row justify-between items-start gap-4">
                        <div>
                          <Badge className="bg-slate-100 text-slate-600 border border-slate-200 uppercase font-black text-[9px] mb-1.5">
                            {prod.category}
                          </Badge>
                          <CardTitle className="text-base font-black text-slate-900 mt-1">{prod.name}</CardTitle>
                          <span className="text-[10px] text-slate-450 font-bold flex items-center gap-1 mt-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-300" /> {prod.coopName} ({prod.city})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Harga</span>
                          <span className="text-sm font-black text-brand-orange tabular-nums">Rp {prod.pricePerKg.toLocaleString('id-ID')} / kg</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Proximity metrics */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px]">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-black block uppercase">Jarak</span>
                            <span className="font-extrabold text-slate-700 flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 text-brand-red shrink-0" /> {prod.distance} Km
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-black block uppercase">Ongkos Kirim</span>
                            <span className="font-extrabold text-slate-700 flex items-center gap-0.5 tabular-nums">
                              <Truck className="h-3 w-3 text-slate-400 shrink-0" /> Rp {prod.deliveryCost.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-400 font-black block uppercase">ETA</span>
                            <span className="font-extrabold text-slate-700 flex items-center gap-0.5">
                              <Clock className="h-3 w-3 text-slate-400 shrink-0" /> {prod.eta}
                            </span>
                          </div>
                        </div>

                        {/* Grade indicator */}
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>Grade Koperasi: 
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-white font-black uppercase ${
                              prod.grade === 'A' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}>
                              {prod.grade}
                            </span>
                          </span>
                          <span>Stok Tersedia: <strong className="text-slate-800">{prod.available_stock} {prod.unit}</strong></span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          onClick={() => addToCart(prod)}
                          className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-xs py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Tambah ke Keranjang
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}

          {/* ====================================================================
             VIEW C: PESANAN SAYA (MY ORDERS & TRANSACTIONS)
             ==================================================================== */}
          {activeMarketTab === 'pesanan' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800">
                  {userData?.role === 'admin' ? 'Daftar Seluruh Transaksi Platform' : 'Riwayat Belanja & Status Pesanan Anda'}
                </h2>
              </div>

              {myOrdersWithCoops.length === 0 ? (
                <div className="bg-white border rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-3xs">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mx-auto">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">Belum Ada Transaksi</h3>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      Anda belum melakukan pemesanan komoditas. Silakan cari produk di halaman utama belanja.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myOrdersWithCoops.map((order) => (
                    <Card key={order.id} className="border-slate-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                      <CardHeader className="pb-3 flex flex-row justify-between items-start gap-3">
                        <div className="space-y-1">
                          <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            order.status === 'Menunggu Pembayaran' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            order.status === 'Menunggu Pemenuhan' ? 'bg-amber-50 text-brand-orange border border-amber-200' : 
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {order.status}
                          </span>
                          <h3 className="text-base font-black text-slate-900 pt-1.5 font-sans">
                            {order.commodity_name}
                          </h3>
                          <span className="text-[9px] text-slate-400 block font-semibold font-sans">
                            Tanggal: {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </span>
                          <span className="text-[9px] text-slate-450 block font-bold font-sans">
                            Invoice: <span className="font-extrabold text-slate-700">{order.invoice_number || order.id.slice(0, 8).toUpperCase()}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Volume</span>
                          <span className="text-sm font-black text-brand-red">{order.quantity} {order.unit}</span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-655 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400 animate-pulse" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Koperasi Penyedia</span>
                            {order.coopName} ({order.coopCity})
                          </div>
                        </div>

                        {/* Display delivery address detail */}
                        {order.shipping_address && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] font-semibold text-slate-500 space-y-1">
                            <span className="text-slate-400 block font-black uppercase text-[8px]">Tujuan Pengiriman</span>
                            <p className="line-clamp-2 leading-relaxed text-slate-650">{order.shipping_address}</p>
                          </div>
                        )}

                        {/* If Admin and pending payment, show Verify Payment button */}
                        {order.status === 'Menunggu Pembayaran' && userData?.role === 'admin' && (
                          <Button 
                            onClick={() => handleAdminApprovePayment(order)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl font-sans"
                          >
                            <CheckCircle2 className="h-4.5 w-4.5" /> Verifikasi Pembayaran
                          </Button>
                        )}

                        {/* If Buyer and pending payment, show payment details button */}
                        {order.status === 'Menunggu Pembayaran' && userData?.role !== 'admin' && (
                          <Button 
                            onClick={() => {
                              const mockCommodityPrice = 12000; 
                              const deliveryCost = 25000;
                              const totalAmount = order.quantity * mockCommodityPrice + deliveryCost;
                              setActivePayment({
                                items: [{
                                  id: order.id,
                                  name: order.commodity_name,
                                  coopName: order.coopName,
                                  coopPhone: order.coopPhone,
                                  quantity: order.quantity,
                                  pricePerKg: mockCommodityPrice,
                                  unit: order.unit,
                                  deliveryCost: deliveryCost,
                                  invoice_number: order.invoice_number || order.id.slice(0, 8).toUpperCase()
                                }],
                                totalAmount,
                                isCart: false,
                                isReadOnly: true
                              });
                            }}
                            className="w-full bg-brand-navy hover:bg-brand-navy/95 text-white font-black text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer rounded-xl font-sans"
                          >
                            <CreditCard className="h-4 w-4" /> Lihat Detail VA
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* ─── MODAL 1: ADD GOTONG ROYONG DEMAND REQUEST ────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Posting Permintaan Komoditas Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                {userData?.role === 'admin' && (
                  <CustomSelect
                    label="Pilih Perusahaan Pengirim (Offtaker):"
                    options={buyers.map(b => ({ value: b.id, label: b.company_name }))}
                    value={selectedBuyerId}
                    onChange={setSelectedBuyerId}
                  />
                )}
                  <CustomSelect
                    label="Pilih Jenis Komoditas:"
                    options={COMMODITY_OPTIONS}
                    value={commodityName}
                    onChange={setCommodityName}
                  />

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 block uppercase">Volume Kebutuhan Pasokan (Ton):</label>
                  <input 
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="Volume kebutuhan pasokan"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none text-slate-800"
                  />
                </div>

                {errorMsg && (
                  <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" /> {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> {successMsg}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs cursor-pointer rounded-xl h-10 px-4"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-brand-red hover:bg-brand-red/90 text-white font-black text-xs cursor-pointer rounded-xl h-10 px-6"
                  >
                    {isSubmitting ? 'Memproses...' : 'Posting Permintaan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: CUSTOMER MOCK CHECKOUT WITH SPLIT FULFILLMENT AUDIT WARNING ─ */}
        {checkoutItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Simulasi Checkout Pelanggan</h3>
                <button onClick={() => setCheckoutItem(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-black uppercase">Item</span>
                  <span className="text-sm font-black text-slate-800 block">{checkoutItem.name}</span>
                  <span className="text-[10px] text-slate-500 block">Koperasi: {checkoutItem.coopName}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 block uppercase">Jumlah Beli (Kg):</label>
                  <input 
                    type="number"
                    min={1}
                    max={100}
                    value={checkoutQuantity}
                    onChange={e => setCheckoutQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                  />
                </div>

                {/* Smart Split fulfillment audit warning alert */}
                {checkoutQuantity > 10 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl space-y-2">
                    <div className="flex gap-2 items-start">
                      <ShieldAlert className="h-4.5 w-4.5 text-brand-orange shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-950">Peringatan: Stok Terdekat Terbatas</h4>
                        <p className="text-[11px] text-amber-800 leading-normal mt-0.5">
                          Koperasi {checkoutItem.coopName} kekurangan stok untuk volume tersebut. Sistem menawarkan split pengiriman dari koperasi tetangga.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-extrabold cursor-pointer">
                        <input 
                          type="radio" 
                          name="shipping_opt" 
                          checked={shippingOption === 'single'}
                          onChange={() => setShippingOption('single')}
                          className="accent-brand-navy h-4 w-4"
                        />
                        Single Kirim (Satu Kargo Lebih Lambat)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-extrabold cursor-pointer">
                        <input 
                          type="radio" 
                          name="shipping_opt" 
                          checked={shippingOption === 'split'}
                          onChange={() => setShippingOption('split')}
                          className="accent-brand-navy h-4 w-4"
                        />
                        Split Kirim (Gudang Bogor + Cianjur, Ongkir Berbeda)
                      </label>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black block uppercase">Ongkos Kirim</span>
                    <span className="font-extrabold text-slate-700">
                      Rp {(shippingOption === 'split' ? checkoutItem.deliveryCost * 1.5 : checkoutItem.deliveryCost).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-black block uppercase">Total Bayar</span>
                    <span className="text-base font-black text-brand-orange">
                      Rp {(checkoutQuantity * checkoutItem.pricePerKg + (shippingOption === 'split' ? checkoutItem.deliveryCost * 1.5 : checkoutItem.deliveryCost)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    onClick={() => setCheckoutItem(null)} 
                    variant="outline"
                    className="text-xs cursor-pointer rounded-xl h-10 px-4"
                  >
                    Batal
                  </Button>
                  <Button 
                    onClick={initiateDirectPayment}
                    className="bg-brand-navy hover:bg-brand-navy/90 text-white font-black text-xs cursor-pointer rounded-xl h-10 px-6"
                  >
                    Konfirmasi Checkout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ─── SHOPPING CART FLOATING BUBBLE AND DRAWER ────────────────────────── */}
      {/* Floating Bubble */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-brand-red hover:bg-brand-red/95 text-white shadow-2xl flex items-center justify-center cursor-pointer z-40 transition-transform active:scale-95 group"
        title="Keranjang Belanja"
      >
        <ShoppingBag className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        {cart.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-brand-navy text-white text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-white animate-pulse">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
          
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-3xl overflow-hidden border-l border-slate-200">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-brand-red" />
                  <h2 className="text-base font-black text-slate-800">Keranjang Belanja</h2>
                  <Badge variant="secondary" className="font-extrabold text-[10px] bg-slate-200 text-slate-700">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                  </Badge>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Keranjang Belanja Kosong</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Silakan pilih komoditas dari koperasi terdekat untuk ditambahkan.</p>
                    </div>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.id}-${item.name}-${index}`} className="flex gap-3 p-3 border border-slate-100 rounded-xl bg-[#faf9f6]/40 hover:bg-[#faf9f6] transition-colors relative">
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] bg-brand-red/10 text-brand-red px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                          {item.coopName}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 leading-snug">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-extrabold">Rp {item.pricePerKg.toLocaleString('id-ID')} / kg</p>
                      </div>
                      <div className="flex flex-col items-end justify-between shrink-0">
                        <button onClick={() => removeFromCart(item.id, item.name)} className="text-slate-350 hover:text-red-500 cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                        {/* Qty Adjuster */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden text-xs">
                          <button 
                            onClick={() => updateCartQty(item.id, item.name, item.quantity - 1)}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 font-bold border-r border-slate-200 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 font-bold text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, item.name, item.quantity + 1)}
                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 font-bold border-l border-slate-200 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Calculations */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5 text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal Produk:</span>
                      <span className="font-extrabold text-slate-800 tabular-nums">
                        Rp {cart.reduce((sum, item) => sum + (item.pricePerKg * item.quantity), 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Ongkos Kirim:</span>
                      <span className="font-extrabold text-slate-800 tabular-nums">
                        Rp {cart.reduce((sum, item) => sum + item.deliveryCost, 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                      <span className="font-black text-slate-800">Total Pembayaran:</span>
                      <span className="font-black text-brand-orange text-base tabular-nums">
                        Rp {(
                          cart.reduce((sum, item) => sum + (item.pricePerKg * item.quantity), 0) +
                          cart.reduce((sum, item) => sum + item.deliveryCost, 0)
                        ).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={initiateCartPayment}
                    className="w-full bg-brand-navy hover:bg-brand-navy/95 text-white font-black text-xs py-3 rounded-xl cursor-pointer"
                  >
                    Checkout Sekarang ({cart.reduce((sum, item) => sum + item.quantity, 0)} kg)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PAYMENT ESCROW VERIFICATION ────────────────────────── */}
      {activePayment && (() => {
        const buildWhatsAppLink = () => {
          const items = activePayment.items || [];
          if (items.length === 0) return '#';
          const item = items[0];
          const phone = item.coopPhone || '082122345566';
          const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
          
          let itemsText = '';
          items.forEach((it, idx) => {
            const refCode = it.invoice_number || it.id?.slice(0, 8).toUpperCase() || 'ARN-DEFAULT';
            itemsText += `\n${idx + 1}. [Ref: ${refCode}] ${it.name} - ${it.quantity} Kg (Koperasi: ${it.coopName || 'KDMP'})`;
          });
          
          const text = `Halo Pengurus Koperasi, saya adalah pembeli di platform ARUNA. Saya ingin mengirimkan bukti transfer pembayaran untuk pesanan berikut:${itemsText}

- Total Transfer: Rp ${activePayment.totalAmount.toLocaleString('id-ID')}

Mohon verifikasi pembayaran saya agar pesanan dapat segera diproses. Terima kasih!`;
          return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
              
              {!paymentSuccess ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="h-5 w-5 text-brand-red animate-pulse" />
                      Instruksi Pembayaran Manual
                    </h3>
                    {!verifyingPayment && (
                      <button onClick={() => setActivePayment(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-semibold space-y-3">
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400 uppercase text-[9px] font-black">Bank Tujuan</span>
                      <span className="text-slate-800 font-extrabold">Bank Mandiri (KDMP)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400 uppercase text-[9px] font-black">Nomor Rekening</span>
                      <span className="text-slate-800 font-black text-sm tracking-wider">155-00-1092-8831</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400 uppercase text-[9px] font-black">Nama Rekening</span>
                      <span className="text-slate-800 font-extrabold">{activePayment.items[0]?.coopName || 'Koperasi Desa Merah Putih (KDMP)'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2">
                      <span className="text-slate-400 uppercase text-[9px] font-black">Nomor Referensi (Invoice)</span>
                      <span className="text-slate-800 font-extrabold tracking-wider">{activePayment.items[0]?.invoice_number || 'ARN-PENDING'}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400 uppercase text-[9px] font-black self-center">Total Nominal Transfer</span>
                      <span className="text-base font-black text-brand-orange tabular-nums">
                        Rp {activePayment.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Proof of Payment Box */}
                  <div className="bg-emerald-50/80 border border-emerald-200/40 text-emerald-950 p-3.5 rounded-xl text-[11px] leading-relaxed space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-sm shrink-0">💬</span>
                      <div>
                        <strong className="text-emerald-900 font-extrabold block">Wajib Kirim Bukti Transfer ke WA Koperasi:</strong>
                        Harap kirimkan foto/screenshot bukti transfer bank langsung ke WhatsApp Koperasi Penyedia setelah melakukan transfer. Admin koperasi akan memverifikasi mutasi rekening Anda berdasarkan bukti tersebut.
                      </div>
                    </div>
                    
                    <a 
                      href={buildWhatsAppLink()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c35e] text-white font-black text-xs py-2.5 rounded-xl cursor-pointer w-full text-center transition-colors shadow-2xs"
                    >
                      <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.59 1.97 14.122.95 11.5 1.05h-.009c-5.437 0-9.862 4.371-9.866 9.8.001 1.637.452 3.238 1.309 4.646L1.87 21.03l5.65-1.478c-1.228-.679-2.035-1.92-2.035-3.327z"/>
                      </svg>
                      Kirim Bukti Pembayaran via WhatsApp
                    </a>
                  </div>

                  {/* Shipping Address Confirmation section */}
                  {!activePayment.isReadOnly && (
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <span className="text-[10px] text-slate-400 block font-black uppercase">Konfirmasi Alamat Pengiriman</span>
                      
                      {!useCustomAddress ? (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50 text-[11px] text-slate-700 font-semibold space-y-1">
                          <span className="text-[9px] text-slate-400 block font-bold">ALAMAT PROFIL PERUSAHAAN (AUTOFILLED)</span>
                          <p>{buyers.find(b => b.id === (userData?.associatedId || 'guest_customer'))?.address || buyers.find(b => b.id === (userData?.associatedId || 'guest_customer'))?.city || 'Alamat tidak diatur'}</p>
                        </div>
                      ) : (
                        <textarea
                          placeholder="Masukkan alamat pengiriman alternatif untuk pesanan ini..."
                          value={customAddress}
                          onChange={(e) => setCustomAddress(e.target.value)}
                          rows={2}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800 resize-none font-sans animate-fade-in"
                        />
                      )}

                      <label className="flex items-center gap-1.5 text-[11px] text-slate-550 font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useCustomAddress}
                          onChange={(e) => setUseCustomAddress(e.target.checked)}
                          className="accent-brand-navy h-3.5 w-3.5 rounded border-slate-350"
                        />
                        Kirim ke alamat lain untuk pesanan ini
                      </label>
                    </div>
                  )}

                  {activePayment.isReadOnly ? (
                    <div className="space-y-3 pt-2">
                      <div className="bg-slate-50 border border-slate-200/50 text-slate-600 p-3.5 rounded-xl text-[10px] leading-relaxed">
                        <strong className="font-extrabold text-slate-700">Status Pesanan:</strong> Pesanan ini telah terdaftar di database dan sedang menantikan verifikasi manual oleh Pengurus Koperasi. Pastikan Anda sudah mengirimkan bukti bayar langsung ke WhatsApp Koperasi menggunakan tombol hijau di atas.
                      </div>
                      <Button 
                        onClick={() => setActivePayment(null)}
                        className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs py-3 rounded-xl cursor-pointer"
                      >
                        Tutup
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={confirmPaymentTransfer}
                      disabled={verifyingPayment}
                      className="w-full bg-brand-navy hover:bg-brand-navy/95 text-white font-black text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
                    >
                      {verifyingPayment ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin text-brand-cream" />
                          Merekonsiliasi Dana Bank...
                        </>
                      ) : (
                        'Saya Sudah Transfer / Konfirmasi'
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">Pesanan Berhasil Dibuat!</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Status transaksi: <span className="font-extrabold text-rose-500">Pending (Menunggu Pembayaran)</span>. Pengurus koperasi akan memverifikasi mutasi rekening Anda setelah menerima bukti transfer di WhatsApp.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}

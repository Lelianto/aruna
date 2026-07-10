'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MarketRequestWithBuyer, Buyer, MarketRequest, Commodity, Cooperative, SupplyMatch } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  ShoppingBag, ArrowRight, Building2, MapPin,
  Plus, Search, CheckCircle2, Navigation, Truck, Clock,
  X, AlertCircle, ShieldAlert, LogIn, CreditCard, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { marketRequestRepository } from '@/lib/repositories/market-request.repository';
import { buyerRepository } from '@/lib/repositories/buyer.repository';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';
import { commodityRepository } from '@/lib/repositories/commodity.repository';
import { localDb, queueForSync } from '@/lib/services/local-db';

interface MarketplaceClientProps {
  initialRequests: MarketRequestWithBuyer[];
}

type MarketTab = 'gotong_royong' | 'customer' | 'pesanan';
type RequestStatusFilter = 'Semua' | 'Menunggu Pemenuhan' | 'Terpenuhi';

interface MarketplaceProduct extends Commodity {
  coopName: string;
  city: string;
  province: string;
  grade: string;
  coopPhone: string;
  distance: number;
  distanceSource: 'osrm' | 'haversine';
  deliveryCost: number;
  eta: string;
  pricePerKg: number;
}

interface CartItem extends MarketplaceProduct {
  quantity: number;
}

interface PaymentItem {
  id: string;
  name: string;
  coopName: string;
  coopPhone?: string;
  cooperative_id: string;
  cooperativeId?: string;
  quantity: number;
  pricePerKg: number;
  unit: string;
  deliveryCost: number;
  invoice_number?: string;
}

interface ActivePaymentState {
  items: PaymentItem[];
  totalAmount: number;
  isCart: boolean;
  isReadOnly?: boolean;
}

// Haversine formula to compute distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

// Progressive, batched in-stock product loader shared by the initial load and
// the post-transaction refreshes. Fetches in-stock products page by page
// (server-filtered + cached), applies Firestore overrides once, and reports
// each accumulated batch via `onBatch` so the UI can paint before the whole
// catalog arrives. Returns the full accumulated list.
async function loadInStockCommodities(onBatch?: (items: Commodity[]) => void): Promise<Commodity[]> {
  const BATCH = 300;
  const accumulated: Commodity[] = [];
  const overrides = await commodityRepository.getCommodityOverrides();
  let offset = 0;
  // Bounded loop guard in case `total` is ever inconsistent.
  for (let guard = 0; guard < 100; guard++) {
    const { items, total } = await commodityRepository.getInStockPage(BATCH, offset, overrides);
    accumulated.push(...items);
    onBatch?.([...accumulated]);
    offset += BATCH;
    if (items.length === 0 || offset >= total) break;
  }
  return accumulated;
}

export default function MarketplaceClient({ initialRequests }: MarketplaceClientProps) {
  const { user, userData, signInWithGoogle } = useAuth();

  // Tab control: 'gotong_royong' (Industrial requests) or 'customer' (Direct consumer search) or 'pesanan' (My orders)
  const [activeMarketTab, setActiveMarketTab] = useState<MarketTab>(() => {
    if (!user) return 'customer';
    if (userData?.role === 'customer') return 'customer';
    if (userData?.role === 'koperasi') return 'gotong_royong';
    return 'customer';
  });
  const [isUmkmUser, setIsUmkmUser] = useState<boolean>(false);

  const showToggle = useMemo(() => {
    if (userData?.role === 'admin') return true;
    if (userData?.role === 'buyer' && !isUmkmUser) return true;
    return false;
  }, [userData, isUmkmUser]);

  useEffect(() => {
    if (userData?.role !== 'buyer' || !userData.associatedId) {
      return;
    }

    let isMounted = true;
    const checkBuyerType = async () => {
      try {
        const docRef = doc(db, 'buyers', userData.associatedId!);
        const docSnap = await getDoc(docRef);
        if (!isMounted) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const isUmkm = data.buyer_type === 'umkm';
          setIsUmkmUser(isUmkm);
          setActiveMarketTab(isUmkm ? 'customer' : 'gotong_royong');
        }
      } catch (error) {
        console.error('Error fetching buyer type:', error);
      }
    };

    void checkBuyerType();
    return () => {
      isMounted = false;
    };
  }, [userData?.role, userData?.associatedId]);

  // ─── STATE 1: GOTONG ROYONG ENGINE ──────────────────────────────────────────
  const [requests, setRequests] = useState<MarketRequestWithBuyer[]>(initialRequests);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [supplyMatches, setSupplyMatches] = useState<SupplyMatch[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('Semua');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('');
  const [commodityName, setCommodityName] = useState<string>('Jagung');
  const [quantity, setQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // ─── STATE 2: CUSTOMER CENTRIC MARKETPLACE ──────────────────────────────────
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [allCommodities, setAllCommodities] = useState<Commodity[]>([]);
  const [customerSearch, setCustomerSearch] = useState<string>('');

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: -6.2088, lng: 106.8456 }); // Default: Jakarta
  const [checkoutItem, setCheckoutItem] = useState<MarketplaceProduct | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [shippingOption, setShippingOption] = useState<'single' | 'split'>('single');

  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);

  // Pagination
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Reset to first page whenever search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [customerSearch]);

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

  const addToCart = (product: MarketplaceProduct) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
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

  const handleRemoveCartItem = (id: string, name: string) => {
    removeFromCart(id, name);
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

  // Load Cooperatives & Commodities for Customer search.
  // Products load progressively in batches (see loadInStockCommodities) so the
  // grid paints after the first page instead of waiting for the whole catalog.
  // Cooperatives load separately (lightweight getAll — never getAllWithDetails,
  // which fans out a full commodity fetch per cooperative and never resolves).
  // StrictMode-safe via the `cancelled` guard (ignores the discarded mount).
  useEffect(() => {
    let cancelled = false;

    loadInStockCommodities((partial) => {
      if (!cancelled) setAllCommodities(partial);
    }).catch((err) => console.error('Gagal memuat produk komoditas:', err));

    // Cooperative list supplies name/city/coordinates for distance ranking.
    cooperativeRepository.getAll()
      .then((list) => { if (!cancelled) setCoops(list); })
      .catch((err) => console.error('Gagal memuat data koperasi:', err));

    return () => { cancelled = true; };
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

  // OSRM driving distances: coopId → { distanceKm, eta, source }
  const [osrmDistances, setOsrmDistances] = useState<Map<string, { distanceKm: number; eta: string; source: 'osrm' | 'haversine' }>>(new Map());
  const [osrmLoading, setOsrmLoading] = useState(false);

  // Fetch driving distances from OSRM demo server whenever coops or user coords change
  useEffect(() => {
    if (coops.length === 0) return;
    setOsrmLoading(true);

    const fetchAll = async () => {
      const results = new Map<string, { distanceKm: number; eta: string; source: 'osrm' | 'haversine' }>();

      await Promise.allSettled(
        coops.map(async (coop) => {
          if (!coop.latitude || !coop.longitude) return;

          // Haversine fallback for this coop
          const hvDist = calculateDistance(coords.lat, coords.lng, coop.latitude, coop.longitude);
          const hvEta = hvDist < 5 ? '30–45 Menit' : hvDist < 20 ? '1–2 Jam' : hvDist < 100 ? '1 Hari Kerja' : '2–3 Hari (Kargo)';

          try {
            // OSRM demo: lon,lat order
            const url = `https://router.project-osrm.org/route/v1/driving/${coords.lng},${coords.lat};${coop.longitude},${coop.latitude}?overview=false`;
            const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
            if (!res.ok) throw new Error('OSRM error');
            const data = await res.json();
            if (data.code === 'Ok' && data.routes?.[0]) {
              const distKm = Math.round(data.routes[0].distance / 100) / 10; // meters → km, 1 dec
              const sec = data.routes[0].duration;
              let eta = '';
              if (sec < 3600) eta = `${Math.round(sec / 60)} Menit`;
              else if (sec < 86400) eta = `${(sec / 3600).toFixed(1).replace('.0', '')} Jam`;
              else eta = `${Math.ceil(sec / 86400)} Hari`;
              results.set(coop.id, { distanceKm: distKm, eta, source: 'osrm' });
            } else {
              results.set(coop.id, { distanceKm: hvDist, eta: hvEta, source: 'haversine' });
            }
          } catch {
            results.set(coop.id, { distanceKm: hvDist, eta: hvEta, source: 'haversine' });
          }
        })
      );

      setOsrmDistances(results);
      setOsrmLoading(false);
    };

    fetchAll();
  }, [coops, coords]);

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
    const matchingComs = customerSearch.trim()
      ? allCommodities.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(customerSearch.toLowerCase())
      )
      : allCommodities.filter(c => c.available_stock > 0);

    return matchingComs.map(com => {
      const coop = coops.find(x => x.id === com.cooperative_id);

      // Prefer OSRM driving distance; fall back to Haversine
      const osrm = coop ? osrmDistances.get(coop.id) : undefined;
      const distance = osrm?.distanceKm ??
        (coop ? calculateDistance(coords.lat, coords.lng, coop.latitude, coop.longitude) : 15.0);
      const distanceSource = osrm?.source ?? 'haversine';

      const haversineEta = distance < 5 ? '30–45 Menit' : distance < 20 ? '1–2 Jam' : distance < 100 ? '1 Hari Kerja' : '2–3 Hari (Kargo)';
      const eta = osrm?.eta ?? haversineEta;

      const pricePerKg = com.price_per_unit || 12000;
      const deliveryCost = Math.max(10000, Math.round(distance * 2500));

      return {
        ...com,
        coopName: coop?.name || 'Koperasi Mitra',
        city: coop?.city || 'Garut',
        province: coop?.province || 'Jawa Barat',
        // Grade comes from the scoring engine (not in the lightweight coop list);
        // default to 'B' here to avoid the expensive per-coop score computation.
        grade: 'B',
        coopPhone: coop?.phone || '082122345566',
        distance,
        distanceSource,
        deliveryCost,
        eta,
        pricePerKg
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [allCommodities, coops, customerSearch, coords, osrmDistances]);

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

  const handleSetMarketTab = (tab: MarketTab) => {
    setActiveMarketTab(tab);
  };

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenCheckoutModal = () => {
    setCheckoutItem(null);
  };

  const handleCloseCheckoutModal = () => {
    setCheckoutItem(null);
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  const handleLoginWithGoogle = async () => {
    await signInWithGoogle();
    setShowLoginPrompt(false);
  };

  const handleAddToCart = (product: MarketplaceProduct) => {
    addToCart(product);
  };

  const handleRemoveFromCart = (id: string, name: string) => {
    removeFromCart(id, name);
  };

  const handleUpdateCartQty = (id: string, name: string, qty: number) => {
    updateCartQty(id, name, qty);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(Math.ceil(searchedProducts.length / PAGE_SIZE) - 1, prev + 1));
  };

  const handleSelectPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleClosePaymentModal = () => {
    setActivePayment(null);
  };

  const handleSelectShippingOption = (option: 'single' | 'split') => {
    setShippingOption(option);
  };

  const handleShowAddressPrompt = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    alert("Silakan gunakan tombol 'Atur Alamat' di bagian kanan atas (Navbar) untuk mengubah alamat pengiriman utama Anda.");
  };

  const handleApprovePaymentRequest = (req: MarketRequestWithBuyer) => {
    void handleAdminApprovePayment(req);
  };

  const handleShowOrderPaymentDetails = (order: MarketRequestWithBuyer & { coopName: string; coopCity: string; coopPhone?: string }) => {
    const mockCommodityPrice = 12000;
    const deliveryCost = 25000;
    const totalAmount = order.quantity * mockCommodityPrice + deliveryCost;
    setActivePayment({
      items: [{
        id: order.id,
        name: order.commodity_name,
        coopName: order.coopName,
        coopPhone: order.coopPhone,
        cooperative_id: order.coopName || 'coop-jabar-garut',
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
  };

  // Active Payment State for Bank Transfer verification
  const [activePayment, setActivePayment] = useState<ActivePaymentState | null>(null);

  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [useCustomAddress, setUseCustomAddress] = useState<boolean>(false);

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
        cooperative_id: item.cooperative_id || (coops.length > 0 ? coops[0].id : 'coop-jabar-garut')
      })),
      totalAmount,
      isCart: true
    });
    setIsCartOpen(false); // Close cart drawer
  };

  const confirmPaymentTransfer = async () => {
    if (!activePayment) return;
    setVerifyingPayment(true);

    // Simulate payment gateway settlement check for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const buyerId = userData?.associatedId || 'guest_customer';
      const currentBuyer = buyers.find(b => b.id === buyerId);
      const defaultAddress = userData?.role === 'customer'
        ? (userData?.address || 'Alamat tidak diatur')
        : (currentBuyer?.address || currentBuyer?.city || 'Alamat profil');
      const resolvedAddress = useCustomAddress ? customAddress : defaultAddress;

      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const baseInvoice = `ARN-${dateStr}-${randomHex}`;

      // Process each item in the payment
      let index = 0;
      for (const item of activePayment.items) {
        const invoiceNum = activePayment.items.length > 1 ? `${baseInvoice}-${index + 1}` : baseInvoice;

        // 1. Create paid/fulfilled request immediately
        const reqCol = collection(db, 'market_requests');
        const newReqDoc = await addDoc(reqCol, {
          buyer_id: buyerId,
          commodity_name: item.name,
          quantity: item.quantity,
          unit: 'Kg',
          status: 'Terpenuhi', // Set immediately to paid / fulfilled
          shipping_address: resolvedAddress,
          created_at: now.toISOString(),
          invoice_number: invoiceNum,
          coopName: item.coopName || 'Koperasi Desa Merah Putih',
          total_price: item.pricePerKg * item.quantity + (item.deliveryCost || 0)
        });

        // 2. Create supply matching record
        const matchCol = collection(db, 'supply_matches');
        await addDoc(matchCol, {
          request_id: newReqDoc.id,
          cooperative_id: item.cooperative_id || item.cooperativeId || (coops.length > 0 ? coops[0].id : 'coop-jabar-garut'),
          allocated_quantity: item.quantity,
          matched_at: now.toISOString()
        });

        // 3. Auto-decrement stock in Firestore
        const comRef = doc(db, 'commodities', item.id);
        const snap = await getDoc(comRef);
        if (snap.exists()) {
          const currentStock = snap.data().available_stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(comRef, { available_stock: newStock });

          // 4. Auto-decrement stock in local IndexedDB
          if (localDb) {
            await localDb.commodities.update(item.id, { available_stock: newStock });
            await queueForSync('stock', 'update', { id: item.id, available_stock: newStock });
          }
        }

        // Save it back to the item for current session reference
        item.invoice_number = invoiceNum;
        index++;
      }

      // Refresh local UI: reuse the batched in-stock loader so the product list
      // stays consistent with the initial load (in-stock only, cached, batched).
      const [coopList, comList] = await Promise.all([
        cooperativeRepository.getAll(),
        loadInStockCommodities(),
      ]);
      setCoops(coopList);
      setAllCommodities(comList);

      setPaymentSuccess(true);
      if (activePayment.isCart) {
        setCart([]); // Clear cart
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        setActivePayment(null);
        setPaymentSuccess(false);
        setUseCustomAddress(false);
        setCustomAddress('');
      }, 3000);

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

        // Refresh local UI: reuse the batched in-stock loader for consistency.
        const [coopList, comList] = await Promise.all([
          cooperativeRepository.getAll(),
          loadInStockCommodities(),
        ]);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b border-slate-200 pb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-brand-red shrink-0" />
              ARUNA Commerce Network
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Jaringan logistik nasional yang mempertemukan Koperasi, Industri, dan Pelanggan Umum.
            </p>
          </div>

          {user && (showToggle ? (
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] sm:text-xs font-bold w-full sm:w-auto overflow-x-auto no-scrollbar sm:shrink-0">
              <button
                onClick={() => handleSetMarketTab('gotong_royong')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap flex-1 sm:flex-none ${activeMarketTab === 'gotong_royong' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Gotong Royong Industri
              </button>
              <button
                onClick={() => handleSetMarketTab('customer')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap flex-1 sm:flex-none ${activeMarketTab === 'customer' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Belanja Komoditas
              </button>
              <button
                onClick={() => handleSetMarketTab('pesanan')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap flex-1 sm:flex-none ${activeMarketTab === 'pesanan' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Pesanan Saya
              </button>
            </div>
          ) : (
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] sm:text-xs font-bold w-full sm:w-auto overflow-x-auto no-scrollbar sm:shrink-0">
              <button
                onClick={() => handleSetMarketTab('customer')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap flex-1 sm:flex-none ${activeMarketTab === 'customer' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Belanja Komoditas
              </button>
              <button
                onClick={() => handleSetMarketTab('pesanan')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap flex-1 sm:flex-none ${activeMarketTab === 'pesanan' ? 'bg-white text-brand-navy shadow-sm' : 'text-slate-500'}`}
              >
                Pesanan Saya
              </button>
            </div>
          ))}
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
                    onChange={(val) => setStatusFilter(val as RequestStatusFilter)}
                    className="w-40"
                  />
                </div>
              </div>

              {canCreate && (
                <Button
                  onClick={handleOpenCreateModal}
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
                      <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${req.status === 'Menunggu Pembayaran' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
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
                            onClick={() => handleApprovePaymentRequest(req)}
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
            {/* Search bar */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari produk, kategori... (cth: Beras, Jagung, Kopi)"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold hidden sm:flex items-center gap-1 shrink-0">
                <Navigation className="h-3 w-3 text-brand-orange animate-pulse" />
                {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
              </span>
              {searchedProducts.length > 0 && (
                <span className="text-xs text-slate-500 font-semibold shrink-0 hidden md:block">
                  {searchedProducts.length} produk
                </span>
              )}
            </div>

            {/* Product Grid — paginated, 4 cols desktop / 2 tablet / 1 mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchedProducts.length === 0 ? (
                <div className="col-span-4 text-center py-16 text-slate-400">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">
                    {customerSearch.trim()
                      ? `Produk "${customerSearch}" tidak ditemukan`
                      : 'Memuat produk dari seluruh koperasi...'}
                  </p>
                </div>
              ) : (
                searchedProducts
                  .slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
                  .map(prod => (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                    >
                      {/* Product image area — shows real photo when available, emoji fallback */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 h-36 flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                        {prod.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <span className="text-4xl select-none">
                              {prod.category === 'Pertanian' ? '🌾' :
                                prod.category === 'Perkebunan' ? '🌿' :
                                  prod.category === 'Perikanan' ? '🐟' :
                                    prod.category === 'Peternakan' ? '🐄' :
                                      prod.category === 'Kehutanan' ? '🌳' : '📦'}
                            </span>
                            <Badge className="bg-white/80 text-slate-600 border border-slate-200 font-semibold text-[9px] uppercase px-2">
                              {prod.category}
                            </Badge>
                          </>
                        )}
                        {/* Distance chip */}
                        <span className={`absolute top-2 right-2 backdrop-blur-sm border text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10 ${osrmLoading
                          ? 'bg-white/70 border-slate-200 text-slate-400 animate-pulse'
                          : prod.distanceSource === 'osrm'
                            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700'
                            : 'bg-white/90 border-slate-200 text-slate-600'
                          }`}>
                          <MapPin className="h-2.5 w-2.5 text-brand-red" />
                          {osrmLoading ? '...' : `${prod.distance} km`}
                          {!osrmLoading && prod.distanceSource === 'osrm' && (
                            <span className="text-[8px] text-emerald-600 font-black">via jalan</span>
                          )}
                        </span>
                        {/* Grade badge */}
                        <span className={`absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white z-10 ${prod.grade === 'A' ? 'bg-emerald-500' : prod.grade === 'B' ? 'bg-blue-500' : 'bg-slate-400'
                          }`}>
                          Kelas {prod.grade}
                        </span>
                      </div>

                      {/* Card body */}
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        {/* Name & coop */}
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{prod.name}</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1 line-clamp-1">
                            <Building2 className="h-3 w-3 shrink-0" /> {prod.coopName}
                          </p>
                        </div>

                        {/* Price */}
                        <div>
                          <span className="text-base font-black text-brand-navy tabular-nums">
                            Rp {prod.pricePerKg.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold"> / {prod.unit}</span>
                        </div>

                        {/* Meta row */}
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-0.5">
                            <Truck className="h-3 w-3" /> Rp {prod.deliveryCost.toLocaleString('id-ID')}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {prod.eta}
                          </span>
                        </div>

                        {/* Stock */}
                        <p className="text-[10px] text-slate-400 font-medium">
                          Stok: <strong className="text-slate-700">{prod.available_stock} {prod.unit}</strong>
                        </p>

                        {/* CTA */}
                        <div className="mt-auto flex justify-end">
                          <button
                            onClick={() => handleAddToCart(prod)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-brand-navy hover:text-white hover:bg-brand-navy border border-brand-navy/30 hover:border-brand-navy px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer"
                          >
                            <ShoppingBag className="h-3 w-3" />
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Pagination controls */}
            {searchedProducts.length > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  ← Sebelumnya
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(searchedProducts.length / PAGE_SIZE) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectPage(i)}
                      className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${i === currentPage
                        ? 'bg-brand-navy text-white'
                        : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= Math.ceil(searchedProducts.length / PAGE_SIZE) - 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Berikutnya →
                </button>

                <span className="text-[10px] text-slate-400 font-medium ml-2">
                  {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, searchedProducts.length)} dari {searchedProducts.length} produk
                </span>
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
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${order.status === 'Menunggu Pembayaran' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
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
                          onClick={() => handleApprovePaymentRequest(order)}
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
                            handleShowOrderPaymentDetails(order);
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
                <button onClick={handleCloseCreateModal} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
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
                    onClick={handleCloseCreateModal}
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
                <button onClick={handleCloseCheckoutModal} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
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
                          onChange={() => handleSelectShippingOption('single')}
                          className="accent-brand-navy h-4 w-4"
                        />
                        Single Kirim (Satu Kargo Lebih Lambat)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-extrabold cursor-pointer">
                        <input
                          type="radio"
                          name="shipping_opt"
                          checked={shippingOption === 'split'}
                          onChange={() => handleSelectShippingOption('split')}
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
                    onClick={handleCloseCheckoutModal}
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

        {/* ─── LOGIN PROMPT MODAL ──────────────────────────────────────────────── */}
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseLoginPrompt} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-16 w-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-8 w-8 text-brand-red" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-slate-900">Masuk untuk Berbelanja</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Buat akun atau masuk untuk menambahkan produk ke keranjang dan melakukan pemesanan ke koperasi.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleLoginWithGoogle}
                  className="w-full py-3 bg-brand-red hover:bg-brand-red/90 text-white font-black text-sm flex items-center justify-center gap-2 rounded-xl cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk dengan Google
                </Button>
                <button
                  onClick={handleCloseLoginPrompt}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  Lanjut melihat produk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── SHOPPING CART FLOATING BUBBLE AND DRAWER ────────────────────────── */}
        {/* Floating Bubble */}
        <button
          onClick={handleOpenCart}
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={handleCloseCart} />

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
                  <button onClick={handleCloseCart} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                          <button onClick={() => handleRemoveCartItem(item.id, item.name)} className="text-slate-350 hover:text-red-500 cursor-pointer">
                            <X className="h-4 w-4" />
                          </button>
                          {/* Qty Adjuster */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden text-xs">
                            <button
                              onClick={() => handleUpdateCartQty(item.id, item.name, item.quantity - 1)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 font-bold border-r border-slate-200 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 font-bold text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQty(item.id, item.name, item.quantity + 1)}
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
          const coopSplits = activePayment.items.reduce<Record<string, { coopName: string; subtotal: number; delivery: number }>>((acc, it) => {
            const key = it.coopName || 'Koperasi Desa Merah Putih';
            if (!acc[key]) {
              acc[key] = {
                coopName: key,
                subtotal: 0,
                delivery: 0,
              };
            }
            acc[key].subtotal += it.pricePerKg * it.quantity;
            acc[key].delivery += it.deliveryCost || 0;
            return acc;
          }, {});

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-sans animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">

                {!paymentSuccess ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="h-5 w-5 text-brand-navy animate-pulse" />
                        Gerbang Pembayaran QRIS (ARUNA Hub)
                      </h3>
                      {!verifyingPayment && (
                        <button onClick={handleClosePaymentModal} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {/* QRIS Simulated QR Code Graphic */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-3">
                      <div className="bg-[#E52A30] px-4 py-1 rounded-full flex items-center justify-center gap-1 text-white font-black text-[9px] tracking-widest uppercase shadow-xs">
                        <span>QRIS</span>
                        <span className="text-[7px] font-medium opacity-80">GPN</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=003049&data=aruna-payment-escrow-${activePayment.totalAmount}`}
                          alt="QRIS QR Code"
                          className="w-44 h-44 rounded-lg object-contain"
                        />
                      </div>

                      <div className="text-center space-y-0.5">
                        <span className="text-[9px] text-slate-400 block font-black uppercase">Sisa Waktu Pembayaran</span>
                        <span className="text-sm font-black text-brand-navy font-mono animate-pulse">04:59</span>
                      </div>
                    </div>

                    {/* Total Amount Box */}
                    <div className="bg-brand-navy/5 border border-brand-navy/10 p-3.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500 uppercase text-[9px] font-black">Total Tagihan Belanja</span>
                      <span className="text-base font-black text-brand-orange tabular-nums">
                        Rp {activePayment.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Split Payout Breakdown */}
                    <div className="space-y-2">
                      <span className="text-[9.5px] text-slate-400 block font-black uppercase tracking-wide">Rincian Split Payment (Sistem Otomatis)</span>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {Object.values(coopSplits).map((split, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-7 w-7 rounded-lg bg-brand-navy/5 flex items-center justify-center font-black text-brand-navy text-[10px] shrink-0">
                                🏢
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] font-black text-slate-800 block truncate max-w-[170px]">{split.coopName}</span>
                                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                  Auto-Split (H+1)
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-slate-850 block">Rp {(split.subtotal + split.delivery).toLocaleString('id-ID')}</span>
                              <span className="text-[8.5px] text-slate-400 font-extrabold block">Ongkir: Rp {split.delivery.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address Confirmation section */}
                    {!activePayment.isReadOnly && (
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <span className="text-[9.5px] text-slate-400 block font-black uppercase tracking-wide">Alamat Pengiriman</span>

                        {!useCustomAddress ? (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/50 text-[11px] text-slate-700 font-semibold space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-400 block font-bold">
                                {userData?.role === 'customer' ? 'ALAMAT UTAMA PELANGGAN' : 'ALAMAT PROFIL PERUSAHAAN'}
                              </span>
                              {userData?.role === 'customer' && (
                                <button
                                  onClick={handleShowAddressPrompt}
                                  className="text-[9px] text-brand-red font-black hover:underline cursor-pointer bg-transparent border-0 p-0"
                                >
                                  Ubah Alamat Utama
                                </button>
                              )}
                            </div>
                            <p>
                              {userData?.role === 'customer'
                                ? (userData?.address || 'Alamat belum diatur. Klik "Atur Alamat" di kanan atas (Navbar) untuk mengaturnya.')
                                : (buyers.find(b => b.id === (userData?.associatedId || 'guest_customer'))?.address || buyers.find(b => b.id === (userData?.associatedId || 'guest_customer'))?.city || 'Alamat tidak diatur')
                              }
                            </p>
                          </div>
                        ) : (
                          <textarea
                            placeholder="Masukkan alamat pengiriman alternatif untuk pesanan ini..."
                            value={customAddress}
                            onChange={(e) => setCustomAddress(e.target.value)}
                            rows={2}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-red text-slate-800 resize-none font-sans"
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
                        <Button
                          onClick={handleClosePaymentModal}
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
                            Memproses Webhook Pembayaran...
                          </>
                        ) : (
                          'Saya Sudah Scan & Bayar'
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-slate-900">Pembayaran Berhasil!</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Dana telah disalurkan otomatis ke masing-masing rekening koperasi penyedia barang. Stok produk pada sistem telah otomatis dikurangi.
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

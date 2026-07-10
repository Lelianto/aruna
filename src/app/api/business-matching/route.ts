import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from '@/lib/db';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { calculateCooperativeScore } from '@/lib/services/score-engine';
import { loadAllCooperativeScores } from '@/lib/services/score-persistence';

function getProductCategory(name: string): string {
  const cleanName = (name || '').toLowerCase();
  if (cleanName.includes('gas') || cleanName.includes('lpg') || cleanName.includes('bensin') || cleanName.includes('solar')) {
    return 'Energi';
  }
  if (cleanName.includes('gula') || cleanName.includes('minyak') || cleanName.includes('beras') || cleanName.includes('telur') || cleanName.includes('susu') || cleanName.includes('tepung') || cleanName.includes('indomie')) {
    return 'Pangan';
  }
  if (cleanName.includes('kopi') || cleanName.includes('teh') || cleanName.includes('madu') || cleanName.includes('cokelat')) {
    return 'Perkebunan';
  }
  if (cleanName.includes('sapi') || cleanName.includes('kambing') || cleanName.includes('ayam') || cleanName.includes('daging')) {
    return 'Peternakan';
  }
  if (cleanName.includes('ikan') || cleanName.includes('udang') || cleanName.includes('kepiting') || cleanName.includes('lobster')) {
    return 'Perikanan';
  }
  return 'Pertanian';
}

async function getCooperativesInternal() {
  const listRes = await query(`
    SELECT 
      pk.koperasi_ref AS id,
      pk.nama_koperasi AS name,
      rw.provinsi AS province,
      rw.kab_kota AS city,
      pk.koordinat_dibulatkan,
      (SELECT count(*) FROM anggota_koperasi WHERE koperasi_ref = pk.koperasi_ref) AS member_count,
      (SELECT count(*) FROM anggota_koperasi WHERE koperasi_ref = pk.koperasi_ref AND status_keanggotaan = 'Approved') AS active_members,
      (SELECT COALESCE(SUM(total_pembayaran), 0) FROM transaksi_penjualan WHERE koperasi_ref = pk.koperasi_ref) AS annual_revenue
    FROM profil_koperasi pk
    LEFT JOIN referensi_koperasi_wilayah rkw ON pk.koperasi_ref = rkw.koperasi_ref
    LEFT JOIN referensi_wilayah rw ON rkw.kode_wilayah = rw.kode_wilayah
    ORDER BY pk.nama_koperasi ASC
  `);

  const list = listRes.rows.map(rawCoop => {
    const [latStr, lngStr] = (rawCoop.koordinat_dibulatkan || '').split(',');
    return {
      id: rawCoop.id,
      name: rawCoop.name,
      province: rawCoop.province || 'Jawa Tengah',
      city: rawCoop.city || 'Boyolali',
      latitude: latStr ? parseFloat(latStr.trim()) : -7.53,
      longitude: lngStr ? parseFloat(lngStr.trim()) : 110.59,
      member_count: parseInt(rawCoop.member_count, 10) || 0,
      active_members: parseInt(rawCoop.active_members, 10) || 0,
      annual_revenue: parseFloat(rawCoop.annual_revenue) || 0.0,
      simkopdes_id: `KDKMP-${rawCoop.id.substring(4, 9)}`,
      nib: null,
      nib_status: 'unsubmitted',
      sk_number: null,
      sk_status: 'unsubmitted',
      cash_reserve: 50000000
    };
  });

  const overridesSnap = await getDocs(collection(db, 'cooperatives'));
  const overridesMap: Record<string, any> = {};
  overridesSnap.forEach((docSnap) => {
    overridesMap[docSnap.id] = docSnap.data();
  });

  return list.map(coop => {
    const override = overridesMap[coop.id];
    if (override) {
      return { ...coop, ...override };
    }
    return coop;
  });
}

async function getCommoditiesInternal() {
  const result = await query(`
    SELECT 
      pk.produk_sample_id AS id,
      pk.koperasi_ref AS cooperative_id,
      pk.nama_produk AS name,
      pk.unit,
      COALESCE(ip.stok, 0) AS available_stock
    FROM produk_koperasi pk
    LEFT JOIN inventaris_produk ip ON pk.produk_sample_id = ip.produk_sample_id AND pk.koperasi_ref = ip.koperasi_ref
  `);

  const pgList = result.rows.map(row => {
    const stock = parseFloat(row.available_stock) || 0;
    return {
      id: row.id,
      cooperative_id: row.cooperative_id,
      name: row.name,
      sku: row.id || '',
      category: getProductCategory(row.name),
      available_stock: stock,
      monthly_capacity: stock > 0 ? stock * 2 : 100,
      unit: row.unit || 'Kg',
      harvest_period: 'Sepanjang Tahun'
    };
  });

  const fsSnap = await getDocs(collection(db, 'commodities'));
  const fsList: any[] = [];
  fsSnap.forEach((docSnap) => {
    fsList.push({ id: docSnap.id, ...docSnap.data() });
  });

  const merged = [...pgList];
  fsList.forEach(fsComm => {
    const idx = merged.findIndex(c => c.id === fsComm.id);
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], ...fsComm };
    } else {
      merged.push(fsComm);
    }
  });

  return merged;
}

async function getScoresInternal() {
  return loadAllCooperativeScores();
}

async function getCooperativesWithDetailsInternal() {
  const coops = await getCooperativesInternal();
  const commodities = await getCommoditiesInternal();
  const scoresMap = await getScoresInternal();

  const maxRevenue = Math.max(...coops.map(c => c.annual_revenue), 1);

  return coops.map(coop => {
    const coopComms = commodities.filter(c => c.cooperative_id === coop.id);
    const score = scoresMap[coop.id] || calculateCooperativeScore(coop, coopComms, maxRevenue);
    return {
      ...coop,
      commodities: coopComms,
      score
    };
  });
}

export async function POST(request: NextRequest) {
  let body: any = {};

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    try {
      body = await request.json();
    } catch (e) {
      // Body may be empty
    }

    const perspective = body.perspective || 'general';
    const buyerId = body.buyer_id;
    const cooperativeId = body.cooperative_id;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemma-4-31b-it',
      generationConfig: { responseMimeType: 'application/json' }
    });

    if (perspective === 'industry') {
      // --- PERSPECTIVE: INDUSTRY (Buyer looking for Cooperatives) ---
      const requestsSnap = await getDocs(collection(db, 'market_requests'));
      const buyersSnap = await getDocs(collection(db, 'buyers'));

      const buyersMap: Record<string, any> = {};
      buyersSnap.forEach(docSnap => {
        buyersMap[docSnap.id] = docSnap.data();
      });

      const targetBuyer = buyerId ? buyersMap[buyerId] : null;
      const buyerName = targetBuyer ? targetBuyer.company_name : 'Semua';

      const activeRequests: any[] = [];
      requestsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (buyerId && data.buyer_id !== buyerId) return;

        const buyer = buyersMap[data.buyer_id] || { company_name: 'Perusahaan Offtaker B2B', city: 'Nasional' };
        if (data.status === 'Menunggu Pemenuhan' || data.status === 'Terpenuhi Sebagian') {
          activeRequests.push({
            id: docSnap.id,
            buyer_name: buyer.company_name,
            buyer_city: buyer.city,
            commodity_name: data.commodity_name,
            quantity: parseFloat(data.quantity) || 0,
            unit: data.unit || 'ton',
            status: data.status
          });
        }
      });

      if (activeRequests.length === 0) {
        activeRequests.push(
          { id: 'req-mock-1', buyer_name: buyerName !== 'Semua' ? buyerName : 'PT Indofood CBP', buyer_city: 'Jakarta', commodity_name: 'Singkong', quantity: 500, unit: 'ton', status: 'Menunggu Pemenuhan' },
          { id: 'req-mock-2', buyer_name: buyerName !== 'Semua' ? buyerName : 'PT Sinar Mas Agro', buyer_city: 'Surabaya', commodity_name: 'Kelapa', quantity: 1200, unit: 'ton', status: 'Menunggu Pemenuhan' },
          { id: 'req-mock-3', buyer_name: buyerName !== 'Semua' ? buyerName : 'Kopi Kenangan Group', buyer_city: 'Bandung', commodity_name: 'Kopi', quantity: 80, unit: 'ton', status: 'Menunggu Pemenuhan' }
        );
      }

      const coopsWithDetails = await getCooperativesWithDetailsInternal();
      const simpleCoops = coopsWithDetails.map(c => ({
        cooperative_id: c.id,
        name: c.name,
        city: c.city,
        province: c.province,
        aruna_score: c.score.final_score,
        aruna_grade: c.score.grade,
        commodities: c.commodities.map((com: any) => ({
          commodity_id: com.id,
          name: com.name,
          available_stock: com.available_stock,
          unit: com.unit
        }))
      }));

      const prompt = `
        Anda adalah pakar Analitik Rantai Pasok Koperasi dan Business Matching di Indonesia.
        Tugas Anda adalah menganalisis kecocokan antara permintaan industri (Demand B2B) dan persediaan Koperasi Terdaftar (Supply) untuk merekomendasikan Koperasi mana saja yang paling siap untuk memasok kebutuhan industri tersebut.

        DATA INDUSTRI DEMAND (Permintaan Pembeli):
        ${JSON.stringify(activeRequests, null, 2)}

        DATA KOPERASI SUPPLY (Koperasi & Stok Tersedia):
        ${JSON.stringify(simpleCoops, null, 2)}

        TUGAS ANDA:
        Cocokkan komoditas yang diminta industri dengan koperasi yang memproduksi komoditas sejenis (misal: "Jagung" dengan "Jagung Pipilan", "Kopi" dengan "Kopi Arabika").
        Hasilkan analisis berupa array JSON dengan struktur berikut:
        [
          {
            "match_id": "Kode unik misal MATCH-IND-001",
            "buyer_name": "Nama pembeli industri",
            "commodity_name": "Nama komoditas yang cocok",
            "quantity_demanded": 500, // jumlah permintaan pembeli
            "unit": "ton",
            "cooperative_name": "Nama koperasi penyedia",
            "city": "Kota koperasi",
            "province": "Provinsi koperasi",
            "available_stock": 250, // stok koperasi yang tersedia
            "coop_unit": "Kg", // satuan stok koperasi
            "aruna_score": 85, // skor kesehatan koperasi (0-100)
            "aruna_grade": "B", // grade koperasi (A/B/C/D)
            "match_score": 90, // Persentase kecocokan 0-100 (dasarkan pada kecocokan produk, stok tersedia, skor koperasi, dan faktor kedekatan daerah)
            "recommendation": "Rekomendasi taktis 2-3 kalimat: Jelaskan mengapa koperasi ini cocok untuk menyuplai. Berikan rekomendasi logistik spesifik dan langkah gotong royong jika stok kurang dari yang diminta."
          }
        ]

        Ketentuan:
        - Berikan minimal 3 dan maksimal 8 rekomendasi kecocokan terbaik.
        - Hanya keluarkan array JSON tersebut. Jangan berikan teks pembuka, penutup, atau tanda markdown.
      `;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const endIdx = textResponse.lastIndexOf(']');
      const startIdx = textResponse.indexOf('[');
      if (endIdx === -1 || startIdx === -1) {
        throw new Error('Valid JSON array markers [ and ] not found in AI response');
      }
      const jsonStr = textResponse.substring(startIdx, endIdx + 1);
      const matches = JSON.parse(jsonStr);

      return NextResponse.json({
        success: true,
        matches
      });

    } else if (perspective === 'cooperative') {
      // --- PERSPECTIVE: COOPERATIVE (Cooperative looking for Buyers/Industries) ---
      const coopsWithDetails = await getCooperativesWithDetailsInternal();
      const targetCoop = cooperativeId ? coopsWithDetails.find(c => c.id === cooperativeId) : null;
      const coopName = targetCoop ? targetCoop.name : 'Semua Koperasi';

      const requestsSnap = await getDocs(collection(db, 'market_requests'));
      const buyersSnap = await getDocs(collection(db, 'buyers'));

      const buyersMap: Record<string, any> = {};
      buyersSnap.forEach(docSnap => {
        buyersMap[docSnap.id] = docSnap.data();
      });

      const activeRequests: any[] = [];
      requestsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const buyer = buyersMap[data.buyer_id] || { company_name: 'Perusahaan Offtaker B2B', city: 'Nasional' };
        if (data.status === 'Menunggu Pemenuhan' || data.status === 'Terpenuhi Sebagian') {
          activeRequests.push({
            id: docSnap.id,
            buyer_name: buyer.company_name,
            buyer_city: buyer.city,
            commodity_name: data.commodity_name,
            quantity: parseFloat(data.quantity) || 0,
            unit: data.unit || 'ton',
            status: data.status
          });
        }
      });

      if (activeRequests.length === 0) {
        activeRequests.push(
          { id: 'req-mock-1', buyer_name: 'PT Indofood CBP', buyer_city: 'Jakarta', commodity_name: 'Singkong', quantity: 500, unit: 'ton', status: 'Menunggu Pemenuhan' },
          { id: 'req-mock-2', buyer_name: 'PT Sinar Mas Agro', buyer_city: 'Surabaya', commodity_name: 'Kelapa', quantity: 1200, unit: 'ton', status: 'Menunggu Pemenuhan' },
          { id: 'req-mock-3', buyer_name: 'Kopi Kenangan Group', buyer_city: 'Bandung', commodity_name: 'Kopi', quantity: 80, unit: 'ton', status: 'Menunggu Pemenuhan' }
        );
      }

      const simpleCoops = coopsWithDetails.filter(c => !cooperativeId || c.id === cooperativeId).map(c => ({
        cooperative_id: c.id,
        name: c.name,
        city: c.city,
        province: c.province,
        aruna_score: c.score.final_score,
        aruna_grade: c.score.grade,
        commodities: c.commodities.map((com: any) => ({
          commodity_id: com.id,
          name: com.name,
          available_stock: com.available_stock,
          unit: com.unit
        }))
      }));

      const prompt = `
        Anda adalah pakar Analitik Rantai Pasok Koperasi dan Business Matching di Indonesia.
        Tugas Anda adalah mencocokkan persediaan komoditas Koperasi (Supply) dengan permintaan pasar industri aktif (Demand B2B) agar Koperasi tersebut dapat menemukan pembeli yang cocok untuk komoditasnya.

        DATA KOPERASI SUPPLY:
        ${JSON.stringify(simpleCoops, null, 2)}

        DATA INDUSTRI DEMAND (Permintaan Pembeli):
        ${JSON.stringify(activeRequests, null, 2)}

        TUGAS ANDA:
        Temukan permintaan industri (buyer) yang mencari komoditas yang diproduksi oleh Koperasi tersebut.
        Hasilkan analisis berupa array JSON dengan struktur berikut:
        [
          {
            "match_id": "Kode unik misal MATCH-COOP-001",
            "cooperative_name": "Nama koperasi Anda",
            "commodity_name": "Nama komoditas yang dipasok",
            "cooperative_available_stock": 100, // stok koperasi yang tersedia
            "cooperative_unit": "Kg", // satuan stok koperasi
            "buyer_name": "Nama perusahaan pembeli",
            "buyer_city": "Kota perusahaan pembeli",
            "quantity_demanded": 500, // jumlah yang diminta industri
            "unit": "ton", // satuan permintaan industri
            "match_score": 85, // Persentase kecocokan 0-100 (dihitung dari kecocokan jenis produk, kecukupan stok, dan kelayakan logistik)
            "recommendation": "Rekomendasi taktis 2-3 kalimat: Berikan panduan bagi koperasi tentang cara bernegosiasi, melengkapi kuota melalui gotong royong dengan koperasi tetangga, serta standardisasi kualitas produk untuk memenuhi kriteria industri tersebut."
          }
        ]

        Ketentuan:
        - Berikan minimal 2 dan maksimal 8 rekomendasi kecocokan paling relevan.
        - Hanya keluarkan array JSON tersebut. Jangan berikan teks pembuka, penutup, atau tanda markdown.
      `;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const endIdx = textResponse.lastIndexOf(']');
      const startIdx = textResponse.indexOf('[');
      if (endIdx === -1 || startIdx === -1) {
        throw new Error('Valid JSON array markers [ and ] not found in AI response');
      }
      const jsonStr = textResponse.substring(startIdx, endIdx + 1);
      const matches = JSON.parse(jsonStr);

      return NextResponse.json({
        success: true,
        matches
      });

    } else {
      // --- PERSPECTIVE: GENERAL (System-wide Village Potential to Buyer Requests) ---
      const requestsSnap = await getDocs(collection(db, 'market_requests'));
      const buyersSnap = await getDocs(collection(db, 'buyers'));

      const buyersMap: Record<string, any> = {};
      buyersSnap.forEach(docSnap => {
        buyersMap[docSnap.id] = docSnap.data();
      });

      const marketRequests: any[] = [];
      requestsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const buyer = buyersMap[data.buyer_id] || { company_name: 'Perusahaan Offtaker B2B', city: 'Nasional' };
        if (data.status === 'Menunggu Pemenuhan' || data.status === 'Terpenuhi Sebagian') {
          marketRequests.push({
            id: docSnap.id,
            buyer_name: buyer.company_name,
            buyer_city: buyer.city,
            commodity_name: data.commodity_name,
            quantity: parseFloat(data.quantity) || 0,
            unit: data.unit || 'ton',
            status: data.status
          });
        }
      });

      if (marketRequests.length === 0) {
        marketRequests.push(
          { id: 'req-mock-1', buyer_name: 'PT Indofood CBP', buyer_city: 'Jakarta', commodity_name: 'Singkong', quantity: 500, unit: 'ton', status: 'Menunggu Pemenuhan' },
          { id: 'req-mock-2', buyer_name: 'PT Sinar Mas Agro', buyer_city: 'Surabaya', commodity_name: 'Kelapa', quantity: 1200, unit: 'ton', status: 'Menunggu Pemenuhan' },
          { id: 'req-mock-3', buyer_name: 'Kopi Kenangan Group', buyer_city: 'Bandung', commodity_name: 'Kopi', quantity: 80, unit: 'ton', status: 'Menunggu Pemenuhan' }
        );
      }

      const potentialsRes = await query(`
        SELECT 
          rk.komoditas_ref AS id,
          rk.nama_komoditas AS commodity_name,
          rk.volume,
          rk.nilai_potensi_desa AS economic_value,
          rw.provinsi AS province,
          rw.kab_kota AS city,
          rw.desa_kelurahan AS village,
          rk.jumlah_sdm_terlibat AS farmers
        FROM referensi_komoditas_desa rk
        LEFT JOIN referensi_wilayah rw ON rk.kode_wilayah = rw.kode_wilayah
        WHERE rk.nilai_potensi_desa > 0
        ORDER BY rk.nilai_potensi_desa DESC
        LIMIT 25
      `);

      const villagePotentials = potentialsRes.rows.map(row => ({
        id: row.id,
        commodity_name: row.commodity_name,
        volume: parseFloat(row.volume) || 0,
        economic_value: parseFloat(row.economic_value) || 0,
        province: row.province,
        city: row.city,
        village: row.village,
        farmers: parseInt(row.farmers, 10) || 0
      }));

      const prompt = `
        Anda adalah pakar Analitik Rantai Pasok Koperasi dan Business Matching di Indonesia.
        Tugas Anda adalah menganalisis kecocokan antara permintaan pasar (Demand B2B) dan potensi komoditas desa (Supply Potential) untuk meningkatkan pemanfaatan potensi desa melalui koperasi.

        DATA DEMAND (Permintaan Pembeli):
        ${JSON.stringify(marketRequests, null, 2)}

        DATA SUPPLY (Potensi Unggulan Desa):
        ${JSON.stringify(villagePotentials, null, 2)}

        TUGAS ANDA:
        Cocokkan komoditas yang diminta pembeli dengan potensi desa yang memiliki komoditas yang sama atau sejenis (misal: "Kopi Gayo" cocok dengan permintaan "Kopi", "Singkong" cocok dengan "Tepung Tapioka/Singkong"). 
        Hasilkan analisis berupa array JSON dengan struktur berikut:
        [
          {
            "match_id": "Kode unik misal MATCH-001",
            "buyer_name": "Nama pembeli",
            "commodity_name": "Nama komoditas yang cocok",
            "quantity_demanded": 100, // jumlah yang diminta pembeli (dalam ton)
            "unit": "ton",
            "village_name": "Nama desa asal potensi",
            "city": "Kabupaten/Kota asal desa",
            "province": "Provinsi asal desa",
            "potential_volume": 250, // volume potensi desa (dalam ton)
            "economic_value": 750000000, // nilai ekonomi potensi desa (dalam rupiah)
            "match_score": 85, // Persentase kecocokan 0-100 (hitung kecocokan jenis produk, volume, dan efisiensi rantai pasok)
            "recommendation": "Rekomendasi taktis 2-3 kalimat: Koperasi setempat disarankan mengonsolidasikan kelompok tani di desa tersebut untuk memasok kebutuhan pembeli. Jelaskan cara peningkatan nilai tambah produk (misal: pengeringan jagung, standardisasi kopi)."
          }
        ]

        Ketentuan:
        - Berikan minimal 3 dan maksimal 8 rekomendasi kecocokan yang paling logis.
        - Hanya keluarkan array JSON tersebut. Jangan berikan teks pembuka, penutup, atau tanda markdown.
      `;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();
      const endIdx = textResponse.lastIndexOf(']');
      const startIdx = textResponse.indexOf('[');
      if (endIdx === -1 || startIdx === -1) {
        throw new Error('Valid JSON array markers [ and ] not found in AI response');
      }
      const jsonStr = textResponse.substring(startIdx, endIdx + 1);
      const matches = JSON.parse(jsonStr);

      return NextResponse.json({
        success: true,
        matches
      });
    }

  } catch (error: any) {
    console.error('Error generating AI business matching:', error);

    // Fallbacks per perspective
    let fallbackMatches: any[] = [];

    if (body.perspective === 'industry') {
      fallbackMatches = [
        {
          match_id: 'MATCH-IND-FB1',
          buyer_name: body.buyer_id === 'buyer-indofood' ? 'PT Indofood CBP' : 'PT Indofood CBP',
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
          buyer_name: body.buyer_id === 'buyer-indofood' ? 'PT Indofood CBP' : 'PT Indofood CBP',
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
    } else if (body.perspective === 'cooperative') {
      fallbackMatches = [
        {
          match_id: 'MATCH-COOP-FB1',
          cooperative_name: 'Koperasi Tani Mulya',
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
          cooperative_name: 'Koperasi Tani Mulya',
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

    return NextResponse.json({
      success: true,
      fallback: true,
      matches: fallbackMatches
    });
  }
}

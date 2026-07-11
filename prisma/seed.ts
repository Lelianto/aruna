import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import mockData from '../src/lib/mock/data.json';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SEED_FORCE = process.env.SEED_FORCE === 'true';

/** Canonical bulk-tradeable commodities verified against top referensi_komoditas_desa counts. */
const TRADEABLE_COMMODITY_ALLOWLIST = [
  'Padi',
  'Jagung',
  'Beras',
  'Perikanan',
  'Cabai',
  'Pisang',
  'Ubi Kayu',
  'Ubi Jalar',
  'Tomat',
  'Kacang Tanah',
  'Mangga',
  'Alpukat',
  'Bawang',
  'Bawang Merah',
  'Kacang Hijau',
  'Kentang',
  'Kakao',
  'Kopi',
  'Kelapa',
  'Kelapa Sawit',
  'Sawit',
  'Karet',
  'Ayam',
  'Sapi',
  'Kambing',
  'Kedelai',
  'Durian',
  'Gula Pasir',
  'Singkong',
  'Melon',
  'Semangka',
  'Wortel',
  'Cengkeh',
  'Pala',
  'Kopra',
  'Tembakau',
  'Cokelat',
  'Sayuran',
  'Ikan Laut',
  'Nila',
  'Lele',
  'Bandeng',
  'Udang',
  'Jagung Manis',
  'Beras Medium',
  'Beras Premium',
  'Cabai Rawit',
  'Cabe',
] as const;

/**
 * No jenis/kategori column on referensi_komoditas_desa — exclusion guard if allowlist expands.
 * Also excludes existing admin-noise patterns from the prior seed filter.
 */
const NON_COMMODITY_EXCLUSION_PATTERNS = [
  'Agen %',
  '%Kbli%',
  '%Dapatkan Aplikasi%',
  '%wisata%',
  '%agrowisata%',
  '%destinasi%',
  '%warung%',
  '%kuliner%',
  '%rumah makan%',
  '%restoran%',
  '%apotek%',
  '%apotik%',
  '%laundry%',
  '%wifi%',
  '%internet%',
  '%bengkel%',
  '%salon%',
  '%penginapan%',
  '%hotel%',
  '%homestay%',
  '%jasa %',
  '%umkm%',
  '%brilink%',
  '%bri link%',
  '%laku pandai%',
  '%elpiji%',
  '%gas lpg%',
  '%pdam%',
  '%listrik%',
  '%parkir%',
  '%ojek%',
  '%travel%',
  '%klinik%',
  '%puskesmas%',
  '%bimbingan%',
  '%perbankan%',
  '%simpan pinjam%',
  '%fotocopy%',
  '%foto copy%',
  '%digital print%',
  '%cold storage%',
  '%angkringan%',
  '%minimarket%',
  '%alfamart%',
  '%indomaret%',
  'Air',
  'Air Bersih',
  'Air Mineral',
] as const;

type MockBuyer = (typeof mockData.buyers)[number];
type MockMarketRequest = (typeof mockData.market_requests)[number];

const SHIPPING_ADDRESSES: Record<string, string> = {
  'buyer-indofood': 'Jl. Sudirman Kav. 90, Jakarta Pusat 10220',
  'buyer-kapalapi': 'Jl. Raya Darmo No. 88, Surabaya 60264',
  'buyer-mayora': 'Jl. Tomang Raya No. 21, Jakarta Barat 11440',
  'buyer-sidomuncul': 'Jl. Raya Kaligawe Km.4, Semarang 50112',
  'buyer-charoen': 'Jl. HR Rasuna Said Kav. B-7, Jakarta Selatan 12920',
  'buyer-katering': 'Jl. Asia Afrika No. 120, Bandung 40111',
  'buyer-rotigembong': 'Jl. Malioboro No. 52, Yogyakarta 55213',
};

const UNIT_PRICE_IDR: Record<string, number> = {
  ton: 12_500_000,
};

function unitPriceFor(unit: string): number {
  return UNIT_PRICE_IDR[unit] ?? 10_000_000;
}

function invoiceNumber(index: number): string {
  return `INV-2026-${String(index).padStart(4, '0')}`;
}

async function seedBuyers(): Promise<Map<string, number>> {
  const slugToId = new Map<string, number>();
  const existing = await prisma.aruna_buyers.findMany({ select: { id: true, slug: true } });

  if (existing.length > 0) {
    for (const row of existing) {
      if (row.slug) slugToId.set(row.slug, row.id);
    }
    console.log(`Buyers: ${existing.length} rows present — using existing slugs.`);
    return slugToId;
  }

  for (const buyer of mockData.buyers as MockBuyer[]) {
    const created = await prisma.aruna_buyers.create({
      data: {
        slug: buyer.id,
        company_name: buyer.company_name,
        city: buyer.city,
        industry: buyer.industry,
        buyer_type: buyer.buyer_type ?? 'industri',
        nib: 'nib' in buyer ? (buyer as MockBuyer & { nib?: string }).nib ?? null : null,
        verified: 'verified' in buyer ? Boolean((buyer as MockBuyer & { verified?: boolean }).verified) : false,
        created_at: new Date(),
      },
    });
    slugToId.set(buyer.id, created.id);
  }

  console.log(`Buyers: seeded ${slugToId.size} rows.`);
  return slugToId;
}

async function sampleCommodityNames(limit = 30): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ nama_komoditas: string }>>`
    SELECT DISTINCT nama_komoditas
    FROM referensi_komoditas_desa
    WHERE nama_komoditas = ANY(${[...TRADEABLE_COMMODITY_ALLOWLIST]})
      AND nama_komoditas IS NOT NULL
      AND TRIM(nama_komoditas) <> ''
      AND nama_komoditas NOT ILIKE ANY(${[...NON_COMMODITY_EXCLUSION_PATTERNS]})
    ORDER BY nama_komoditas
    LIMIT ${limit}
  `;

  if (rows.length === 0) {
    throw new Error(
      'No tradeable commodity names matched allowlist in referensi_komoditas_desa.nama_komoditas',
    );
  }

  return rows.map((r) => r.nama_komoditas.trim());
}

async function sampleCooperatives(limit = 20): Promise<Array<{ koperasi_ref: string; nama_koperasi: string }>> {
  const rows = await prisma.profil_koperasi.findMany({
    where: {
      nama_koperasi: { not: null },
    },
    select: {
      koperasi_ref: true,
      nama_koperasi: true,
    },
    take: limit,
    orderBy: { koperasi_ref: 'asc' },
  });

  return rows
    .filter((r): r is { koperasi_ref: string; nama_koperasi: string } => Boolean(r.nama_koperasi?.trim()))
    .map((r) => ({
      koperasi_ref: r.koperasi_ref,
      nama_koperasi: r.nama_koperasi.trim(),
    }));
}

function pickCommodityName(names: string[], index: number): string {
  if (names.length === 0) {
    throw new Error('No commodity names sampled from referensi_komoditas_desa.nama_komoditas');
  }
  return names[index % names.length];
}

function pickCooperative(
  cooperatives: Array<{ koperasi_ref: string; nama_koperasi: string }>,
  index: number,
): { koperasi_ref: string; nama_koperasi: string } {
  if (cooperatives.length === 0) {
    throw new Error('No cooperatives sampled from profil_koperasi');
  }
  return cooperatives[index % cooperatives.length];
}

const MATCH_ALLOCATION_SHARES: Array<number[]> = [
  [1],
  [0.55, 0.45],
  [0.6, 0.4],
  [0.7, 0.3],
  [1],
  [0.5, 0.5],
  [0.85, 0.15],
];

async function seedMarketRequestsAndMatches(
  buyerSlugToId: Map<string, number>,
  commodityNames: string[],
  cooperatives: Array<{ koperasi_ref: string; nama_koperasi: string }>,
) {
  const existingCount = await prisma.aruna_market_requests.count();
  if (existingCount > 0 && !SEED_FORCE) {
    console.log(`Market requests: ${existingCount} rows already present — skipped (SEED_FORCE=false).`);
    return;
  }

  if (SEED_FORCE && existingCount > 0) {
    await prisma.aruna_supply_matches.deleteMany();
    await prisma.aruna_market_requests.deleteMany();
  }

  const requestQuantityById = new Map<number, Prisma.Decimal>();
  const templates = mockData.market_requests as MockMarketRequest[];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const buyerId = buyerSlugToId.get(template.buyer_id);
    if (!buyerId) {
      throw new Error(`Buyer slug not found in aruna_buyers: ${template.buyer_id}`);
    }

    const quantity = new Prisma.Decimal(template.quantity);
    const totalPrice = quantity.mul(unitPriceFor(template.unit));

    const createdRequest = await prisma.aruna_market_requests.create({
      data: {
        buyer_id: buyerId,
        commodity_name: pickCommodityName(commodityNames, i),
        quantity,
        unit: template.unit,
        status: template.status,
        created_at: new Date(Date.now() - (templates.length - i) * 86_400_000),
        shipping_address: SHIPPING_ADDRESSES[template.buyer_id] ?? null,
        invoice_number: invoiceNumber(i + 1),
        total_price: totalPrice,
        coop_name: null,
      },
    });

    requestQuantityById.set(createdRequest.id, quantity);

    const shares = MATCH_ALLOCATION_SHARES[i % MATCH_ALLOCATION_SHARES.length];
    const matchRows: Array<{
      cooperative_id: string;
      nama_koperasi: string;
      allocated_quantity: Prisma.Decimal;
    }> = [];

    for (let m = 0; m < shares.length; m++) {
      const coop = pickCooperative(cooperatives, i + m);
      const allocated = quantity.mul(shares[m]);
      matchRows.push({
        cooperative_id: coop.koperasi_ref,
        nama_koperasi: coop.nama_koperasi,
        allocated_quantity: allocated,
      });
    }

    for (const match of matchRows) {
      await prisma.aruna_supply_matches.create({
        data: {
          request_id: createdRequest.id,
          cooperative_id: match.cooperative_id,
          allocated_quantity: match.allocated_quantity,
          matched_at: new Date(),
        },
      });
    }

    const primary = [...matchRows].sort((a, b) =>
      b.allocated_quantity.comparedTo(a.allocated_quantity),
    )[0];

    await prisma.aruna_market_requests.update({
      where: { id: createdRequest.id },
      data: { coop_name: primary.nama_koperasi },
    });
  }

  console.log(`Market requests: seeded ${templates.length} rows with supply matches.`);
}

async function printSamples() {
  const requests = await prisma.aruna_market_requests.findMany({
    take: 5,
    orderBy: { id: 'asc' },
    include: { buyer: { select: { slug: true, company_name: true } } },
  });

  console.log('\nSample market_requests:');
  for (const req of requests) {
    console.log(
      `  id=${req.id} buyer=${req.buyer.slug} commodity="${req.commodity_name}" qty=${req.quantity} ${req.unit} coop_name="${req.coop_name}"`,
    );
  }

  const matches = await prisma.aruna_supply_matches.findMany({
    take: 5,
    orderBy: { id: 'asc' },
  });

  console.log('\nSample supply_matches:');
  for (const match of matches) {
    console.log(
      `  id=${match.id} request_id=${match.request_id} cooperative_id=${match.cooperative_id} allocated=${match.allocated_quantity}`,
    );
  }

  const [buyerCount, requestCount, matchCount] = await Promise.all([
    prisma.aruna_buyers.count(),
    prisma.aruna_market_requests.count(),
    prisma.aruna_supply_matches.count(),
  ]);

  console.log('\nFinal row counts:');
  console.log(`  aruna_buyers: ${buyerCount}`);
  console.log(`  aruna_market_requests: ${requestCount}`);
  console.log(`  aruna_supply_matches: ${matchCount}`);
}

async function main() {
  console.log('ARUNA Prisma seed — market requests & supply matches');
  console.log(`SEED_FORCE=${SEED_FORCE}`);

  const buyerSlugToId = await seedBuyers();
  const commodityNames = await sampleCommodityNames(30);
  const cooperatives = await sampleCooperatives(20);

  console.log(`Sampled ${commodityNames.length} tradeable commodity names (allowlist on referensi_komoditas_desa.nama_komoditas).`);
  console.log(`Sampled ${cooperatives.length} cooperatives (profil_koperasi.koperasi_ref / nama_koperasi).`);

  await seedMarketRequestsAndMatches(buyerSlugToId, commodityNames, cooperatives);
  await printSamples();
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

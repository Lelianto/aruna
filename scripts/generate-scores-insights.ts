/**
 * One-off: persist real cooperative scores + insights for every cooperative
 * returned by loadAllCooperativesFromPg (same set as dashboard/potensi-desa/komoditas).
 *
 * Usage:
 *   npx tsx scripts/generate-scores-insights.ts
 *   SEED_FORCE=true npx tsx scripts/generate-scores-insights.ts
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { Commodity, Cooperative, CooperativeScoreInput, Insight } from '../src/types';
import { calculateCooperativeScore } from '../src/lib/services/score-engine';
import { generateCooperativeInsights } from '../src/lib/services/insight-engine';

const SEED_FORCE = process.env.SEED_FORCE === 'true';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function mapCooperativeRow(rawCoop: {
  id: string;
  name: string;
  province: string | null;
  city: string | null;
  koordinat_dibulatkan: string | null;
  member_count: string | number;
  active_members: string | number;
  annual_revenue: string | number;
}): Cooperative {
  const [latStr, lngStr] = (rawCoop.koordinat_dibulatkan || '').split(',');
  return {
    id: rawCoop.id,
    name: rawCoop.name,
    province: rawCoop.province || 'Jawa Tengah',
    city: rawCoop.city || 'Boyolali',
    latitude: latStr ? parseFloat(latStr.trim()) : -7.53,
    longitude: lngStr ? parseFloat(lngStr.trim()) : 110.59,
    member_count: parseInt(String(rawCoop.member_count), 10) || 0,
    active_members: parseInt(String(rawCoop.active_members), 10) || 0,
    annual_revenue: parseFloat(String(rawCoop.annual_revenue)) || 0,
    simkopdes_id: `KDKMP-${rawCoop.id.substring(4, 9)}`,
    nib_status: 'unsubmitted',
    sk_status: 'unsubmitted',
    cash_reserve: 50000000,
  };
}

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

function mapCommodityRow(row: {
  id: string;
  cooperative_id: string;
  name: string;
  unit: string | null;
  available_stock: string | number;
}): Commodity {
  const stock = parseFloat(String(row.available_stock)) || 0;
  return {
    id: row.id,
    cooperative_id: row.cooperative_id,
    name: row.name,
    sku: row.id || '',
    category: getProductCategory(row.name),
    available_stock: stock,
    monthly_capacity: stock > 0 ? stock * 2 : 100,
    unit: row.unit || 'Kg',
    harvest_period: 'Sepanjang Tahun',
  };
}

async function loadAllCooperatives(): Promise<Cooperative[]> {
  const listRes = await pool.query(`
    SELECT
      pk.koperasi_ref AS id,
      pk.nama_koperasi AS name,
      rw.provinsi AS province,
      rw.kab_kota AS city,
      pk.koordinat_dibulatkan,
      COALESCE(am.member_count, 0) AS member_count,
      COALESCE(am.active_members, 0) AS active_members,
      COALESCE(tp.annual_revenue, 0) AS annual_revenue
    FROM profil_koperasi pk
    LEFT JOIN referensi_koperasi_wilayah rkw ON pk.koperasi_ref = rkw.koperasi_ref
    LEFT JOIN referensi_wilayah rw ON rkw.kode_wilayah = rw.kode_wilayah
    LEFT JOIN (
      SELECT koperasi_ref,
             count(*) AS member_count,
             count(*) FILTER (WHERE status_keanggotaan = 'Approved') AS active_members
      FROM anggota_koperasi
      GROUP BY koperasi_ref
    ) am ON am.koperasi_ref = pk.koperasi_ref
    LEFT JOIN (
      SELECT koperasi_ref, COALESCE(SUM(total_pembayaran), 0) AS annual_revenue
      FROM transaksi_penjualan
      GROUP BY koperasi_ref
    ) tp ON tp.koperasi_ref = pk.koperasi_ref
    ORDER BY pk.nama_koperasi ASC
  `);

  const cooperatives = listRes.rows.map(mapCooperativeRow);

  const docsRes = await pool.query(`
    SELECT dk.koperasi_ref, dk.nomor, rdk.nama_dokumen
    FROM dokumen_koperasi dk
    LEFT JOIN referensi_dokumen_koperasi rdk ON dk.jenis_dokumen_ref = rdk.jenis_dokumen_ref
  `);

  const docsByCoop = new Map<string, Array<{ nomor: string; nama_dokumen: string | null }>>();
  for (const doc of docsRes.rows) {
    const list = docsByCoop.get(doc.koperasi_ref);
    const entry = { nomor: doc.nomor, nama_dokumen: doc.nama_dokumen };
    if (list) list.push(entry);
    else docsByCoop.set(doc.koperasi_ref, [entry]);
  }

  for (const coop of cooperatives) {
    const docs = docsByCoop.get(coop.id) || [];
    for (const doc of docs) {
      const docName = (doc.nama_dokumen || '').toLowerCase();
      if (docName.includes('nib') || docName.includes('induk')) {
        coop.nib = doc.nomor;
        coop.nib_status = 'verified';
      } else if (docName.includes('sk') || docName.includes('keputusan') || docName.includes('badan hukum')) {
        coop.sk_number = doc.nomor;
        coop.sk_status = 'verified';
      }
    }
  }

  return cooperatives;
}

async function loadCooperativeScore(cooperativeId: string) {
  return prisma.aruna_cooperative_scores.findUnique({
    where: { cooperative_id: cooperativeId },
  });
}

async function upsertCooperativeScore(cooperativeId: string, scoreData: CooperativeScoreInput) {
  const updatedAt = scoreData.updated_at ? new Date(scoreData.updated_at) : new Date();
  await prisma.aruna_cooperative_scores.upsert({
    where: { cooperative_id: cooperativeId },
    create: {
      cooperative_id: cooperativeId,
      health_score: scoreData.health_score,
      growth_score: scoreData.growth_score,
      supply_score: scoreData.supply_score,
      final_score: scoreData.final_score,
      grade: scoreData.grade,
      updated_at: updatedAt,
    },
    update: {
      health_score: scoreData.health_score,
      growth_score: scoreData.growth_score,
      supply_score: scoreData.supply_score,
      final_score: scoreData.final_score,
      grade: scoreData.grade,
      updated_at: updatedAt,
    },
  });
}

async function persistInsights(cooperativeId: string, generated: Insight[]) {
  await prisma.$transaction(async (tx) => {
    await tx.aruna_insights.deleteMany({ where: { cooperative_id: cooperativeId } });
    if (generated.length === 0) return;
    await Promise.all(
      generated.map((insight) =>
        tx.aruna_insights.create({
          data: {
            cooperative_id: insight.cooperative_id,
            title: insight.title,
            description: insight.description,
            recommendation: insight.recommendation,
            severity: insight.severity,
            created_at: insight.created_at ? new Date(insight.created_at) : new Date(),
          },
        }),
      ),
    );
  });
}

async function loadAllCommodities(): Promise<Commodity[]> {
  const result = await pool.query(`
    SELECT
      pk.produk_sample_id AS id,
      pk.koperasi_ref AS cooperative_id,
      pk.nama_produk AS name,
      pk.unit,
      COALESCE(ip.stok, 0) AS available_stock
    FROM produk_koperasi pk
    LEFT JOIN inventaris_produk ip ON pk.produk_sample_id = ip.produk_sample_id AND pk.koperasi_ref = ip.koperasi_ref
    ORDER BY COALESCE(ip.stok, 0) DESC, pk.nama_produk ASC
  `);
  return result.rows.map(mapCommodityRow);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set (expected in .env.local)');
  }

  console.log(`Loading cooperatives + commodities (SEED_FORCE=${SEED_FORCE})...`);

  const [cooperatives, commodities] = await Promise.all([
    loadAllCooperatives(),
    loadAllCommodities(),
  ]);

  const commoditiesByCoop = new Map<string, Commodity[]>();
  for (const com of commodities) {
    const list = commoditiesByCoop.get(com.cooperative_id);
    if (list) list.push(com);
    else commoditiesByCoop.set(com.cooperative_id, [com]);
  }

  const maxRev = cooperatives.length > 0
    ? Math.max(...cooperatives.map((c) => c.annual_revenue || 0), 1)
    : 1;

  console.log(`Cooperative set: ${cooperatives.length} rows (all profil_koperasi, no LIMIT)`);
  console.log(`Commodities: ${commodities.length} rows across ${commoditiesByCoop.size} cooperatives`);
  console.log(`Max annual revenue baseline: Rp ${maxRev.toLocaleString('id-ID')}`);

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;
  const failures: Array<{ id: string; name: string; reason: string }> = [];
  const samples: Array<{
    id: string;
    name: string;
    score: ReturnType<typeof calculateCooperativeScore>;
    insights: ReturnType<typeof generateCooperativeInsights>;
  }> = [];

  for (const coop of cooperatives) {
    try {
      if (!SEED_FORCE) {
        const existing = await loadCooperativeScore(coop.id);
        if (existing) {
          skipped += 1;
          continue;
        }
      }

      const coopCommodities = commoditiesByCoop.get(coop.id) || [];
      const score = calculateCooperativeScore(coop, coopCommodities, maxRev);

      await upsertCooperativeScore(coop.id, {
        health_score: score.health_score,
        growth_score: score.growth_score,
        supply_score: score.supply_score,
        final_score: score.final_score,
        grade: score.grade,
        updated_at: score.updated_at,
      });

      const insights = generateCooperativeInsights(coop, coopCommodities, score);
      await persistInsights(coop.id, insights);

      succeeded += 1;
      if (samples.length < 3) {
        samples.push({ id: coop.id, name: coop.name, score, insights });
      }
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ id: coop.id, name: coop.name, reason });
      console.error(`FAIL ${coop.id} (${coop.name}): ${reason}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total cooperatives: ${cooperatives.length}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Skipped (existing score): ${skipped}`);
  console.log(`Failed: ${failed}`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures.slice(0, 20)) {
      console.log(`  ${f.id} | ${f.name} | ${f.reason}`);
    }
    if (failures.length > 20) {
      console.log(`  ... and ${failures.length - 20} more`);
    }
  }

  if (samples.length > 0) {
    console.log('\n--- Sample outputs ---');
    for (const s of samples) {
      console.log(`\n${s.name} (${s.id})`);
      console.log(`  Score: final=${s.score.final_score} grade=${s.score.grade} health=${s.score.health_score} growth=${s.score.growth_score} supply=${s.score.supply_score}`);
      console.log(`  Insights (${s.insights.length}):`);
      for (const ins of s.insights.slice(0, 3)) {
        console.log(`    [${ins.severity}] ${ins.title}`);
      }
    }
  }

  const scoreCount = await prisma.aruna_cooperative_scores.count();
  const insightCount = await prisma.aruna_insights.count();
  console.log(`\nDB totals: aruna_cooperative_scores=${scoreCount}, aruna_insights=${insightCount}`);
}

main()
  .catch((err) => {
    console.error('Script failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

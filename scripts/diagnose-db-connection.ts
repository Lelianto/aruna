/**
 * One-off diagnostic — DATABASE_URL + plain profil_koperasi.count vs script SQL.
 * Usage: npx tsx scripts/diagnose-db-connection.ts
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function redactDatabaseUrl(url: string | undefined): string {
  if (!url) return '(unset)';
  try {
    const u = new URL(url);
    const user = u.username || '(no-user)';
    const host = u.hostname;
    const port = u.port || '(default)';
    const db = u.pathname.replace(/^\//, '') || '(no-db)';
    return `postgresql://${user}:***@${host}:${port}/${db}`;
  } catch {
    return url.replace(/:([^:@/]+)@/, ':***@');
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCRIPT_COOP_SQL = `
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
`;

async function main() {
  console.log('=== Step 1: DATABASE_URL (password redacted) ===');
  console.log(redactDatabaseUrl(process.env.DATABASE_URL));

  console.log('\n=== Step 2: Plain Prisma count (no filters) ===');
  let prismaCount: number | string;
  try {
    prismaCount = await prisma.profil_koperasi.count();
    console.log(`prisma.profil_koperasi.count() = ${prismaCount}`);
  } catch (e) {
    prismaCount = `ERROR: ${e instanceof Error ? e.message : e}`;
    console.log(prismaCount);
  }

  console.log('\n=== Step 3: Connection metadata (pg) ===');
  try {
    const meta = await pool.query(`
      SELECT
        current_database() AS database,
        current_user AS user,
        inet_server_addr()::text AS server_addr,
        inet_server_port() AS server_port
    `);
    console.log(meta.rows[0]);
  } catch (e) {
    console.log(`meta query failed: ${e instanceof Error ? e.message : e}`);
  }

  console.log('\n=== Step 4: Raw SQL counts ===');
  try {
    const plain = await pool.query('SELECT COUNT(*)::int AS c FROM profil_koperasi');
    console.log(`SELECT COUNT(*) FROM profil_koperasi = ${plain.rows[0].c}`);
  } catch (e) {
    console.log(`plain count failed: ${e instanceof Error ? e.message : e}`);
  }

  try {
    const scriptRows = await pool.query(SCRIPT_COOP_SQL);
    console.log(`Script cooperative SQL row count = ${scriptRows.rowCount}`);
  } catch (e) {
    console.log(`script SQL failed: ${e instanceof Error ? e.message : e}`);
  }

  console.log('\n=== Step 5: Table existence in public schema ===');
  try {
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('profil_koperasi', 'produk_koperasi', 'aruna_cooperative_scores')
      ORDER BY tablename
    `);
    console.log('present:', tables.rows.map((r) => r.tablename).join(', ') || '(none)');
  } catch (e) {
    console.log(`table list failed: ${e instanceof Error ? e.message : e}`);
  }

  console.log('\n=== Step 6: Commodity query (separate from cooperatives) ===');
  try {
    const comm = await pool.query(`
      SELECT COUNT(*)::int AS c FROM produk_koperasi pk
      LEFT JOIN inventaris_produk ip ON pk.produk_sample_id = ip.produk_sample_id AND pk.koperasi_ref = ip.koperasi_ref
    `);
    console.log(`produk_koperasi (+ inventaris join) rows = ${comm.rows[0].c}`);
  } catch (e) {
    console.log(`commodity count failed: ${e instanceof Error ? e.message : e}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

/**
 * ONE-TIME USE — already run, competition DB connection no longer available/needed,
 * kept for reference only.
 *
 * One-off: copy 27 SIMKOPDES tables from competition DB (read-only) to local DB.
 * Usage: node scripts/archive/copy-simkopdes-data.js
 *
 * Requires DATABASE_URL_COMPETITION and DATABASE_URL in the environment
 * (loaded from .env.local / .env via dotenv).
 */
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SIMKOPDES_TABLES = [
  'referensi_wilayah',
  'referensi_profil_desa',
  'referensi_komoditas_desa',
  'referensi_dokumen_koperasi',
  'referensi_gerai_koperasi',
  'referensi_koperasi_wilayah',
  'profil_koperasi',
  'akun_bank_koperasi',
  'anggota_koperasi',
  'aset_koperasi',
  'dokumen_koperasi',
  'gerai_koperasi',
  'karyawan_koperasi',
  'kbli_koperasi',
  'modal_koperasi',
  'pengajuan_domain',
  'pengajuan_kemitraan',
  'pengajuan_pembiayaan',
  'pengajuan_rekening_bank',
  'pengurus_koperasi',
  'produk_koperasi',
  'rat_koperasi',
  'inventaris_produk',
  'barang_masuk_produk',
  'transaksi_penjualan',
  'barang_keluar_produk',
  'simpanan_anggota',
];

/** Examples from ARUNA_CONTEXT / prior db pull (partial — verify against live source) */
const DOCUMENTED_BASELINES = {
  akun_bank_koperasi: 903,
  anggota_koperasi: 74269,
};

function needsSsl(connectionString) {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get('sslmode');
    if (sslmode === 'disable' || sslmode === 'allow') return false;
    const host = url.hostname;
    return host !== 'localhost' && host !== '127.0.0.1';
  } catch {
    return false;
  }
}

function poolFromUrl(connectionString, { readOnly = false } = {}) {
  return new Pool({
    connectionString,
    ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: readOnly ? 2 : 5,
  });
}

async function getColumns(pool, table) {
  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

async function getPrimaryKeyColumns(pool, table) {
  const { rows } = await pool.query(
    `SELECT a.attname AS column_name
     FROM pg_index i
     JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
     WHERE i.indrelid = $1::regclass AND i.indisprimary
     ORDER BY array_position(i.indkey, a.attnum)`,
    [table],
  );
  return rows.map((r) => r.column_name);
}

async function copyTable(source, target, table) {
  const columns = await getColumns(source, table);
  if (columns.length === 0) {
    throw new Error(`No columns found for table ${table}`);
  }

  const pkCols = await getPrimaryKeyColumns(source, table);
  const orderBy =
    pkCols.length > 0
      ? pkCols.map((c) => `"${c}"`).join(', ')
      : `"${columns[0]}"`;

  const quotedCols = columns.map((c) => `"${c}"`).join(', ');

  const sourceCountRes = await source.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
  const sourceCount = sourceCountRes.rows[0].count;

  if (sourceCount === 0) {
    return { table, sourceCount, copied: 0 };
  }

  const batchSize = 2000;
  const insertChunk = 200;
  let offset = 0;
  let copied = 0;

  while (offset < sourceCount) {
    const { rows } = await source.query(
      `SELECT ${quotedCols} FROM "${table}" ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [batchSize, offset],
    );

    for (let i = 0; i < rows.length; i += insertChunk) {
      const slice = rows.slice(i, i + insertChunk);
      const values = [];
      const params = [];
      let paramIdx = 1;
      for (const row of slice) {
        values.push(`(${columns.map(() => `$${paramIdx++}`).join(', ')})`);
        for (const col of columns) {
          params.push(row[col]);
        }
      }
      await target.query(
        `INSERT INTO "${table}" (${quotedCols}) VALUES ${values.join(', ')}`,
        params,
      );
      copied += slice.length;
    }

    offset += batchSize;
    process.stdout.write(`  ${table}: ${copied}/${sourceCount}\r`);
  }

  if (copied > 0) process.stdout.write('\n');
  return { table, sourceCount, copied };
}

async function main() {
  const sourceUrl = process.env.DATABASE_URL_COMPETITION;
  const targetUrl = process.env.DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    throw new Error(
      'DATABASE_URL_COMPETITION and DATABASE_URL must be set (e.g. in .env.local)',
    );
  }

  const source = poolFromUrl(sourceUrl, { readOnly: true });
  const target = poolFromUrl(targetUrl);

  console.log('Source (read-only): competition shared Postgres');
  console.log('Target: local Postgres\n');

  console.log('=== Competition DB baseline counts ===');
  const baselineFromSource = {};
  for (const table of SIMKOPDES_TABLES) {
    const { rows } = await source.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    baselineFromSource[table] = rows[0].count;
    const documented = DOCUMENTED_BASELINES[table];
    const docNote =
      documented !== undefined
        ? ` (documented: ${documented}${documented === rows[0].count ? ' ✓' : ' ≠'})`
        : '';
    console.log(`  ${table}: ${rows[0].count}${docNote}`);
  }

  console.log('\n=== Truncating local SIMKOPDES tables ===');
  await target.query('SET session_replication_role = replica');
  for (const table of [...SIMKOPDES_TABLES].reverse()) {
    await target.query(`TRUNCATE TABLE "${table}" CASCADE`);
  }

  console.log('\n=== Copying data ===');

  const results = [];
  try {
    for (const table of SIMKOPDES_TABLES) {
      console.log(`Copying ${table}...`);
      const result = await copyTable(source, target, table);
      results.push(result);
    }
  } finally {
    await target.query('SET session_replication_role = DEFAULT');
  }

  console.log('\n=== Local DB row counts vs baseline ===');
  let allMatch = true;
  for (const table of SIMKOPDES_TABLES) {
    const { rows } = await target.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    const localCount = rows[0].count;
    const sourceCount = baselineFromSource[table];
    const documented = DOCUMENTED_BASELINES[table];
    const matchSource = localCount === sourceCount ? '✓' : '✗';
    const matchDoc =
      documented !== undefined
        ? localCount === documented
          ? 'doc✓'
          : `doc✗(${documented})`
        : '';
    if (localCount !== sourceCount) allMatch = false;
    console.log(
      `  ${table}: copied=${localCount} source=${sourceCount} ${matchSource} ${matchDoc}`,
    );
  }

  console.log(allMatch ? '\nAll tables match source counts.' : '\nSome tables differ from source.');
  await source.end();
  await target.end();
}

main().catch((err) => {
  console.error('Copy failed:', err);
  process.exit(1);
});

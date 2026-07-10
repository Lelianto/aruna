import { defineConfig, env } from 'prisma/config';

const SIMKOPDES_TABLES = [
  'akun_bank_koperasi',
  'anggota_koperasi',
  'aset_koperasi',
  'barang_keluar_produk',
  'barang_masuk_produk',
  'dokumen_koperasi',
  'gerai_koperasi',
  'inventaris_produk',
  'karyawan_koperasi',
  'kbli_koperasi',
  'modal_koperasi',
  'pengajuan_domain',
  'pengajuan_kemitraan',
  'pengajuan_pembiayaan',
  'pengajuan_rekening_bank',
  'pengurus_koperasi',
  'produk_koperasi',
  'profil_koperasi',
  'rat_koperasi',
  'referensi_dokumen_koperasi',
  'referensi_gerai_koperasi',
  'referensi_komoditas_desa',
  'referensi_koperasi_wilayah',
  'referensi_profil_desa',
  'referensi_wilayah',
  'simpanan_anggota',
  'transaksi_penjualan',
] as const;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Competition shared DB only — externalTables keeps SIMKOPDES tables read-only
  // during db push. Not needed for local Postgres (all tables managed by migrate).
  // experimental: {
  //   externalTables: true,
  // },
  datasource: {
    url: env('DATABASE_URL'),
  },
  // tables: {
  //   external: [...SIMKOPDES_TABLES],
  // },
});

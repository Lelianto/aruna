import 'server-only';

import { Cooperative } from '@/types';
import { query } from '@/lib/db';
import { cached } from '@/lib/cache';

const COOP_TTL_MS = 5 * 60 * 1000;

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
    annual_revenue: parseFloat(String(rawCoop.annual_revenue)) || 0.0,
    simkopdes_id: `KDKMP-${rawCoop.id.substring(4, 9)}`,
    nib_status: 'unsubmitted',
    sk_status: 'unsubmitted',
    cash_reserve: 50000000,
  };
}

async function attachDocuments(cooperative: Cooperative, id: string): Promise<Cooperative> {
  const docsRes = await query(`
    SELECT dk.nomor, dk.unggahan_dokumen, rdk.nama_dokumen
    FROM dokumen_koperasi dk
    LEFT JOIN referensi_dokumen_koperasi rdk ON dk.jenis_dokumen_ref = rdk.jenis_dokumen_ref
    WHERE dk.koperasi_ref = $1
  `, [id]);

  docsRes.rows.forEach((doc) => {
    const docName = (doc.nama_dokumen || '').toLowerCase();
    if (docName.includes('nib') || docName.includes('induk')) {
      cooperative.nib = doc.nomor;
      cooperative.nib_status = 'verified';
    } else if (docName.includes('sk') || docName.includes('keputusan') || docName.includes('badan hukum')) {
      cooperative.sk_number = doc.nomor;
      cooperative.sk_status = 'verified';
    }
  });

  return cooperative;
}

export async function loadAllCooperativesFromPg(): Promise<Cooperative[]> {
  return cached('cooperatives:all', COOP_TTL_MS, async () => {
    const listRes = await query(`
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

    return listRes.rows.map(mapCooperativeRow);
  });
}

export async function loadCooperativeByIdFromPg(id: string): Promise<Cooperative | null> {
  const coopRes = await query(`
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
    WHERE pk.koperasi_ref = $1
  `, [id]);

  if (coopRes.rowCount === 0) return null;

  const cooperative = mapCooperativeRow(coopRes.rows[0]);
  return attachDocuments(cooperative, id);
}

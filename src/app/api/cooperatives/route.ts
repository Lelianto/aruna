import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      // 1. Fetch detailed cooperative by ID
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

      if (coopRes.rowCount === 0) {
        return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
      }

      const rawCoop = coopRes.rows[0];
      const [latStr, lngStr] = (rawCoop.koordinat_dibulatkan || '').split(',');
      const cooperative = {
        id: rawCoop.id,
        name: rawCoop.name,
        province: rawCoop.province || 'Jawa Tengah',
        city: rawCoop.city || 'Boyolali',
        latitude: latStr ? parseFloat(latStr.trim()) : -7.53,
        longitude: lngStr ? parseFloat(lngStr.trim()) : 110.59,
        member_count: parseInt(rawCoop.member_count, 10) || 0,
        active_members: parseInt(rawCoop.active_members, 10) || 0,
        annual_revenue: parseFloat(rawCoop.annual_revenue) || 0.0,
        simkopdes_id: `KDKMP-${id.substring(4, 9)}`,
        nib: null,
        nib_status: 'unsubmitted',
        sk_number: null,
        sk_status: 'unsubmitted',
        cash_reserve: 50000000
      };

      // 2. Fetch NIB and SK documents from dokumen_koperasi
      const docsRes = await query(`
        SELECT dk.nomor, dk.unggahan_dokumen, rdk.nama_dokumen
        FROM dokumen_koperasi dk
        LEFT JOIN referensi_dokumen_koperasi rdk ON dk.jenis_dokumen_ref = rdk.jenis_dokumen_ref
        WHERE dk.koperasi_ref = $1
      `, [id]);

      docsRes.rows.forEach(doc => {
        const docName = (doc.nama_dokumen || '').toLowerCase();
        if (docName.includes('nib') || docName.includes('induk')) {
          cooperative.nib = doc.nomor;
          cooperative.nib_status = 'verified';
        } else if (docName.includes('sk') || docName.includes('keputusan') || docName.includes('badan hukum')) {
          cooperative.sk_number = doc.nomor;
          cooperative.sk_status = 'verified';
        }
      });

      return NextResponse.json(cooperative);
    } else {
      // Fetch all cooperatives
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

      return NextResponse.json(list);
    }
  } catch (error: any) {
    console.error('Error fetching cooperatives from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch cooperatives: ' + error.message }, { status: 500 });
  }
}

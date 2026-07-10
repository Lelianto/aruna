import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cached } from '@/lib/cache';

// Cooperative reference data (profiles, member counts, revenue) changes rarely.
const COOP_TTL_MS = 5 * 60 * 1000;

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
      // Fetch all cooperatives (cached, single-flight).
      // Member counts and revenue are pre-aggregated ONCE per child table (via
      // grouped subqueries joined on koperasi_ref) instead of running correlated
      // subqueries per row. The old per-row version fired ~3 child-table scans
      // for each of the 1000+ cooperatives, taking ~25s; this runs each child
      // aggregation a single time.
      const list = await cached('cooperatives:all', COOP_TTL_MS, async () => {
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

        return listRes.rows.map(rawCoop => {
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
      });

      return NextResponse.json(list);
    }
  } catch (error: any) {
    console.error('Error fetching cooperatives from PostgreSQL:', error);
    return NextResponse.json({ error: 'Failed to fetch cooperatives: ' + error.message }, { status: 500 });
  }
}

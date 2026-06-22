import { Cooperative, Commodity, CooperativeScore, Insight } from '@/types';

export function generateCooperativeInsights(
  cooperative: Cooperative,
  commodities: Commodity[],
  score: CooperativeScore
): Insight[] {
  const insights: Insight[] = [];
  const coopCommodities = commodities.filter(c => c.cooperative_id === cooperative.id);

  let idCounter = 1;
  const addInsight = (
    title: string,
    description: string,
    recommendation: string,
    severity: 'Info' | 'Peringatan' | 'Kritis'
  ) => {
    insights.push({
      id: `insight-${cooperative.id}-${idCounter++}`,
      cooperative_id: cooperative.id,
      title,
      description,
      recommendation,
      severity,
      created_at: new Date().toISOString()
    });
  };

  // Rule 1: Low Member Engagement
  const memberRatio = cooperative.member_count > 0 ? cooperative.active_members / cooperative.member_count : 0;
  if (memberRatio < 0.6) {
    addInsight(
      'Partisipasi Anggota Rendah',
      `Tingkat partisipasi anggota aktif hanya ${Math.round(memberRatio * 100)}%, yang berada di bawah ambang batas minimum keaktifan (60%).`,
      'Selenggarakan program pelatihan gotong royong, gathering rutin, dan transparansi bagi hasil untuk meningkatkan keterlibatan anggota.',
      'Peringatan'
    );
  }

  // Rule 2: High Capacity Utilization
  const hasHighUtilization = coopCommodities.some(c => c.monthly_capacity > 0 && (c.available_stock / c.monthly_capacity) > 0.8);
  if (hasHighUtilization) {
    addInsight(
      'Kapasitas Produksi Hampir Penuh',
      'Ketersediaan stok atau pemanfaatan kapasitas produksi melebihi 80% pada salah satu komoditas utama.',
      'Pertimbangkan ekspansi lahan produksi, penambahan alat/mesin pasca-panen, atau membuka pendaftaran anggota baru untuk meningkatkan kapasitas pasokan.',
      'Info'
    );
  }

  // Rule 3: Critical Score Alert
  if (score.final_score < 60) {
    addInsight(
      'Evaluasi Kemitraan Kritis',
      `Skor kesiapan kemitraan nasional ARUNA berada di tingkat rendah yaitu ${score.final_score}/100.`,
      'Koperasi memerlukan pembinaan intensif dari Kementerian Koperasi dan UKM serta pendampingan operasional terstruktur sebelum bermitra dengan industri nasional.',
      'Kritis'
    );
  }

  // Rule 4: Strong Financial Health
  if (cooperative.annual_revenue > 1500000000) {
    addInsight(
      'Kesehatan Keuangan Unggul',
      `Pendapatan tahunan mencapai Rp ${(cooperative.annual_revenue / 1000000000).toFixed(2)} Miliar, menunjukkan performa finansial yang stabil dan kuat.`,
      'Inovasikan operasional dengan investasi pada teknologi digitalisasi logistik, IoT pertanian, dan sertifikasi standar nasional/internasional.',
      'Info'
    );
  }

  // Rule 5: Underutilized Capacity
  const hasLowUtilization = coopCommodities.some(c => c.monthly_capacity > 0 && (c.available_stock / c.monthly_capacity) < 0.3);
  if (hasLowUtilization) {
    addInsight(
      'Ketersediaan Stok Rendah',
      'Tingkat ketersediaan stok aktual berada di bawah 30% dari kapasitas bulanan maksimum.',
      'Optimalkan rantai pasok pupuk/pakan, perbaiki sistem irigasi, dan lakukan pendampingan teknis panen untuk mencegah kehilangan hasil pasca-panen.',
      'Peringatan'
    );
  }

  // Rule 6: Large-scale cooperative potential
  if (cooperative.member_count >= 500) {
    addInsight(
      'Koperasi Skala Besar Nasional',
      `Memiliki total anggota sebanyak ${cooperative.member_count} orang, menjadikannya salah satu kekuatan ekonomi gotong royong utama di wilayahnya.`,
      'Manfaatkan daya tawar kolektif untuk melakukan kontrak pembelian bahan baku (pupuk/pakan/alat) secara massal agar menekan biaya produksi.',
      'Info'
    );
  }

  // Rule 7: Single Commodity Risk
  if (coopCommodities.length === 1) {
    addInsight(
      'Risiko Komoditas Tunggal',
      `Hanya memproduksi satu komoditas utama (${coopCommodities[0].name}). Hal ini memicu kerentanan tinggi terhadap fluktuasi harga pasar atau gagal panen musiman.`,
      'Lakukan diversifikasi usaha dengan mengembangkan komoditas turunan atau produk sampingan (value-added products) untuk memitigasi risiko finansial.',
      'Peringatan'
    );
  }

  // Rule 8: Excellent supply stability
  if (score.final_score >= 85) {
    addInsight(
      'Kemitraan Prioritas Utama (Grade A)',
      `Mencapai skor kesiapan kemitraan unggul (${score.final_score}/100) dengan tata kelola anggota dan keuangan yang sangat prima.`,
      'Koperasi diprioritaskan untuk dihubungkan langsung dengan offtaker industri nasional skala besar (PT Indofood, PT Mayora, dll.) melalui Gotong Royong Supply Engine.',
      'Info'
    );
  }

  // Rule 9: Low Revenue Performance
  if (cooperative.annual_revenue < 400000000) {
    addInsight(
      'Skala Pendapatan Mikro',
      `Pendapatan tahunan masih di bawah Rp 400 Juta, membatasi kemampuan investasi modal mandiri.`,
      'Ajukan program KUR (Kredit Usaha Rakyat) Syariah atau hubungkan dengan program dana bergulir LPDB untuk modal kerja awal ekspansi komoditas.',
      'Peringatan'
    );
  }

  // Rule 10: High Stock Surplus
  const hasHighSurplus = coopCommodities.some(c => c.available_stock >= 50);
  if (hasHighSurplus) {
    addInsight(
      'Surplus Pasokan Terdeteksi',
      'Koperasi memiliki surplus stok komoditas di atas 50 ton yang siap didistribusikan.',
      'Segera hubungkan dengan pasar digital nasional ARUNA untuk mempercepat penjualan dan menghindari penurunan kualitas komoditas akibat penyimpanan terlalu lama.',
      'Info'
    );
  }

  return insights;
}

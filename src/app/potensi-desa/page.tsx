import React from 'react';
import PotensiDesaClient from '@/components/potensi/PotensiDesaClient';
import { query } from '@/lib/db';
import { cooperativeRepositoryServer } from '@/lib/repositories/cooperative.repository.server';
import { commodityRepositoryServer } from '@/lib/repositories/commodity.repository.server';
import { CooperativeWithCommodities } from '@/types';

export const revalidate = 0; // Refresh data on demand

export default async function PotensiDesaPage() {
  let stats = {
    total_economic_value: 0,
    total_volume: 0,
    total_farmers: 0,
    hotspot_count: 0
  };
  let potentials: any[] = [];

  // Data for the "Sebaran Koperasi" map tab (merged from the former /peta page)
  let detailedCooperatives: CooperativeWithCommodities[] = [];
  let provinces: string[] = [];
  let commodityNames: string[] = [];
  try {
    const [coops, comNames] = await Promise.all([
      cooperativeRepositoryServer.getAllWithDetails(),
      commodityRepositoryServer.getUniqueNames()
    ]);
    detailedCooperatives = coops;
    commodityNames = comNames;
    provinces = Array.from(new Set(coops.map((c) => c.province))).sort();
  } catch (error) {
    console.error('Error loading cooperatives for Sebaran Koperasi tab:', error);
  }

  try {
    // 1. Fetch city coordinates lookup
    const coordRes = await query(`
      SELECT DISTINCT rw.kab_kota, pk.koordinat_dibulatkan
      FROM profil_koperasi pk
      LEFT JOIN referensi_koperasi_wilayah rkw ON pk.koperasi_ref = rkw.koperasi_ref
      LEFT JOIN referensi_wilayah rw ON rkw.kode_wilayah = rw.kode_wilayah
      WHERE pk.koordinat_dibulatkan IS NOT NULL AND rw.kab_kota IS NOT NULL
    `);

    const cityCoordMap: Record<string, [number, number]> = {};
    coordRes.rows.forEach(row => {
      const [latStr, lngStr] = row.koordinat_dibulatkan.split(',');
      if (latStr && lngStr) {
        cityCoordMap[row.kab_kota.trim().toUpperCase()] = [
          parseFloat(latStr.trim()),
          parseFloat(lngStr.trim())
        ];
      }
    });

    // Fallback coords
    const fallbackCoords: Record<string, [number, number]> = {
      'ACEH': [4.69, 96.74],
      'SUMATERA UTARA': [2.33, 98.98],
      'SUMATERA BARAT': [-0.78, 100.65],
      'RIAU': [0.50, 101.44],
      'JAMBI': [-1.61, 103.61],
      'SUMATERA SELATAN': [-3.31, 104.91],
      'BENGKULU': [-3.79, 102.26],
      'LAMPUNG': [-5.12, 105.26],
      'JAWA BARAT': [-6.91, 107.60],
      'JAWA TENGAH': [-7.53, 110.59],
      'DI YOGYAKARTA': [-7.79, 110.36],
      'JAWA TIMUR': [-7.25, 112.75],
      'BALI': [-8.40, 115.18],
      'NUSA TENGGARA BARAT': [-8.65, 116.32],
      'NUSA TENGGARA TIMUR': [-10.17, 123.60],
      'KALIMANTAN BARAT': [-0.02, 109.34],
      'KALIMANTAN TENGAH': [-2.20, 113.92],
      'KALIMANTAN SELATAN': [-3.31, 114.59],
      'KALIMANTAN TIMUR': [-0.50, 117.14],
      'SULAWESI UTARA': [1.47, 124.84],
      'SULAWESI TENGAH': [-0.90, 119.87],
      'SULAWESI SELATAN': [-5.14, 119.42],
      'SULAWESI TENGGARA': [-3.97, 122.51],
      'GORONTALO': [0.54, 123.05],
      'SULAWESI BARAT': [-2.67, 118.88],
      'MALUKU': [-3.65, 128.18],
      'MALUKU UTARA': [0.78, 127.37],
      'PAPUA': [-2.54, 140.70],
      'PAPUA BARAT': [-0.86, 134.06]
    };

    // 2. Fetch top potentials
    const potentialsRes = await query(`
      SELECT 
        rk.komoditas_ref AS id,
        rk.nama_komoditas AS name,
        rk.luas_area,
        rk.volume,
        rk.jumlah_sdm_terlibat,
        rk.nilai_potensi_desa AS value,
        rw.provinsi AS province,
        rw.kab_kota AS city,
        rw.kecamatan AS district,
        rw.desa_kelurahan AS village,
        rw.kode_wilayah
      FROM referensi_komoditas_desa rk
      LEFT JOIN referensi_wilayah rw ON rk.kode_wilayah = rw.kode_wilayah
      WHERE rk.nilai_potensi_desa > 0
      ORDER BY rk.nilai_potensi_desa DESC
      LIMIT 100
    `);

    potentials = potentialsRes.rows.map(row => {
      const cityKey = (row.city || '').trim().toUpperCase();
      const provKey = (row.province || '').trim().toUpperCase();

      let lat = -2.5;
      let lng = 118.0;
      if (cityCoordMap[cityKey]) {
        lat = cityCoordMap[cityKey][0] + (Math.random() - 0.5) * 0.05;
        lng = cityCoordMap[cityKey][1] + (Math.random() - 0.5) * 0.05;
      } else if (fallbackCoords[provKey]) {
        lat = fallbackCoords[provKey][0] + (Math.random() - 0.5) * 0.1;
        lng = fallbackCoords[provKey][1] + (Math.random() - 0.5) * 0.1;
      }

      return {
        id: row.id,
        name: row.name,
        category: getCommodityCategory(row.name),
        volume: parseFloat(row.volume) || 0.0,
        luas_area: parseFloat(row.luas_area) || 0.0,
        sdm_terlibat: parseInt(row.jumlah_sdm_terlibat, 10) || 0,
        value: parseFloat(row.value) || 0.0,
        province: row.province || 'Jawa Tengah',
        city: row.city || 'Boyolali',
        district: row.district || 'Boyolali',
        village: row.village || 'Desa Merah Putih',
        latitude: lat,
        longitude: lng
      };
    });

    stats.total_economic_value = potentials.reduce((acc, p) => acc + p.value, 0);
    stats.total_volume = potentials.reduce((acc, p) => acc + p.volume, 0);
    stats.total_farmers = potentials.reduce((acc, p) => acc + p.sdm_terlibat, 0);
    stats.hotspot_count = potentials.length;

  } catch (error) {
    console.error('Error loading potentials server side:', error);
  }

  return (
    <PotensiDesaClient
      initialStats={stats}
      initialPotentials={potentials}
      detailedCooperatives={detailedCooperatives}
      provinces={provinces}
      commodityNames={commodityNames}
    />
  );
}

function getCommodityCategory(name: string): string {
  const cleanName = (name || '').toLowerCase();
  if (cleanName.includes('padi') || cleanName.includes('jagung') || cleanName.includes('beras') || cleanName.includes('kedelai') || cleanName.includes('singkong') || cleanName.includes('ubi') || cleanName.includes('sayur')) {
    return 'Pertanian';
  }
  if (cleanName.includes('kopi') || cleanName.includes('teh') || cleanName.includes('kakao') || cleanName.includes('cengkeh') || cleanName.includes('kelapa') || cleanName.includes('sawit') || cleanName.includes('karet')) {
    return 'Perkebunan';
  }
  if (cleanName.includes('sapi') || cleanName.includes('kambing') || cleanName.includes('ayam') || cleanName.includes('ternak') || cleanName.includes('susu')) {
    return 'Peternakan';
  }
  if (cleanName.includes('ikan') || cleanName.includes('udang') || cleanName.includes('rumput laut') || cleanName.includes('kepiting') || cleanName.includes('perikanan')) {
    return 'Perikanan';
  }
  if (cleanName.includes('wisata') || cleanName.includes('pantai') || cleanName.includes('desa wisata')) {
    return 'Pariwisata';
  }
  return 'Industri Kreatif';
}

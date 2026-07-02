import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cooperativeRepository } from '@/lib/repositories/cooperative.repository';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cooperativeId = searchParams.get('cooperativeId');

  if (!cooperativeId) {
    return NextResponse.json({ error: 'Missing cooperativeId' }, { status: 400 });
  }

  try {
    const coop = await cooperativeRepository.getByIdWithDetails(cooperativeId);
    if (!coop) {
      return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      Anda adalah pakar rantai pasok dan digitalisasi koperasi di Indonesia. 
      Analisis data koperasi desa berikut dan berikan saran optimasi gotong royong logistik.
      
      DATA KOPERASI:
      - Nama Koperasi: ${coop.name}
      - Lokasi: ${coop.city}, ${coop.province}
      - Jumlah Anggota Total: ${coop.member_count || 0}
      - Anggota Aktif: ${coop.active_members || 0}
      - Pendapatan Tahunan: Rp ${(coop.annual_revenue || 0).toLocaleString('id-ID')}
      
      KOMODITAS & STOK:
      ${coop.commodities.map(c => `- ${c.name} (Kategori: ${c.category}): Kapasitas Bulanan ${c.monthly_capacity} ${c.unit}, Stok Tersedia Saat Ini ${c.available_stock} ${c.unit}`).join('\n')}
      
      SKOR PERFORMA ARUNA (ARUNA SCORE):
      - Skor Akhir: ${coop.score?.final_score}/100
      - Keaktifan Anggota: ${coop.score?.health_score}/100
      - Kesehatan Keuangan: ${coop.score?.growth_score}/100
      - Stabilitas Pasokan: ${coop.score?.supply_score}/100

      TUGAS ANDA:
      Hasilkan analisis taktis dalam Bahasa Indonesia dalam format JSON dengan skema berikut:
      {
        "summary": "Ringkasan 2 kalimat mengenai kekuatan utama dan status saat ini.",
        "analysis": [
          "Daftar poin masalah utama (misal: rasio anggota aktif rendah, kapasitas utilisasi hampir penuh, risiko komoditas tunggal, pendapatan mikro, dll.)"
        ],
        "recommendations": [
          "Daftar rekomendasi aksi gotong royong konkret (misal: perluasan kemitraan, program pendampingan, perbaikan irigasi, pelatihan keaktifan, pengajuan modal KUR, diversifikasi produk, dll.)"
        ]
      }
      Jangan sertakan teks pembuka atau penutup, langsung keluarkan objek JSON tersebut.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsedData = JSON.parse(textResponse);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error generating Gemini insights:', error);
    return NextResponse.json({ error: 'Failed to generate AI insights: ' + error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { command, commodities, members } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command string is required' }, { status: 400 });
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
      Anda adalah asisten AI (Natural Language Operating System) untuk Koperasi Desa/Kelurahan Merah Putih (KDMP) Indonesia. 
      Tugas Anda adalah menganalisis perintah bahasa alami (teks atau transkrip suara) dari pengurus koperasi dan menerjemahkannya menjadi aksi terstruktur sistem dalam format JSON.

      PERINTAH PENGGUNA:
      "${command}"

      KONTEKS INVENTORI & STOK AKTUAL KOPERASI:
      ${commodities && commodities.length > 0 
        ? commodities.map((c: any) => `- ID: ${c.id}, Nama: ${c.name}, Kategori: ${c.category}, Stok: ${c.available_stock} ${c.unit}`).join('\n')
        : 'Tidak ada data komoditas.'}

      DAFTAR ANGGOTA KOPERASI AKTUAL:
      ${members && members.length > 0
        ? members.map((m: any) => `- ID: ${m.id}, Nama: ${m.name}, Telepon: ${m.phone}`).join('\n')
        : 'Tidak ada data anggota.'}

      ATURAN AKSI (ACTION SCHEMAS):
      
      1. PENJUALAN (action: "create_sale")
         Digunakan jika pengguna ingin menjual, mencatat kasir, atau transaksi keluar kepada anggota.
         Contoh: "Jual beras premium 5 kg ke Pak Budi", "kasir telur 2 rak", "jual minyak goreng 2 liter"
         Payload format:
         {
           "items": [{ "commodity_id": "id_dari_konteks", "commodity_name": "nama_komoditas", "quantity": angka, "unit": "satuan" }],
           "memberName": "nama_anggota",
           "memberId": "id_anggota_jika_ada",
           "paymentMethod": "Tunai" | "Transfer" | "Simpanan" (default "Tunai")
         }

      2. PEMBELIAN / PENGADAAN (action: "create_purchase")
         Digunakan jika koperasi membeli barang/komoditas dari supplier atau petani luar (stok masuk).
         Contoh: "Saya baru beli 5 karung beras dari Pak Budi", "terima 10 dus minyak goreng dari PT ABC"
         Payload format:
         {
           "items": [{ "commodity_name": "nama_komoditas", "quantity": angka, "unit": "satuan" }],
           "supplierName": "nama_supplier_atau_petani"
         }

      3. PENYESUAIAN STOK (action: "update_stock")
         Digunakan jika ingin menambah, mengurangi, atau mencatat stok manual secara langsung.
         Contoh: "Tambah stok gula 20 kilo", "kurangi stok telur 15 butir", "ubah stok jagung jadi 5 ton"
         Payload format:
         {
           "commodity_id": "id_dari_konteks_jika_ada",
           "commodity_name": "nama_komoditas",
           "quantity": angka,
           "unit": "satuan",
           "operation": "add" | "reduce" | "set"
         }

      4. TANYA STOK (action: "query_stock")
         Digunakan jika pengguna menanyakan jumlah stok komoditas.
         Contoh: "Berapa stok cabai sekarang?", "tampilkan sisa kopi robusta"
         Payload format:
         {
           "commodity_name": "nama_komoditas"
         }

      5. LAPORAN (action: "reporting")
         Digunakan jika menanyakan performa keuangan, omzet, atau analisis produk terlaris.
         Contoh: "Hari ini omzet berapa?", "laporan penjualan minggu ini", "barang apa yang paling laku bulan ini"
         Payload format:
         {
           "reportType": "revenue_today" | "revenue_week" | "best_selling" | "active_members"
         }

      TUGAS ANDA:
      Kembalikan objek JSON dengan skema berikut:
      {
        "action": "create_sale" | "create_purchase" | "update_stock" | "query_stock" | "reporting",
        "payload": { ... },
        "confirmation_message": "Kalimat konfirmasi singkat dan ramah dalam Bahasa Indonesia, merangkum apa yang akan dilakukan (misal: 'Saya akan mencatat penjualan 5 kg Beras Premium kepada Pak Budi dengan pembayaran Tunai. Apakah data sudah benar?')"
      }

      PENTING:
      - Selalu cocokkan nama komoditas/produk dari perintah dengan daftar inventori kontekstual. Jika mirip, gunakan ID dari konteks.
      - Selalu cocokkan nama anggota dari perintah dengan daftar anggota kontekstual. Jika mirip, masukkan ID-nya.
      - Jika nama produk atau anggota tidak ditemukan di konteks, tetap isi nama yang diucapkan pengguna, namun kosongkan ID-nya (biarkan null).
      - Jangan sertakan teks pembuka atau penutup, langsung keluarkan objek JSON tersebut.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsedData = JSON.parse(textResponse);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in AI command intent analyzer API:', error);
    return NextResponse.json({ error: 'AI parsing failed: ' + error.message }, { status: 500 });
  }
}

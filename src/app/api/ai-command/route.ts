import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { command, commodities, members, context } = await request.json();

    if (!command) {
      return NextResponse.json({ error: 'Command string is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemma-4-31b-it',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      Anda adalah asisten AI (Natural Language Operating System) untuk Koperasi Desa/Kelurahan Merah Putih (KDMP) Indonesia. 
      Tugas Anda adalah menganalisis perintah bahasa alami (teks atau transkrip suara) dari pengurus koperasi dan menerjemahkannya menjadi aksi terstruktur sistem dalam format JSON.

      PERINTAH PENGGUNA TERBARU:
      "${command}"

      CONTEXT/RIWAYAT SEBELUMNYA (JIKA ADA):
      ${context ? JSON.stringify(context) : 'Tidak ada context sebelumnya. Ini adalah percakapan baru.'}

      KONTEKS INVENTORI & STOK AKTUAL KOPERASI:
      ${commodities && commodities.length > 0 
        ? commodities.map((c: any) => `- ID: ${c.id}, Nama: ${c.name}, Kategori: ${c.category}, Stok: ${c.available_stock} ${c.unit}`).join('\n')
        : 'Tidak ada data komoditas.'}

      DAFTAR ANGGOTA KOPERASI AKTUAL:
      ${members && members.length > 0
        ? members.map((m: any) => `- ID: ${m.id}, Nama: ${m.name}, Telepon: ${m.phone}`).join('\n')
        : 'Tidak ada data anggota.'}

      ATURAN VALIDASI & AKSESSABILITAS PARAMETER:
      Sebelum mengeksekusi aksi final, periksa apakah data wajib berikut ada dan valid:
      1. PENJUALAN (action: "create_sale")
         - Wajib: Nama produk (commodity_id/commodity_name) dan jumlahnya (quantity) harus > 0.
         - Opsional: Nama anggota (memberName/memberId - default "Umum"), metode pembayaran (paymentMethod - "Tunai" | "Transfer" | "Simpanan" - default "Tunai").
      2. PEMBELIAN / PENGADAAN (action: "create_purchase")
         - Wajib: Nama produk (commodity_name), jumlahnya (quantity) harus > 0, dan nama petani/pemasok (supplierName).
      3. PENYESUAIAN STOK (action: "update_stock")
         - Wajib: Nama produk (commodity_name), jumlahnya (quantity) harus >= 0, dan operasi penyesuaian (operation: "add" | "reduce" | "set").
      4. UBAH/EDIT PRODUK (action: "edit_product")
         - Wajib: Nama produk lama (commodity_name) atau ID produk (commodity_id), dan setidaknya satu data baru yang ingin diubah (seperti nama baru, kategori baru, satuan baru, atau harga baru).
      5. HAPUS PRODUK (action: "delete_product")
         - Wajib: Nama produk (commodity_name) atau ID produk (commodity_id).

      ATURAN KLARIFIKASI (action: "need_clarification"):
      Jika data wajib di atas belum lengkap (misal pengguna tidak menyebutkan jumlah saat ingin menjual/membeli barang, atau tidak menyebutkan nama petani saat mencatat pembelian):
      - JANGAN membuat asumsi jumlah (seperti menyetelnya ke 0 atau 1) kecuali konteksnya sangat jelas.
      - Kembalikan aksi klarifikasi dengan skema JSON berikut:
        {
          "action": "need_clarification",
          "payload": {
            "missing_field": "nama_field_yang_kurang" (misal: "quantity" atau "supplierName"),
            "partial_action": "aksi_yang_akan_dibuat" (misal: "create_sale" atau "create_purchase"),
            "partial_payload": { ... data yang berhasil diekstrak sejauh ini ... }
          },
          "confirmation_message": "Kalimat pertanyaan klarifikasi yang ramah dan sopan dalam Bahasa Indonesia untuk menanyakan field yang kurang (misal: 'Maaf, berapa kg beras premium yang ingin Anda jual ke Pak Budi?' atau 'Dari petani siapa pembelian jagung ini diperoleh?')"
        }

      ATURAN PENGGABUNGAN CONTEXT:
      - Jika terdapat CONTEXT SEBELUMNYA dengan action "need_clarification":
        1. Ekstrak informasi dari PERINTAH PENGGUNA TERBARU (misal pengguna menjawab "15 kg" atau "Pak Budi").
        2. Gabungkan informasi baru tersebut ke dalam "partial_payload" dari context tersebut.
        3. Jika seluruh data wajib kini sudah lengkap, kembalikan aksi final (misal: "create_sale", "create_purchase") dengan payload lengkap dan status normal.
        4. Jika data masih belum lengkap, tetap kembalikan action "need_clarification" dengan payload yang diperbarui dan tanyakan kembali field yang masih kurang.

      ATURAN AKSI FINAL (JIKA DATA LENGKAP):
      1. PENJUALAN (action: "create_sale")
         Payload format:
         {
           "items": [{ "commodity_id": "id_dari_konteks_jika_mirip", "commodity_name": "nama_komoditas", "quantity": angka, "unit": "satuan", "price_per_kg": 12000 }],
           "memberName": "nama_anggota",
           "memberId": "id_anggota_jika_ada",
           "paymentMethod": "Tunai" | "Transfer" | "Simpanan"
         }
      2. PEMBELIAN / PENGADAAN (action: "create_purchase")
         Payload format:
         {
           "items": [{ "commodity_name": "nama_komoditas", "quantity": angka, "unit": "satuan" }],
           "supplierName": "nama_supplier_atau_petani"
         }
      3. PENYESUAIAN STOK (action: "update_stock")
         Payload format:
         {
           "commodity_id": "id_dari_konteks_jika_ada",
           "commodity_name": "nama_komoditas",
           "quantity": angka,
           "unit": "satuan",
           "operation": "add" | "reduce" | "set"
         }
      4. TANYA STOK (action: "query_stock")
         { "commodity_name": "nama_komoditas" }
      5. LAPORAN (action: "reporting")
         { "reportType": "revenue_today" | "revenue_week" | "best_selling" | "active_members" }
      6. UBAH/EDIT PRODUK (action: "edit_product")
         Payload format:
         {
           "commodity_id": "id_dari_konteks_jika_mirip",
           "commodity_name": "nama_komoditas_lama",
           "updates": {
             "name": "nama_baru_jika_ada",
             "category": "kategori_baru_jika_ada",
             "unit": "satuan_baru_jika_ada",
             "price_per_unit": angka_harga_baru_jika_ada,
             "monthly_capacity": angka_kapasitas_baru_jika_ada,
             "harvest_period": "musim_panen_baru_jika_ada"
           }
         }
      7. HAPUS PRODUK (action: "delete_product")
         Payload format:
         {
           "commodity_id": "id_dari_konteks_jika_mirip",
           "commodity_name": "nama_komoditas"
         }

      FORMAT KELUARAN (OUTPUT FORMAT):
      Kembalikan objek JSON dengan skema berikut jika data lengkap:
      {
        "action": "create_sale" | "create_purchase" | "update_stock" | "query_stock" | "reporting" | "edit_product" | "delete_product",
        "payload": { ... },
        "confirmation_message": "Kalimat konfirmasi singkat dan ramah dalam Bahasa Indonesia, merangkum apa yang akan dilakukan (misal: 'Saya akan mencatat penjualan 15 kg Beras Premium kepada Pak Budi. Apakah data sudah benar?' atau 'Saya akan memperbarui detail komoditas Minyak Goreng dengan harga baru Rp 14.000. Apakah data sudah benar?')"
      }

      PENTING:
      - Selalu cocokkan nama komoditas/produk dan nama anggota dari konteks jika mirip. Jika tidak ada, kosongkan ID-nya (biarkan null).
      - HANYA keluarkan objek JSON. Dilarang keras mengeluarkan teks penjelasan, kata pengantar, penutup, atau tanda markdown. Output Anda harus langsung diawali dengan '{' dan diakhiri dengan '}'.
    `;

    let textResponse = '';
    try {
      const result = await model.generateContent(prompt);
      textResponse = result.response.text();
      
      // Extract the largest valid JSON block ending at the last '}'
      const endIdx = textResponse.lastIndexOf('}');
      if (endIdx === -1) {
        throw new Error('No closing brace found in response');
      }

      let parsedData = null;
      let startIdx = textResponse.indexOf('{');
      while (startIdx !== -1 && startIdx < endIdx) {
        const candidate = textResponse.substring(startIdx, endIdx + 1);
        try {
          parsedData = JSON.parse(candidate);
          break; // Found the valid JSON block!
        } catch (e) {
          // Continue searching
        }
        startIdx = textResponse.indexOf('{', startIdx + 1);
      }

      if (!parsedData) {
        throw new Error('Failed to find a valid JSON block in the model response');
      }

      return NextResponse.json(parsedData);
    } catch (e: any) {
      throw new Error(`${e.message}. Raw output was: ${textResponse}`);
    }
  } catch (error: any) {
    console.error('Error in AI command intent analyzer API:', error);
    return NextResponse.json({ error: 'AI parsing failed: ' + error.message }, { status: 500 });
  }
}

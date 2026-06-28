# 🌾 ARUNA — Analitik Usaha Rakyat Nusantara

> Platform digital yang memetakan potensi komoditas koperasi desa, menghubungkan koperasi untuk berkolaborasi secara gotong royong memenuhi permintaan pasar nasional, serta menyediakan analisis berbasis data sebagai pendukung pengambilan keputusan.

---

## 🔍 Latar Belakang & Masalah

Pemerintah Indonesia tengah membentuk lebih dari **80.000 Koperasi Desa/Kelurahan Merah Putih** sebagai motor penggerak ekonomi desa. Namun, tantangan berikutnya adalah memastikan koperasi tersebut mampu memanfaatkan potensi komoditas unggulan secara optimal dan terhubung dengan pasar nasional.

Saat ini informasi mengenai **kapasitas produksi, ketersediaan komoditas, dan kesiapan koperasi masih tersebar** sehingga permintaan dalam skala besar sulit dipenuhi oleh satu koperasi. Akibatnya, peluang pasar sering tidak terserap dan rantai distribusi masih panjang.

**ARUNA hadir sebagai solusi** — platform digital yang:
- 🗺️ Memetakan potensi komoditas koperasi desa
- 🤝 Menghubungkan koperasi untuk berkolaborasi secara **gotong royong** memenuhi permintaan pasar nasional
- 📊 Menyediakan analisis berbasis data sebagai pendukung pengambilan keputusan bagi koperasi maupun pemerintah

---

## 💡 Solusi & Kebaruan Ide

ARUNA merupakan **platform intelligence** yang mendukung digitalisasi komoditas unggulan desa melalui pemetaan data, kolaborasi antar koperasi, dan rekomendasi berbasis analitik.

> Berbeda dengan sistem koperasi yang berfokus pada administrasi atau pencatatan transaksi, **ARUNA berfungsi sebagai platform pendukung keputusan** yang membantu menghubungkan potensi komoditas desa ke pasar nasional melalui kolaborasi koperasi berbasis data.

---

## ✨ Empat Fitur Utama

### 🗺️ 1. Peta Potensi Komoditas
Menyajikan persebaran koperasi, komoditas unggulan, kapasitas produksi, dan lokasi secara **interaktif** — sehingga pemerintah maupun pelaku usaha dapat melihat potensi ekonomi desa dalam satu dashboard nasional.

### 🤝 2. Gotong Royong Supply Engine *(Pembeda Utama)*
Mesin pencocokan yang secara **otomatis menggabungkan beberapa koperasi** untuk memenuhi permintaan pasar nasional yang tidak dapat dipenuhi oleh satu koperasi saja. Pendekatan ini mengimplementasikan prinsip gotong royong ke dalam rantai pasok digital.

**Contoh nyata:** PT Indofood butuh 500 ton jagung. ARUNA otomatis mengidentifikasi dan mengalokasikan pasokan dari 3 koperasi berbeda lintas provinsi — masing-masing berkontribusi sesuai kapasitasnya.

```
Permintaan buyer masuk (volume + lokasi pabrik)
        ↓
Sistem memetakan koperasi yang cocok (komoditas, stok, skor)
        ↓
Kuota dibagi proporsional → koperasi kecil pun bisa ikut memenuhi pasar nasional
```

### ⭐ 3. ARUNA Score
Mengukur **kesiapan koperasi** berdasarkan kapasitas pasok, aktivitas usaha, dan partisipasi anggota — sehingga memudahkan proses pemilihan mitra yang tepat dan terpercaya.

### 💡 4. ARUNA Insight
Menghasilkan **rekomendasi berbasis rule engine** mengenai peluang kolaborasi, peningkatan kapasitas produksi, dan distribusi komoditas agar koperasi bisa terus berkembang.

---

## 📊 Statistik Demo

| Indikator | Angka |
|-----------|-------|
| 🏛️ Koperasi mitra | **20+** |
| 🗺️ Provinsi aktif | **14** |
| 🌾 Komoditas unggulan | **15+** |
| 📦 Kapasitas pasokan bulanan | **800+ Ton** |

---

## 🤝 Kontribusi & Informasi

Project ini dibuat untuk **Digital Cooperatives Expo 2026**. Jika ingin berkontribusi atau punya pertanyaan, silakan buka *issue* atau hubungi tim pengembang.

---
---

## 🛠️ Informasi Teknis

> Bagian ini ditujukan untuk **developer** yang ingin menjalankan atau berkontribusi pada kode sumber ARUNA.

### Stack Teknologi

- **[Next.js 16](https://nextjs.org/)** — Framework web modern (React)
- **[TypeScript](https://www.typescriptlang.org/)** — JavaScript dengan tipe data yang lebih aman
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Sistem desain visual
- **[Leaflet](https://leafletjs.com/) / React Leaflet** — Peta interaktif
- **[Recharts](https://recharts.org/)** — Visualisasi data & grafik
- **[Zustand](https://zustand-demo.pmnd.rs/)** — Manajemen state aplikasi
- **[TanStack Query](https://tanstack.com/query)** — Fetching & caching data
- **[Zod](https://zod.dev/) + React Hook Form** — Validasi form

### Cara Menjalankan Secara Lokal

> Butuh: **Node.js v18+** dan **npm** sudah terinstall di komputer Anda.

```bash
# 1. Clone repository
git clone <url-repository-ini>
cd aruna

# 2. Install dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — aplikasi siap digunakan!

> Data yang tampil adalah **data demo** yang sudah disiapkan. Tidak perlu koneksi ke database eksternal untuk mencoba semua fitur.

### Struktur Folder

```
aruna/
├── src/
│   ├── app/               # Halaman-halaman aplikasi (routing Next.js)
│   │   ├── page.tsx       # Halaman utama / landing page
│   │   ├── dashboard/     # Dashboard nasional
│   │   ├── peta/          # Peta potensi interaktif
│   │   ├── marketplace/   # Supply engine & matching
│   │   ├── scoring/       # ARUNA Score
│   │   └── insights/      # Analisis & tren pasar
│   ├── components/        # Komponen UI yang dapat digunakan ulang
│   ├── lib/               # Fungsi utilitas & helper
│   └── types/             # Definisi tipe data TypeScript
├── database/              # Data demo / seed
├── public/                # Aset statis (gambar, ikon, dll.)
└── package.json           # Daftar dependensi proyek
```

---

*Dibuat dengan ❤️ untuk memberdayakan koperasi Indonesia.*

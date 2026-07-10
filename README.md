# 🌾 ARUNA — Analitik Usaha Rakyat Nusantara

> Platform digital yang memetakan potensi komoditas koperasi desa, menghubungkan koperasi untuk berkolaborasi secara gotong royong memenuhi permintaan pasar nasional, serta menyediakan analisis berbasis data sebagai pendukung pengambilan keputusan.
>
> 🗣️ **Materi Pitching & Presentasi:** [PITCH.md](PITCH.md)

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

## ✨ Fitur Utama Platform

### 🗺️ 1. Peta Potensi Komoditas & Command Center
Menyajikan persebaran koperasi, komoditas unggulan, kapasitas produksi, dan lokasi secara **interaktif** menggunakan peta Leaflet.
* **Role Restrict**: Akses halaman Peta Command Center dibatasi khusus untuk peran `admin` dan `koperasi`.
* **Gemini AI Insights**: Analisis dan rangkuman wilayah berdasarkan kapasitas produksi kumulatif secara real-time.

### 🤝 2. Gotong Royong Supply Engine (Auto-Split Billing)
Mesin pencocokan yang secara **otomatis menggabungkan beberapa koperasi** untuk memenuhi permintaan pasar nasional.
* **Gerbang Pembayaran QRIS Dinamis**: Rincian checkout dipecah per koperasi mitra penyedia barang dengan sistem *Auto-Split Escrow (H+1)*.
* **Auto-Decrement & Auto-Confirm**: Transaksi langsung otomatis memotong stok gudang koperasi yang bersangkutan saat pembayaran terkonfirmasi.

### 🏪 3. POS Kasir Koperasi Offline-First (SimKopDes Connector)
Modul Kasir POS (Point of Sale) mandiri bagi koperasi desa untuk pencatatan penjualan lokal.
* **Offline-First Storage**: Menggunakan IndexedDB lokal (`localDb`) untuk menyimpan transaksi penjualan, pembelian, dan inventori saat jaringan internet terputus.
* **Background Sync Manager**: Secara otomatis melacak antrean sinkronisasi (`queueForSync`) dan melakukan sinkronisasi data ke cloud backend secara instan begitu koneksi pulih (`triggerSync`).
* **QRIS GPN POS**: Kasir dapat memunculkan barcode QRIS dinamis untuk pembayaran instan pelanggan umum.

### 📖 4. Riwayat Pembukuan Transaksi & Detail Popup
Sistem pembukuan transaksi koperasi yang proper dan rapi.
* **Detil Transaksi**: Baris riwayat transaksi dapat diklik untuk membuka **Modal Rincian Transaksi** yang menampilkan tabel rincian item produk, subtotal perhitungan, nama pelanggan/petani, serta tombol simulasi cetak struk belanja atau tanda terima barang masuk.
* **Proteksi Format**: Menggunakan proteksi defensif guna menghindari *runtime error* pada pemformatan nominal mata uang.

### 👤 5. Manajemen Profil & Alamat Pelanggan
* **Identitas Customer**: Navbar mendeteksi dan menampilkan identitas peran pembeli dengan label `Customer Umum`.
* **Atur Alamat Utama**: Menu Navbar menyediakan pengaturan alamat utama untuk customer umum, yang terintegrasi secara otomatis sebagai alamat pengiriman utama saat melakukan checkout di pasar digital.

---

## 🛠️ Informasi Teknis (Untuk Developer)

### Stack Teknologi

- **[Next.js 16 (App Router)](https://nextjs.org/)** — Framework React modern
- **[Firebase & Firestore](https://firebase.google.com/)** — Database cloud dan autentikasi pengguna
- **[Leaflet / React Leaflet](https://leafletjs.com/)** — Integrasi GIS dan peta interaktif
- **[Dexie.js / IndexedDB](https://dexie.org/)** — Mesin database offline lokal untuk sinkronisasi POS
- **[Recharts](https://recharts.org/)** — Visualisasi data analitis dashboard nasional
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Sistem desain responsif
- **[Lucide Icons](https://lucide.dev/)** — Set ikon visual UI premium

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

### Struktur Folder Utama

```
aruna/
├── src/
│   ├── app/               # Halaman-halaman aplikasi (routing Next.js)
│   │   ├── page.tsx       # Halaman utama / landing page
│   │   ├── select-role/   # Pemilihan peran pengguna & registrasi kyc
│   │   ├── dashboard/     # Dashboard nasional analitik
│   │   ├── peta/          # Peta potensi interaktif (Command Center)
│   │   ├── marketplace/   # Supply engine & matching e-commerce
│   │   ├── mitra-dashboard/ # Dasbor POS Kasir & Konektor offline
│   │   └── api/           # API Routes (AI commands, upload dokumen, dll.)
│   ├── components/        # Komponen UI yang dapat digunakan ulang (Navbar, map client)
│   ├── context/           # React Context (Autentikasi & state peran)
│   ├── lib/               # Layanan database offline, konfigurasi Firebase, upload
│   └── types/             # Definisi tipe data TypeScript
├── database/              # Data demo / seed awal
├── public/                # Aset statis (gambar, ikon, dll.)
└── package.json           # Daftar dependensi proyek
```

---

**Digagas oleh:**
1. Lelianto Eko Pradana
2. Juergen Kliensman Batubara

---

*Dibuat dengan ❤️ untuk memberdayakan koperasi Indonesia.*

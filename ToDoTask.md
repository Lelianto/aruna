# 📋 ARUNA ClickUp ToDo Tasks

Berikut adalah daftar tugas terstruktur yang siap disalin ke ClickUp Anda untuk pengembangan platform ARUNA selanjutnya:

---

## 🔌 1. Offline Sync & Resilience
- [ ] **Implementasi Resolusi Konflik Sinkronisasi (Conflict Resolution)**
  - *Deskripsi*: Tambahkan strategi resolusi konflik di API `/api/sync` (seperti *Last-Write-Wins* berbasis `updated_at`) jika data online telah diubah oleh pihak lain saat koperasi lokal sedang offline.
- [ ] **Mekanisme Exponential Backoff Retry pada Sync Queue**
  - *Deskripsi*: Terapkan interval waktu tunggu yang meningkat jika pengiriman antrean sinkronisasi gagal akibat ketidakstabilan koneksi internet.
- [ ] **Indikator Status Sinkronisasi Real-time di UI**
  - *Deskripsi*: Tampilkan widget status konektivitas di dasbor kasir ("Offline - X data mengantre") agar kasir tahu status data lokal.

---

## 🛡️ 2. Security & Compliance
- [ ] **Audit & Implementasi Firestore Security Rules**
  - *Deskripsi*: Susun berkas `firestore.rules` untuk membatasi hak akses read/write berdasarkan autentikasi dan peran masing-masing (`admin`, `koperasi`, `buyer`, `customer`).
- [ ] **Sanitasi Input & Pencegahan XSS di Formulir**
  - *Deskripsi*: Tambahkan validasi dan sanitasi input teks pada formulir pendaftaran anggota, pemasok, dan POS untuk mencegah celah injeksi skrip.
- [ ] **Pencegahan Hydration Mismatch di Next.js**
  - *Deskripsi*: Pindahkan inisialisasi peta Leaflet dan format tanggal lokal ke pemuatan dinamis (`next/dynamic` dengan `ssr: false`) untuk menghilangkan warning di browser.

---

## 💳 3. Payment Gateway Real Integration
- [ ] **Integrasi Sandbox Payment Gateway (Midtrans/Xendit/Doku)**
  - *Deskripsi*: Sambungkan checkout marketplace dan POS ke sandbox payment gateway nyata untuk menghasilkan kode QRIS asli.
- [ ] **Webhook Listener untuk Status Transaksi Real-time**
  - *Deskripsi*: Bangun endpoint API `/api/webhooks/payment` untuk menerima notifikasi pelunasan otomatis dari gerbang pembayaran.
- [ ] **Integrasi Payout API untuk Auto-Split Funds**
  - *Deskripsi*: Konfigurasikan pemisahan otomatis dana bersih hasil penjualan agar langsung ditransfer ke rekening bank masing-masing koperasi primair terkait.

---

## 🎨 4. POS Cashier & UX Improvements
- [ ] **Format Layout Cetak Struk Fisik (Printer Thermal)**
  - *Deskripsi*: Gantikan alert simulasi dengan layout struk belanja riil menggunakan media CSS `@media print` untuk mencetak ke printer thermal bluetooth.
- [ ] **Fitur Ekspor Pembukuan ke Excel/PDF**
  - *Deskripsi*: Sediakan tombol unduh riwayat penjualan dan pembelian bulanan ke format `.xlsx` (Excel) atau `.pdf`.
- [ ] **Drill-down Grafik Interaktif Dasbor**
  - *Deskripsi*: Izinkan pengurus mengeklik elemen grafik analitik untuk memunculkan tabel rincian data transaksi penyusunnya.

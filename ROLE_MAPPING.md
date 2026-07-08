# Pemetaan Akses Halaman & Peran Pengguna (Role-Based Access Control - RBAC)

Dokumen ini berisi pemetaan akses halaman, status proteksi rute saat ini, analisis paradigma marketplace publik vs terautentikasi, serta rekomendasi pengamanan sistem **ARUNA (Analitik Usaha Rakyat Nusantara)**.

---

## 🛒 Analisis Paradigma Marketplace (Publik vs Terautentikasi)

Dalam industri e-commerce dan marketplace B2B/B2C modern (seperti Tokopedia, Shopee, Amazon, dan Alibaba), terdapat pemisahan yang jelas antara fase pencarian barang (**Discovery Phase**) dan fase aksi bernilai tinggi (**Transaction/Conversion Phase**).

### 1. Discovery Phase (Akses Publik / Tanpa Login)
*   **Halaman Katalog & Pencarian (`/marketplace` & `/komoditas`):** Calon pembeli (baik pelaku industri besar, UMKM, maupun konsumen retail) harus dapat menjelajahi daftar produk, mencari komoditas unggulan (misal: jagung, beras, perikanan), memfilter harga, dan melihat profil koperasi penyedia.
*   **Mengapa Harus Publik?**
    *   **SEO (Search Engine Optimization):** Produk dan halaman toko dapat diindeks oleh mesin pencari Google, mendatangkan trafik organik.
    *   **Mengurangi Hambatan Masuk (Low Friction):** Calon pembeli bisa melihat ketersediaan stok terlebih dahulu sebelum repot mendaftar. Jika mereka dipaksa mendaftar di awal, *drop-off rate* (angka pengguna pergi sebelum bertransaksi) akan sangat tinggi.
    *   **Membangun Kepercayaan (Trust):** Menunjukkan bahwa koperasi aktif berproduksi dan memiliki pasokan yang valid.

### 2. Transaction Phase (Wajib Login & Registrasi)
*   **Aksi Transaksional & Personalisasi:**
    *   Menambahkan produk ke keranjang belanja (*Add to Cart*).
    *   Melakukan *Checkout* atau pembuatan pesanan baru.
    *   Mengirimkan pesan/chat langsung ke pihak Koperasi.
    *   Mengakses halaman penawaran khusus atau pencocokan supply eksklusif (*Gotong Royong Matching*).
*   **Mengapa Wajib Login?**
    *   **Validitas Data:** Keamanan transaksi, pelacakan pengiriman, dan identifikasi pembeli yang sah.
    *   **Keamanan Penawaran (B2B):** Menghindari manipulasi harga dan pesanan fiktif.

---

## 👥 Peran Pengguna (User Roles)
Sistem mendukung peran-peran berikut berdasarkan konfigurasi di `AuthContext.tsx`:
1. **Umum (Public / Guest)**: Pengguna yang belum masuk log atau belum terdaftar dalam sistem.
2. **Admin**: Administrator utama platform dengan akses menyeluruh untuk pengawasan dan onboarding.
3. **Koperasi**: Mitra Koperasi Desa/Kelurahan Merah Putih (KDMP) yang bertindak sebagai produsen/penyuplai.
4. **Buyer**: Pembeli skala Industri/UMKM yang mengajukan permintaan komoditas (*market requests*).
5. **Customer**: Pembeli eceran atau pengguna umum yang bertransaksi langsung (peran pendukung/opsional).

---

## 📊 Matriks Rekomendasi Akses Halaman (Edisi Revisi Marketplace Publik)

| Nama Halaman | Rute Halaman | Umum | Admin | Koperasi | Buyer | Customer | Rekomendasi & Deskripsi |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Beranda** | `/` | ✅ | ✅ | ✅ | ✅ | ✅ | **Publik**: Landing page utama, pengenalan platform, simulator pembagian hasil, dan tombol login. |
| **Pitch Deck** | `/pitch` | ✅ | ✅ | ✅ | ✅ | ✅ | **Publik**: Slide presentasi interaktif dan penjelasan model bisnis gotong royong untuk publik/investor. |
| **Pilih Peran** | `/select-role` | ❌ | ✅ | ✅ | ✅ | ✅ | **Wajib Login**: Tempat pengguna baru mendaftarkan diri/koperasi/instansi mereka pertama kali. |
| **Onboarding** | `/onboarding-mitra` | ❌ | ✅ | ❌ | ❌ | ❌ | **Hanya Admin**: Halaman validasi berkas NIB/SK koperasi baru dan persetujuan kemitraan secara manual. |
| **Peta Potensi** | `/peta` | ✅ | ✅ | ✅ | ❌ | ❌ | **Publik (Macro View)**: Menampilkan peta wilayah jangkauan koperasi secara umum (detail finansial/scoring disembunyikan). |
| **Dashboard Nasional**| `/dashboard` | ❌ | ✅ | ❌ | ❌ | ❌ | **Hanya Admin**: Statistik agregat transaksi nasional, total kapasitas pasok, dan visualisasi kinerja keseluruhan. |
| **Komoditas** | `/komoditas` | ✅ | ✅ | ✅ | ✅ | ❌ | **Publik (Katalog)**: Daftar kapasitas produksi, stok tersedia, dan harga komoditas per wilayah tanpa kontak langsung koperasi. |
| **Pasar Digital** | `/marketplace` | ✅ | ✅ | ✅ | ✅ | ✅ | **Publik (Jelajah)**: Katalog produk koperasi. Tamu bisa mencari & melihat barang. **Wajib login** saat tombol *Add to Cart* ditekan. |
| **Detail Match** | `/marketplace/[id]`| ❌ | ✅ | ✅ | ⚠️ | ❌ | **Terbatas**: Detail kalkulasi kecocokan supply gotong royong. Hanya untuk Admin, Koperasi penyuplai, dan Buyer pembuat order. |
| **Skor Kelayakan** | `/scoring` | ❌ | ✅ | ⚠️ | ❌ | ❌ | **Hanya Admin & Koperasi Terkait**: Skor kelayakan kredit koperasi (ARUNA Score). Koperasi hanya bisa melihat skornya sendiri. |
| **Analisis AI** | `/insights` | ❌ | ✅ | ✅ | ⚠️ | ❌ | **Internal Bisnis**: Prakiraan harga pangan di masa depan dan analisis sentimen pasar dibantu oleh Gemini AI. |
| **Portal Mitra** | `/mitra-dashboard` | ❌ | ✅ | ✅ | ❌ | ❌ | **Koperasi & Admin**: Portal kendali internal koperasi (POS Kasir, Stok Gudang, Keuangan, SHU, Anggota, & Connector). |

*Keterangan Simbol:*
- ✅ **Diizinkan**: Akses penuh ke halaman.
- ❌ **Dilarang**: Akses diblokir (diarahkan ke halaman login atau beranda).
- ⚠️ **Terbatas**: Akses bersyarat dengan filter data tertentu sesuai kepemilikan data (*data ownership*).

---

## 📝 Checklist Implementasi Keamanan Halaman

### 1. Halaman Publik & Onboarding Awal
- [ ] **Beranda (`/`)**
  - [x] Akses publik aktif tanpa autentikasi.
  - [x] Tombol CTA dinamis: Menampilkan "Masuk Google" jika belum login, dan "Portal Saya" jika sudah login.
- [ ] **Pitch Deck (`/pitch`)**
  - [x] Akses publik aktif.
- [ ] **Pasar Digital (`/marketplace`)**
  - [ ] **Buka Akses Publik di Navbar:** Perbarui `Navbar.tsx` agar tidak memfilter halaman `/marketplace` untuk tamu tanpa login.
  - [x] **Proteksi Transaksi (Keranjang/Checkout):** `MarketplaceClient.tsx` harus mendeteksi apakah pengguna sudah masuk log. Jika belum, tampilkan prompt login saat mengklik *Add to Cart* atau *Checkout*.
- [ ] **Pilih Peran (`/select-role`)**
  - [x] Proteksi autentikasi: Pengguna wajib login dengan Google.
  - [ ] Jika pengguna sudah memiliki peran aktif di profil database, otomatis alihkan (*auto-redirect*) ke dashboard yang sesuai untuk menghindari penulisan ulang peran secara tidak sengaja.

### 2. Halaman Khusus Administrator (`admin`)
- [ ] **Onboarding Mitra (`/onboarding-mitra`)**
  - [x] Proteksi client-side guard aktif (jika peran bukan `admin`, dialihkan ke `/dashboard`).
  - [ ] Implementasi proteksi Server Component/Middleware untuk mencegah kedipan layar (*UI flashing*) sebelum redirect.
- [ ] **Dashboard Nasional (`/dashboard`)**
  - [ ] Implementasikan pengalihan rute bagi pengguna non-admin (saat ini rute dapat dibuka secara langsung jika mengetik URL, hanya disembunyikan dari Navbar).
- [ ] **Skor Kelayakan (`/scoring`)**
  - [ ] Batasi akses halaman: Hanya Admin yang dapat melakukan pengubahan atau kalkulasi ulang skor.
  - [ ] Buat rute alternatif atau parameter khusus agar Koperasi dapat membaca rapor skor kelayakan mereka sendiri secara *read-only*.

### 3. Halaman Khusus Mitra Koperasi (`koperasi`)
- [ ] **Portal Mitra (`/mitra-dashboard`)**
  - [x] Verifikasi asosiasi ID koperasi (`coopId`) di database aktif di client-side.
  - [ ] Tambahkan pengalihan jika pengguna terotentikasi bukan peran `koperasi` atau `admin`.
- [ ] **Peta Potensi (`/peta`)**
  - [ ] Batasi akses halaman agar hanya dapat diakses oleh peran `koperasi` dan `admin` (saat ini belum dilindungi route guard).

### 4. Halaman Pasar & Kolaborasi Niaga
- [ ] **Katalog Komoditas Nasional (`/komoditas`)**
  - [ ] Buka akses halaman untuk publik (di Navbar) agar dapat melihat statistik umum, namun sembunyikan kontak spesifik koperasi kecuali setelah login.
- [ ] **Detail Pencocokan Gotong Royong (`/marketplace/[requestId]`)**
  - [ ] Terapkan validasi kepemilikan:
    - [ ] `admin`: Akses penuh.
    - [ ] `koperasi`: Hanya boleh membuka jika koperasi tersebut masuk dalam rekomendasi penyuplai atau tergabung dalam pengadaan kolaboratif.
    - [ ] `buyer`: Hanya boleh membuka jika pesanan tersebut adalah miliknya sendiri (`request.buyer_id` sesuai dengan `userData.associatedId`).

### 5. Fitur Analitik AI
- [ ] **Analisis & Prediksi AI (`/insights`)**
  - [ ] Lindungi halaman dari akses publik.
  - [ ] Izinkan peran `koperasi` untuk membantu perencanaan masa panen dan tanam.
  - [ ] Izinkan peran `buyer` secara terbatas khusus untuk halaman peramalan harga pasar.

---

## 🛡️ Rekomendasi Mekanisme Keamanan Teknis

### 1. Contoh Penanganan Login Mulus di Sisi Klien (`MarketplaceClient.tsx`)
Di dalam `MarketplaceClient.tsx`, penanganan *Add to Cart* untuk tamu sudah diatur dengan memicu *login prompt*. Ini adalah implementasi yang sangat baik:
```typescript
const addToCart = (product: any) => {
  if (!user) {
    setShowLoginPrompt(true); // Picu modal login interaktif
    return;
  }
  // Proses menambahkan barang ke keranjang
};
```
Mekanisme ini harus dipertahankan dan diaplikasikan juga pada tombol **"Ajukan Negosiasi"** atau **"Hubungi Mitra"**.

### 2. Next.js Middleware (`src/middleware.ts`)
Disarankan membuat file `src/middleware.ts` untuk memproses perlindungan rute di tingkat server sebelum halaman selesai di-render. Ini menghemat bandwidth dan mencegah kedipan UI (*UI flickering*).

*Contoh struktur middleware:*
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ambil token / session login dari cookie
  const session = request.cookies.get('session'); 
  const { pathname } = request.nextUrl;

  // Rute yang membutuhkan login
  if (!session && (pathname.startsWith('/mitra-dashboard') || pathname.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}
```

### 3. Aturan Keamanan Database (Firestore Security Rules)
Proteksi di sisi UI (*frontend*) belumlah cukup. Pastikan berkas `firestore.rules` di root proyek dikonfigurasi untuk mencegah modifikasi data ilegal langsung ke Firestore API.

*Contoh Aturan Firestore:*
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /cooperatives/{coopId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (isAdmin() || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.associatedId == coopId);
    }
  }
}
```

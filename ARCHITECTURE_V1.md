# ARUNA Architecture Summary v1

## 1. Tujuan platform
ARUNA adalah platform digital untuk menghubungkan potensi komoditas koperasi desa dengan kebutuhan pasar nasional melalui pemetaan data, kolaborasi antar koperasi, dan rekomendasi berbasis analitik.

## 2. Domain utama
- Koperasi dan mitra usaha
- Komoditas dan kapasitas produksi
- Permintaan pasar / buyer request
- Matching supply dan gotong royong
- Dashboard insight dan scoring
- POS / transaksi offline-first
- Autentikasi dan peran pengguna

## 3. Arsitektur front-end
### Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Auth + Firestore client SDK
- Leaflet / React Leaflet
- Recharts

### Struktur utama
- app/: route-level pages dan API routes
- components/: UI reusable, dipisahkan berdasarkan domain
- context/: state global seperti autentikasi
- lib/: service layer, integrasi eksternal, repositori, utilitas
- types/: model domain yang dipakai lintas layer

### Prinsip desain FE
- Routing berbasis fitur per modul
- Komponen domain terpisah dari presentasi umum
- State lokal dipelihara dekat dengan feature
- Data fetching dilakukan melalui service/repository layer
- UI mengandalkan komponen desain yang konsisten

### Modul FE yang ada
- Landing dan onboarding peran
- Dashboard analitik nasional
- Peta potensi dan command center
- Marketplace / gotong royong engine
- Mitra dashboard dan POS connector
- Insights dan scoring

## 4. Arsitektur back-end
### Pendekatan
- Backend API route di Next.js App Router
- Logika bisnis diletakkan di service/repository layer
- Firestore digunakan untuk data operasional utama
- PostgreSQL dipersiapkan untuk data yang lebih terstruktur / enterprise-like
- Integrasi AI melalui service layer terpisah

### Lapisan backend
1. Route layer
   - Menangani HTTP request/response
   - Validasi input sederhana
   - Delegasi ke service/repository

2. Service layer
   - Berisi logika bisnis utama
   - AI integration, sync manager, insight engine, score engine

3. Repository layer
   - Abstraksi akses data per entitas
   - Memisahkan model domain dari sumber data

4. Data access layer
   - Firestore client
   - PostgreSQL pool
   - IndexedDB untuk mode offline POS

## 5. Arsitektur data
### Sumber data utama
- Firestore collection untuk operasional aplikasi
- PostgreSQL untuk data relasional / query kompleks
- IndexedDB untuk transaksi offline dan sinkronisasi lokal

### Entitas inti
- users
- cooperatives
- commodities
- buyers
- market_requests
- supply_matches
- insights
- cooperative_scores

### Pola data
- Data master disimpan sebagai dokumen/record terstruktur
- Data transaksi mengikuti alur create -> sync -> confirm
- Data offline ditampung dalam queue untuk sinkronisasi

### Alur data penting
- User login -> profile role -> redirect ke dashboard yang sesuai
- Buyer request -> marketplace -> supply matching -> fulfillment
- POS transaksi -> local DB -> queue sync -> cloud
- Insight generation -> aggregate data -> recommendation

## 6. Arsitektur non-fungsional yang sudah terlihat
- Offline-first untuk POS connector
- Real-time UI melalui Firestore listeners
- Modular service untuk AI/insight/sync
- Penekanan pada data-driven decision support

## 7. Rekomendasi arsitektur v2
- Perjelas boundary antara feature module dan shared infrastructure
- Tambahkan domain services per modul (mis. marketplace, cooperative, inventory)
- Pisahkan DTO dari entity domain
- Standardisasi error handling dan response schema
- Tambahkan test layer untuk repository/service
- Gunakan adapter untuk Firebase/Postgres agar mudah beralih backend

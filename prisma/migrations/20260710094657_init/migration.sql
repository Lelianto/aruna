-- CreateTable
CREATE TABLE "akun_bank_koperasi" (
    "akun_bank_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama_rekening" TEXT,
    "nama_bank" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_akun_bank_koperasi_3314f99b" PRIMARY KEY ("akun_bank_ref")
);

-- CreateTable
CREATE TABLE "anggota_koperasi" (
    "anggota_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama" TEXT,
    "nik" TEXT,
    "kode_wilayah" TEXT,
    "jenis_kelamin" TEXT,
    "status_keanggotaan" TEXT,
    "tanggal_terdaftar" DATE,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),
    "file_ktp" TEXT,
    "status_akun" TEXT,
    "pekerjaan" TEXT,

    CONSTRAINT "pk_anggota_koperasi_4fe6109d" PRIMARY KEY ("anggota_ref")
);

-- CreateTable
CREATE TABLE "aset_koperasi" (
    "aset_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama_aset" TEXT,
    "tipe_aset" TEXT,
    "status" TEXT,
    "progres_pembangunan" DECIMAL,
    "foto_utama" TEXT,
    "foto_sekunder" TEXT,
    "dokumen_utama" TEXT,
    "dokumen_sekunder" TEXT,
    "dokumen_lainnya" TEXT,
    "luas_lahan" DECIMAL,
    "panjang_lahan" DECIMAL,
    "lebar_lahan" DECIMAL,
    "akses_jalan" TEXT,
    "koordinat_dibulatkan" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_aset_koperasi_b272e8a6" PRIMARY KEY ("aset_ref")
);

-- CreateTable
CREATE TABLE "barang_keluar_produk" (
    "__row_id" INTEGER NOT NULL,
    "transaksi_sample_id" TEXT NOT NULL,
    "produk_sample_id" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "kode_barcode" TEXT,
    "tanggal_keluar" TIMESTAMP(6),
    "status" TEXT,
    "nama_produk" TEXT,
    "nama_tampilan" TEXT,
    "jumlah_keluar" DECIMAL,
    "harga" DECIMAL,
    "total_nilai" DECIMAL,
    "status_transaksi" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_barang_keluar_produk_d5471b08" PRIMARY KEY ("__row_id")
);

-- CreateTable
CREATE TABLE "barang_masuk_produk" (
    "barang_masuk_ref" TEXT NOT NULL,
    "produk_sample_id" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "kode_barcode" TEXT,
    "nama_produk" TEXT,
    "nama_tampilan" TEXT,
    "jumlah_masuk" DECIMAL,
    "jumlah_tersedia" DECIMAL,
    "harga_beli" DECIMAL,
    "harga_jual" DECIMAL,
    "total_biaya" DECIMAL,
    "keterangan" TEXT,
    "status" TEXT,
    "tanggal_masuk" TIMESTAMP(6),
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_barang_masuk_produk_018e5056" PRIMARY KEY ("barang_masuk_ref")
);

-- CreateTable
CREATE TABLE "dokumen_koperasi" (
    "dokumen_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "jenis_dokumen_ref" TEXT NOT NULL,
    "nomor" TEXT,
    "tanggal_berlaku" DATE,
    "tanggal_kadaluarsa" DATE,
    "alamat_pada_dokumen" TEXT,
    "unggahan_dokumen" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_dokumen_koperasi_f5f81f61" PRIMARY KEY ("dokumen_ref")
);

-- CreateTable
CREATE TABLE "gerai_koperasi" (
    "gerai_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "jenis_gerai_ref" TEXT NOT NULL,
    "status_gerai" TEXT,
    "foto_gerai" TEXT,
    "pengisi" TEXT,
    "akses_internet" TEXT,
    "akses_listrik" TEXT,
    "status_kepemilikan_aset_gerai" TEXT,
    "status_pemanfaatan_aset_gerai" TEXT,
    "sumber_air_bersih" TEXT,
    "jenis_bangunan" TEXT,
    "koordinat_dibulatkan" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_gerai_koperasi_2aac4c3c" PRIMARY KEY ("gerai_ref")
);

-- CreateTable
CREATE TABLE "inventaris_produk" (
    "inventaris_ref" TEXT NOT NULL,
    "produk_sample_id" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama_produk" TEXT,
    "stok" DECIMAL,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),
    "kode_barcode" TEXT,

    CONSTRAINT "pk_inventaris_produk_5920d0e6" PRIMARY KEY ("inventaris_ref")
);

-- CreateTable
CREATE TABLE "karyawan_koperasi" (
    "karyawan_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama" TEXT,
    "jabatan" TEXT,
    "nomor_hp_karyawan" TEXT,
    "jenis_kelamin" TEXT,
    "nik" TEXT,
    "email" TEXT,
    "status_karyawan" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_karyawan_koperasi_bffc535e" PRIMARY KEY ("karyawan_ref")
);

-- CreateTable
CREATE TABLE "kbli_koperasi" (
    "__row_id" INTEGER NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "kode_kbli" TEXT,
    "nama_kbli" TEXT,
    "tipe_izin_usaha" TEXT,
    "tahun_kbli" SMALLINT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_kbli_koperasi_55bee0fc" PRIMARY KEY ("__row_id")
);

-- CreateTable
CREATE TABLE "modal_koperasi" (
    "modal_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nomor_perjanjian" TEXT,
    "tipe_sumber" TEXT,
    "nama_sumber" TEXT,
    "tipe_modal" TEXT,
    "jumlah" DECIMAL,
    "tanggal_diterima" DATE,
    "file_perjanjian" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_modal_koperasi_a1180c73" PRIMARY KEY ("modal_ref")
);

-- CreateTable
CREATE TABLE "pengajuan_domain" (
    "domain_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "domain_koperasi" TEXT,
    "status_verifikasi" TEXT,
    "status_domain" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_pengajuan_domain_6763303c" PRIMARY KEY ("domain_ref")
);

-- CreateTable
CREATE TABLE "pengajuan_kemitraan" (
    "pengajuan_kemitraan_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nik" TEXT,
    "penanggung_jawab" TEXT,
    "nomor_penanggung_jawab" TEXT,
    "status_permohonan" TEXT,
    "bisnis_kemitraan" TEXT,
    "paket_kemitraan" TEXT,
    "formulir_permohonan" TEXT,
    "ktp_penanggung_jawab" TEXT,
    "tipe_kemitraan" TEXT,
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_pengajuan_kemitraan_625d306d" PRIMARY KEY ("pengajuan_kemitraan_ref")
);

-- CreateTable
CREATE TABLE "pengajuan_pembiayaan" (
    "pengajuan_pembiayaan_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nik" TEXT,
    "penanggung_jawab" TEXT,
    "nomor_penanggung_jawab" TEXT,
    "status_permohonan" TEXT,
    "formulir_permohonan_pembiayaan" TEXT,
    "nominal_permohonan" REAL,
    "tenor" INTEGER,
    "tujuan_permohonan" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_pengajuan_pembiayaan_28483833" PRIMARY KEY ("pengajuan_pembiayaan_ref")
);

-- CreateTable
CREATE TABLE "pengajuan_rekening_bank" (
    "pengajuan_rekening_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nik" TEXT,
    "penanggung_jawab" TEXT,
    "nomor_penanggung_jawab" TEXT,
    "status" TEXT,
    "kode_bank" TEXT,
    "nama_bank" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_pengajuan_rekening_bank_93255ee4" PRIMARY KEY ("pengajuan_rekening_ref")
);

-- CreateTable
CREATE TABLE "pengurus_koperasi" (
    "pengurus_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama" TEXT,
    "jabatan" TEXT,
    "status" TEXT,
    "no_hp" TEXT,
    "nik" TEXT,
    "jenis_kelamin" TEXT,
    "foto_profil" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "kode_pos" TEXT,
    "tanggal_lahir" TEXT,
    "status_pendidikan" TEXT,
    "periode_mulai" TEXT,
    "periode_selesai" DATE,
    "file_ktp" TEXT,
    "sumber_data" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_pengurus_koperasi_5b9a4e2c" PRIMARY KEY ("pengurus_ref")
);

-- CreateTable
CREATE TABLE "produk_koperasi" (
    "produk_sample_id" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "kode_barcode" TEXT,
    "nama_produk" TEXT,
    "unit" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_produk_koperasi_4e63ea77" PRIMARY KEY ("produk_sample_id")
);

-- CreateTable
CREATE TABLE "profil_koperasi" (
    "koperasi_ref" TEXT NOT NULL,
    "nama_koperasi" TEXT,
    "status_registrasi" TEXT,
    "bentuk_koperasi" TEXT,
    "kategori_usaha" TEXT,
    "nik_koperasi" TEXT,
    "alamat_lengkap" TEXT,
    "kode_pos" TEXT,
    "koordinat_dibulatkan" TEXT,
    "modal_awal" TEXT,
    "sumber_persetujuan" TEXT,
    "tentang_koperasi" TEXT,
    "pola_pengelolaan" TEXT,
    "metode_pengisian" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_profil_koperasi_26375302" PRIMARY KEY ("koperasi_ref")
);

-- CreateTable
CREATE TABLE "rat_koperasi" (
    "rat_sample_id" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "jenis_sektor_koperasi" TEXT,
    "urutan_rat" TEXT,
    "tahun_buku" SMALLINT,
    "tahun_rencana_kerja" SMALLINT,
    "tahun_rencana_anggaran" SMALLINT,
    "tanggal_rat" DATE,
    "jumlah_peserta_rat" INTEGER,
    "status_rat" TEXT,
    "tahap_rat" TEXT,
    "laporan_posisi_keuangan" TEXT,
    "laporan_hasil_usaha" TEXT,
    "rapb_posisi_keuangan" TEXT,
    "rapb_hasil_usaha" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_rat_koperasi_6272548f" PRIMARY KEY ("rat_sample_id")
);

-- CreateTable
CREATE TABLE "referensi_dokumen_koperasi" (
    "jenis_dokumen_ref" TEXT NOT NULL,
    "nama_dokumen" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_referensi_dokumen_koperasi_4ea58f34" PRIMARY KEY ("jenis_dokumen_ref")
);

-- CreateTable
CREATE TABLE "referensi_gerai_koperasi" (
    "jenis_gerai_ref" TEXT NOT NULL,
    "nama_jenis_gerai" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_referensi_gerai_koperasi_e9d11ded" PRIMARY KEY ("jenis_gerai_ref")
);

-- CreateTable
CREATE TABLE "referensi_komoditas_desa" (
    "komoditas_ref" TEXT NOT NULL,
    "kode_wilayah" TEXT NOT NULL,
    "nama_komoditas" TEXT,
    "luas_area" TEXT,
    "volume" TEXT,
    "jumlah_sdm_terlibat" REAL,
    "nilai_potensi_desa" BIGINT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_referensi_komoditas_desa_fdbdbdd4" PRIMARY KEY ("komoditas_ref")
);

-- CreateTable
CREATE TABLE "referensi_koperasi_wilayah" (
    "koperasi_ref" TEXT NOT NULL,
    "kode_wilayah" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_referensi_koperasi_aktif_778fe8ef" PRIMARY KEY ("koperasi_ref")
);

-- CreateTable
CREATE TABLE "referensi_profil_desa" (
    "kode_wilayah" TEXT NOT NULL,
    "tahun_populasi" INTEGER,
    "total_penduduk" INTEGER,
    "penduduk_laki_laki" INTEGER,
    "penduduk_perempuan" INTEGER,
    "tahun_pendanaan" INTEGER,
    "anggaran_dana_desa" DECIMAL,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_referensi_profil_desa_ed7fcc83" PRIMARY KEY ("kode_wilayah")
);

-- CreateTable
CREATE TABLE "referensi_wilayah" (
    "provinsi" TEXT,
    "kab_kota" TEXT,
    "kecamatan" TEXT,
    "desa_kelurahan" TEXT,
    "kode_wilayah" TEXT NOT NULL,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_referensi_wilayah_57bb55d7" PRIMARY KEY ("kode_wilayah")
);

-- CreateTable
CREATE TABLE "simpanan_anggota" (
    "simpanan_ref" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "anggota_ref" TEXT NOT NULL,
    "periode_pembayaran" TEXT,
    "jumlah_simpanan" DECIMAL,
    "status" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "dibayar_pada" TIMESTAMP(6),

    CONSTRAINT "pk_simpanan_anggota_a226bf54" PRIMARY KEY ("simpanan_ref")
);

-- CreateTable
CREATE TABLE "transaksi_penjualan" (
    "transaksi_sample_id" TEXT NOT NULL,
    "koperasi_ref" TEXT NOT NULL,
    "nama_pelanggan" TEXT,
    "tanggal_dibuat" TIMESTAMP(6),
    "total_pembayaran" DECIMAL,
    "status_transaksi" TEXT,
    "metode_pembayaran" TEXT,
    "dibuat_pada" TIMESTAMP(6),
    "diperbarui_pada" TIMESTAMP(6),

    CONSTRAINT "pk_transaksi_penjualan_2711f8e1" PRIMARY KEY ("transaksi_sample_id")
);

-- CreateTable
CREATE TABLE "aruna_users" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "associated_id" TEXT,
    "address" TEXT,

    CONSTRAINT "aruna_users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "aruna_buyers" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "company_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "nib" TEXT,
    "siup" TEXT,
    "verified" BOOLEAN DEFAULT false,
    "buyer_type" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMPTZ(6),

    CONSTRAINT "aruna_buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aruna_market_requests" (
    "id" SERIAL NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "commodity_name" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6),
    "shipping_address" TEXT,
    "invoice_number" TEXT,
    "coop_name" TEXT,
    "total_price" DECIMAL(14,2),

    CONSTRAINT "aruna_market_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aruna_supply_matches" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "cooperative_id" TEXT NOT NULL,
    "allocated_quantity" DECIMAL(12,2) NOT NULL,
    "matched_at" TIMESTAMPTZ(6),

    CONSTRAINT "aruna_supply_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aruna_cooperative_scores" (
    "cooperative_id" TEXT NOT NULL,
    "health_score" DECIMAL(5,2) NOT NULL,
    "growth_score" DECIMAL(5,2) NOT NULL,
    "supply_score" DECIMAL(5,2) NOT NULL,
    "final_score" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "aruna_cooperative_scores_pkey" PRIMARY KEY ("cooperative_id")
);

-- CreateTable
CREATE TABLE "aruna_insights" (
    "id" SERIAL NOT NULL,
    "cooperative_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6),

    CONSTRAINT "aruna_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_anggota_koperasi_anggota_ref" ON "anggota_koperasi"("anggota_ref");

-- CreateIndex
CREATE UNIQUE INDEX "aruna_buyers_slug_key" ON "aruna_buyers"("slug");

-- CreateIndex
CREATE INDEX "aruna_market_requests_buyer_id_idx" ON "aruna_market_requests"("buyer_id");

-- CreateIndex
CREATE INDEX "aruna_supply_matches_request_id_idx" ON "aruna_supply_matches"("request_id");

-- CreateIndex
CREATE INDEX "aruna_supply_matches_cooperative_id_idx" ON "aruna_supply_matches"("cooperative_id");

-- CreateIndex
CREATE UNIQUE INDEX "aruna_supply_matches_request_id_cooperative_id_key" ON "aruna_supply_matches"("request_id", "cooperative_id");

-- CreateIndex
CREATE INDEX "aruna_insights_cooperative_id_idx" ON "aruna_insights"("cooperative_id");

-- AddForeignKey
ALTER TABLE "akun_bank_koperasi" ADD CONSTRAINT "fk_akun_bank_koperasi_koperasi_ref_b79a5726" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anggota_koperasi" ADD CONSTRAINT "fk_anggota_koperasi_kode_wilayah_96a41cef" FOREIGN KEY ("kode_wilayah") REFERENCES "referensi_wilayah"("kode_wilayah") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anggota_koperasi" ADD CONSTRAINT "fk_anggota_koperasi_koperasi_ref_b8176ae0" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aset_koperasi" ADD CONSTRAINT "fk_aset_koperasi_koperasi_ref_2ff5abd1" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "barang_keluar_produk" ADD CONSTRAINT "fk_barang_keluar_produk_koperasi_ref_6dbc1a6c" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "barang_keluar_produk" ADD CONSTRAINT "fk_barang_keluar_produk_produk_sample_id_05348b01" FOREIGN KEY ("produk_sample_id") REFERENCES "produk_koperasi"("produk_sample_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "barang_keluar_produk" ADD CONSTRAINT "fk_barang_keluar_produk_transaksi_sample_id_05bcac05" FOREIGN KEY ("transaksi_sample_id") REFERENCES "transaksi_penjualan"("transaksi_sample_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "barang_masuk_produk" ADD CONSTRAINT "fk_barang_masuk_produk_koperasi_ref_fbd3b8a5" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "barang_masuk_produk" ADD CONSTRAINT "fk_barang_masuk_produk_produk_sample_id_491ee0a5" FOREIGN KEY ("produk_sample_id") REFERENCES "produk_koperasi"("produk_sample_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dokumen_koperasi" ADD CONSTRAINT "fk_dokumen_koperasi_jenis_dokumen_ref_5df8ee5b" FOREIGN KEY ("jenis_dokumen_ref") REFERENCES "referensi_dokumen_koperasi"("jenis_dokumen_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dokumen_koperasi" ADD CONSTRAINT "fk_dokumen_koperasi_koperasi_ref_22ac9c60" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gerai_koperasi" ADD CONSTRAINT "fk_gerai_koperasi_jenis_gerai_ref_57ac7e95" FOREIGN KEY ("jenis_gerai_ref") REFERENCES "referensi_gerai_koperasi"("jenis_gerai_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gerai_koperasi" ADD CONSTRAINT "fk_gerai_koperasi_koperasi_ref_9ea0835d" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventaris_produk" ADD CONSTRAINT "fk_inventaris_produk_koperasi_ref_934f6014" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventaris_produk" ADD CONSTRAINT "fk_inventaris_produk_produk_sample_id_e49cff5a" FOREIGN KEY ("produk_sample_id") REFERENCES "produk_koperasi"("produk_sample_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "karyawan_koperasi" ADD CONSTRAINT "fk_karyawan_koperasi_koperasi_ref_4e47588f" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kbli_koperasi" ADD CONSTRAINT "fk_kbli_koperasi_koperasi_ref_659f6886" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "modal_koperasi" ADD CONSTRAINT "fk_modal_koperasi_koperasi_ref_1bb5cd3d" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pengajuan_domain" ADD CONSTRAINT "fk_pengajuan_domain_koperasi_ref_980169cd" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pengajuan_kemitraan" ADD CONSTRAINT "fk_pengajuan_kemitraan_koperasi_ref_33626c2e" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pengajuan_pembiayaan" ADD CONSTRAINT "fk_pengajuan_pembiayaan_koperasi_ref_cb273759" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pengajuan_rekening_bank" ADD CONSTRAINT "fk_pengajuan_rekening_bank_koperasi_ref_fd7eef0a" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pengurus_koperasi" ADD CONSTRAINT "fk_pengurus_koperasi_koperasi_ref_762eb9ec" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "produk_koperasi" ADD CONSTRAINT "fk_produk_koperasi_koperasi_ref_5e27414b" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "profil_koperasi" ADD CONSTRAINT "fk_profil_koperasi_koperasi_ref_2fda584b" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rat_koperasi" ADD CONSTRAINT "fk_rat_koperasi_koperasi_ref_7258ec7e" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referensi_komoditas_desa" ADD CONSTRAINT "fk_referensi_komoditas_desa_kode_wilayah_ba3b0dad" FOREIGN KEY ("kode_wilayah") REFERENCES "referensi_wilayah"("kode_wilayah") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referensi_koperasi_wilayah" ADD CONSTRAINT "fk_referensi_koperasi_aktif_kode_wilayah_93c6fdcd" FOREIGN KEY ("kode_wilayah") REFERENCES "referensi_wilayah"("kode_wilayah") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referensi_profil_desa" ADD CONSTRAINT "fk_referensi_profil_desa_kode_wilayah_c5f8bf81" FOREIGN KEY ("kode_wilayah") REFERENCES "referensi_wilayah"("kode_wilayah") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "simpanan_anggota" ADD CONSTRAINT "fk_simpanan_anggota_anggota_koperasi" FOREIGN KEY ("anggota_ref") REFERENCES "anggota_koperasi"("anggota_ref") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simpanan_anggota" ADD CONSTRAINT "fk_simpanan_anggota_koperasi_ref_c7fd2f70" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transaksi_penjualan" ADD CONSTRAINT "fk_transaksi_penjualan_koperasi_ref_f99204f5" FOREIGN KEY ("koperasi_ref") REFERENCES "referensi_koperasi_wilayah"("koperasi_ref") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aruna_market_requests" ADD CONSTRAINT "aruna_market_requests_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "aruna_buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aruna_supply_matches" ADD CONSTRAINT "aruna_supply_matches_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "aruna_market_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

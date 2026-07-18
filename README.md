# Pemetaan Perubahan Vegetasi Kota Mataram (2024–2025)

UAS Kapita Selekta Sistem Informasi — Semester 6, AY 2025/2026 — Universitas Bakrie

**Kelompok:** Nabila, Adrian, Femas, Abi, Rega

## Ringkasan Proyek

Memetakan perubahan tutupan **vegetasi** di **Kota Mataram, NTB** antara tahun **2024 dan 2025**
menggunakan citra Sentinel-2, klasifikasi Random Forest, evaluasi APRF, dan WebGIS interaktif.

Pertanyaan utama: *Apakah tutupan vegetasi di Kota Mataram bertambah atau menyusut antara
2024–2025, di mana perubahan terbesar terjadi, dan seberapa dapat dipercaya hasilnya?*

## Cara Membuka WebGIS

- **Live:** `<isi tautan GitHub Pages / hosting lain di sini>`
- **Lokal:** buka folder `webgis/`, jalankan server statis lokal (fetch GeoJSON butuh HTTP, tidak bisa dibuka langsung sebagai file), contoh:
  ```
  cd webgis
  python3 -m http.server 8080
  ```
  lalu buka `http://localhost:8080` di browser.

## ✅ Status Data — Semua Sudah Data Asli

Seluruh layer WebGIS dan angka evaluasi model sekarang berasal dari hasil ekspor Google Earth
Engine yang sesungguhnya (`results/`), bukan data contoh lagi.

| Komponen | Sumber | Catatan |
|---|---|---|
| Batas kota & kecamatan | Shapefile GADM level-4, 50 kelurahan | Asli |
| Ground truth | `GroundTruth_Mataram.csv` (GEE export) | 640 titik, seimbang 160/kombinasi kelas×tahun |
| Training / testing | `Training_Data.csv`, `Testing_Data.csv` | 380 / 260, split 60:40, seed 12345 |
| Confusion matrix & APRF | `Confusion_Matrix.geojson` (GEE export) | n=198 (titik testing yang jatuh di piksel valid) |
| Target 2024 / 2025 | Divectorize lokal dari `RF_2024.tif` / `RF_2025.tif` | Di-mask ke batas kota asli, MMU ±0,2 ha |
| Gain / Loss | Divectorize dari raster klasifikasi tersieve (konsisten dg target) | Net change tervalidasi silang dengan target 2025−2024 |

### Hasil Utama

- Vegetasi 2024: **2.580,85 ha (42,89%)** dari luas kota
- Vegetasi 2025: **2.527,71 ha (42,01%)**
- Net change: **−53,14 ha (−2,06%)** — loss (189,1 ha) lebih besar dari gain (135,96 ha)
- Akurasi model: **98,5%**, Precision 98,1%, Recall 99,0%, F1 98,6%, Kappa 0,97
- Loss tertinggi: **Sekarbela** (±33 ha); Gain tertinggi: **Selaparang** (±31 ha)

### Catatan metodologis (penting untuk laporan)

- Gain/Loss dari Google Earth Engine awalnya mengandung banyak poligon 1 piksel (noise
  "salt-and-pepper" khas klasifikasi per-piksel). Untuk laporan ini diterapkan **sieve filter
  (minimum mapping unit ±0,2 ha / 20 piksel)** secara konsisten pada raster 2024 dan 2025
  sebelum dihitung luas maupun divectorize — sesuai instruksi soal "hilangkan patch sangat kecil,
  sederhanakan geometry". Ini juga alasan angka gain/loha di WebGIS sedikit berbeda dari total
  mentah `Gain_Vegetasi.shp`/`Loss_Vegetasi.shp` hasil ekspor GEE — silakan jelaskan pilihan MMU
  ini di laporan akhir sebagai bagian dari transparansi metode.
- Validasi silang: `luas gain − luas loss = 135,96 − 189,1 = −53,14 ha`, sama persis dengan
  `luas target 2025 − luas target 2024`. Ini mengonfirmasi seluruh perhitungan konsisten.

Tab "Data & Proses" menampilkan `gee/main_script.js` (disalin ke `webgis/assets/main_script.js`
agar bisa di-fetch browser) dalam panel mirip code editor. Klik salah satu tahap di diagram alur
untuk scroll & menyorot baris kode yang sesuai. Kalau kamu mengedit `gee/main_script.js`, jangan
lupa salin ulang ke `webgis/assets/main_script.js` dan sesuaikan `data-start`/`data-end` di HTML
kalau nomor barisnya berubah.

## Struktur Folder

```
.
├── README.md
├── gee/
│   ├── main_script_part1-6.js     # script asli: preprocessing → ground truth → RF → evaluasi
│   └── gee_part7_export.js        # tambahan: change map, vectorize, export GeoJSON & raster
├── webgis/
│   ├── index.html                 # WebGIS 4-tab (Peta Hasil, Data & Proses, Evaluasi, Insight)
│   └── data/                      # GeoJSON & JSON yang dipakai WebGIS
├── data/                          # data sumber (shapefile batas Kota Mataram)
├── results/                       # raster klasifikasi, confusion matrix, luas — isi setelah export GEE
└── report/                        # laporan akhir PDF (5–8 halaman)
```

## Metodologi Singkat

| Parameter | Nilai |
|---|---|
| Koleksi citra | COPERNICUS/S2_SR_HARMONIZED |
| Cloud mask | QA60 bitmask, ambang CLOUDY_PIXEL_PERCENTAGE < 20 |
| Komposit | Median, per tahun |
| Band & indeks | B2, B3, B4, B8, B11, B12, NDVI, NDMI |
| Split | 70:30 per kombinasi kelas × tahun, seed = 12345 |
| Model | Random Forest, 640 trees, bagFraction 0.7 |

## Tautan

- Repository: `<isi>`
- WebGIS: `<isi>`
- Laporan akhir (PDF): `report/laporan_akhir.pdf`

## Kontribusi Anggota

| Nama | Kontribusi |
|---|---|
| Rega | WebGIS (integrasi seluruh hasil GEE ke peta interaktif) |
| Nabila | *isi* |
| Adrian | *isi* |
| Femas | *isi* |
| Abi | *isi* |

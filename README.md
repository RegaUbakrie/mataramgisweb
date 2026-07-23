# Analisis Perubahan Vegetasi Kota Mataram 2024–2025

> Pemetaan perubahan tutupan vegetasi Kota Mataram menggunakan citra Sentinel-2,
> klasifikasi Random Forest di Google Earth Engine, dan WebGIS interaktif berbasis Leaflet.

**Kapita Selekta & Maha Data** · Sistem Informasi, Universitas Bakrie · Semester 6 TA 2025/2026
Dosen Pengampu: Zakiul Fahmi Jailani, S.Kom., M.Sc.

🌍 **[Buka WebGIS](#)** &nbsp;·&nbsp; 📄 **[Laporan Akhir (PDF)](report/)**

---

## Daftar Isi

- [Sekilas Hasil](#sekilas-hasil)
- [Anggota Kelompok](#anggota-kelompok)
- [Tentang Proyek](#tentang-proyek)
- [Cara Membuka WebGIS](#cara-membuka-webgis)
- [Struktur Folder](#struktur-folder)
- [Kamus Data](#kamus-data)
- [Metodologi](#metodologi)
- [Hasil dan Evaluasi](#hasil-dan-evaluasi)
- [Catatan Metodologis](#catatan-metodologis)
- [Reproduksi](#reproduksi)
- [Kontribusi Anggota](#kontribusi-anggota)

---

## Sekilas Hasil

| | |
|---|---|
| 🌳 **Vegetasi 2024** | 2.667,01 ha |
| 🌱 **Vegetasi 2025** | 2.591,33 ha |
| 📉 **Net change** | **−75,69 ha (−2,84%)** |
| 🎯 **Akurasi model** | 95,77% (Kappa 0,9155) |

Tutupan vegetasi Kota Mataram **menyusut** selama 2024–2025. Kehilangan vegetasi (211,14 ha)
melampaui penambahannya (135,45 ha).

---

## Anggota Kelompok

| Nama | NIM | Peran Utama |
|---|---|---|
| Fari Habiba | 1232002082 | Wilayah studi & pra-pemrosesan citra |
| Femas Alfa Rezel | 1232002048 | Feature stack & ground truth |
| Nabila Khairun Nisa | 1232002061 | Pelatihan & evaluasi model |
| Muhammad Adriansyah | 1232002027 | Klasifikasi & change detection |
| Rega Saputra | 1232002070 | WebGIS & visualisasi hasil |

Rincian kontribusi ada di [bagian akhir](#kontribusi-anggota).

---

## Tentang Proyek

| | |
|---|---|
| **Kota** | Kota Mataram, Nusa Tenggara Barat |
| **Objek analisis** | Tutupan vegetasi dan non-vegetasi |
| **Periode** | 2024 dan 2025 |

Kota Mataram adalah pusat pemerintahan, perdagangan, dan pendidikan di NTB. Pembangunan kawasan
perkotaan yang terus berjalan berpotensi menekan luas ruang terbuka hijau. Proyek ini menjawab
tiga pertanyaan:

1. Berapa luas tutupan vegetasi Kota Mataram pada 2024 dan 2025?
2. Di mana penambahan (*gain*) dan kehilangan (*loss*) vegetasi terjadi?
3. Seberapa dapat dipercaya hasil klasifikasinya?

Hasilnya disajikan sebagai peta interaktif empat tab: **Peta Hasil**, **Data & Proses**,
**Evaluasi Model**, dan **Insight Hasil**.

---

## Cara Membuka WebGIS

### Online

Kunjungi 👉 `<isi tautan GitHub Pages di sini>`

### Lokal

WebGIS memuat GeoJSON lewat `fetch()`, jadi **tidak bisa dibuka dengan klik dua kali pada
`index.html`** — browser memblokirnya karena aturan CORS pada protokol `file://`. Jalankan
server statis dari **root repository**:

```bash
git clone https://github.com/<username>/<nama-repo>.git
cd <nama-repo>
python3 -m http.server 8080
```

Buka `http://localhost:8080/webgis/` di browser.

<details>
<summary>Alternatif tanpa Python</summary>

```bash
npx serve .          # Node.js
php -S localhost:8080   # PHP
```
</details>

> ⚠️ Server harus dijalankan dari **root repository**, bukan dari dalam folder `webgis/`.
> WebGIS mengambil data lewat path relatif `../data/`, sehingga folder `data/` harus ikut terlayani.

---

## Struktur Folder

```
.
├── README.md
│
├── gee/
│   └── vegetation_change_mataram.js   ← script GEE lengkap, satu berkas
│
├── data/                             ← DATA MASUKAN
│   ├── raw/
│   │   ├── mataramm.{shp,shx,dbf,prj,cpg,qmd}
│   │   └── ground_truth_mataram_2024_2025.csv
│   ├── batas_kota.geojson
│   ├── kecamatan.geojson
│   ├── ground_truth.geojson
│   ├── vegetasi_2024.geojson
│   ├── vegetasi_2025.geojson
│   ├── gain_vegetasi.geojson
│   ├── loss_vegetasi.geojson
│   ├── kecamatan_summary.json
│   └── stats.json
│
├── results/                          ← KELUARAN MODEL
│   ├── raster/
│   │   ├── Klasifikasi_Vegetasi_Mataram_2024.tif
│   │   ├── Klasifikasi_Vegetasi_Mataram_2025.tif
│   │   └── Change_Vegetasi_Mataram_2024_2025.tif
│   ├── confusion_matrix.csv
│   ├── metrik_evaluasi_aprf.csv
│   ├── ringkasan_perubahan_vegetasi.csv
│   ├── distribusi_data.csv
│   └── Summary_Statistik_Mataram_2024_2025.csv
│
├── webgis/
│   ├── index.html
│   └── assets/
│       ├── leaflet.css · leaflet.js
│       ├── gee_script_source.js      ← salinan script GEE untuk tab "Data & Proses"
│       └── logo-mataram.png
│
└── report/
    └── Laporan_Akhir_Kelompok.pdf
```

**Prinsip pemisahan:** `data/` berisi apa pun yang masuk ke model, `results/` berisi apa pun yang
keluar dari model. Ground truth termasuk data masukan, karena itu berada di `data/raw/`.

---

## Kamus Data

### `data/raw/ground_truth_mataram_2024_2025.csv`

Titik sampel hasil interpretasi visual manual di GEE Code Editor. Berkas inilah yang diunggah ke
GEE Assets sebagai tabel dan menjadi masukan pelatihan model.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `latitude` | float | Lintang titik sampel, WGS 84 (EPSG:4326) |
| `longitude` | float | Bujur titik sampel, WGS 84 (EPSG:4326) |
| `class` | integer | `0` = non-vegetasi, `1` = vegetasi |
| `year` | integer | `2024` atau `2025` |

**640 titik**, tersebar seimbang — 160 titik untuk setiap kombinasi kelas × tahun:

| | Non-Vegetasi | Vegetasi | Total |
|---|---:|---:|---:|
| **2024** | 160 | 160 | 320 |
| **2025** | 160 | 160 | 320 |
| **Total** | 320 | 320 | **640** |

> 💡 Saat mengunggah CSV ini ke GEE Assets, pilih **Table upload** lalu tentukan
> `longitude` sebagai kolom X dan `latitude` sebagai kolom Y.

### Atribut GeoJSON hasil vektorisasi

Berlaku untuk `vegetasi_2024`, `vegetasi_2025`, `gain_vegetasi`, dan `loss_vegetasi`.

| Atribut | Keterangan |
|---|---|
| `kategori` | `vegetasi`, `gain`, atau `loss` |
| `tahun` | Tahun rujukan poligon |
| `area_ha` | Luas poligon dalam hektar |

### Berkas hasil di `results/`

| Berkas | Isi |
|---|---|
| `confusion_matrix.csv` | Matriks konfusi 2×2 (TN, FP, FN, TP) |
| `metrik_evaluasi_aprf.csv` | Accuracy, Precision, Recall, F1-Score, Kappa |
| `ringkasan_perubahan_vegetasi.csv` | Luas dan persentase per kategori perubahan |
| `distribusi_data.csv` | Sebaran ground truth dan pembagian train/test |
| `Summary_Statistik_...csv` | Seluruh parameter dan hasil dalam satu baris |

---

## Metodologi

### 1 · Pra-pemrosesan

| Parameter | Nilai |
|---|---|
| Koleksi citra | `COPERNICUS/S2_SR_HARMONIZED` |
| Periode | Januari–Desember, masing-masing tahun |
| Filter awan | `CLOUDY_PIXEL_PERCENTAGE < 20` |
| Cloud masking | Scene Classification Layer — kelas 3, 8, 9, 10, 11 dibuang |
| Koreksi reflektansi | Nilai piksel ÷ 10.000 |
| Komposit | Median per tahun |
| Resolusi | 10 meter |
| Proyeksi keluaran | EPSG:32750 (UTM 50S) |

### 2 · Feature Stack

Delapan variabel masukan:

- **Band spektral** — B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR-1), B12 (SWIR-2)
- **Indeks** — NDVI untuk kehijauan vegetasi, NDMI untuk kelembapan vegetasi

### 3 · Klasifikasi

| Parameter | Nilai |
|---|---|
| Algoritma | Random Forest (`smileRandomForest`) |
| Jumlah pohon | 100 |
| `bagFraction` | 0,7 |
| `minLeafPopulation` | 1 |
| Seed | 12345 |
| Pembagian data | 70% training (427 titik) : 30% testing (213 titik) |

Pembagian train/test dilakukan **terpisah untuk setiap kombinasi kelas × tahun** sebelum digabung,
sehingga keseimbangan kelas dan sebaran antar tahun tetap terjaga di kedua subset. Sampel 2024 dan
2025 dilatih pada satu model yang sama, lalu diterapkan ke citra kedua tahun.

Seluruh proses acak dikunci dengan `seed = 12345` agar dapat direproduksi.

### 4 · Change Detection

Metode *post-classification comparison*. Kedua peta biner dikombinasikan jadi satu raster
empat kategori:

```
change = (klasifikasi_2024 × 2) + klasifikasi_2025
```

| Nilai | Kategori | Warna |
|:---:|---|---|
| `0` | Tetap non-vegetasi | 🟥 `#d73027` |
| `1` | **Gain** — penambahan vegetasi | 🩷 `#ffc0cb` |
| `2` | **Loss** — kehilangan vegetasi | 🟧 `#fdae61` |
| `3` | Tetap vegetasi | 🟩 `#006837` |

---

## Hasil dan Evaluasi

### Confusion Matrix

Diuji pada 213 titik testing yang tidak pernah dilihat model selama pelatihan.

| Kelas Aktual | Prediksi Non-Vegetasi | Prediksi Vegetasi |
|---|---:|---:|
| **Non-Vegetasi (0)** | **102** ✅ | 6 ❌ |
| **Vegetasi (1)** | 3 ❌ | **102** ✅ |

### Metrik APRF

| Metrik | Nilai | Persentase |
|---|---:|---:|
| Overall Accuracy | 0,9577 | **95,77%** |
| Precision | 0,9444 | 94,44% |
| Recall | 0,9714 | 97,14% |
| F1-Score | 0,9577 | 95,77% |
| Kappa | 0,9155 | 91,55% |

Recall lebih tinggi dari precision — model jarang melewatkan area vegetasi yang sebenarnya (hanya
3 *false negative*), meski sesekali menandai non-vegetasi sebagai vegetasi (6 *false positive*).
Untuk pemantauan ruang terbuka hijau, kecenderungan ini relatif aman.

### Perubahan Luas Vegetasi

| Kategori | Luas (ha) |
|---|---:|
| Vegetasi 2024 | 2.667,01 |
| Vegetasi 2025 | 2.591,33 |
| Gain — penambahan | 135,45 |
| Loss — kehilangan | 211,14 |
| **Net change** | **−75,69** |

Vegetasi berkurang **75,69 ha atau 2,84%**. Perubahan terkonsentrasi di area peralihan antara
kawasan terbangun dan lahan terbuka.

> ✅ **Validasi silang:** `gain − loss = 135,45 − 211,14 = −75,69 ha`, identik dengan
> `vegetasi 2025 − vegetasi 2024`. Konsistensi ini mengonfirmasi bahwa perhitungan luas dan peta
> perubahan berasal dari raster yang sama.

---

## Catatan Metodologis

### Luas dihitung dari raster, poligon difilter untuk tampilan

Seluruh angka luas dihitung langsung dari raster klasifikasi 10 m menggunakan
`ee.Image.pixelArea()` dengan *grouped reducer*, tanpa penyaringan apa pun. Poligon GeoJSON yang
ditampilkan di WebGIS melewati dua tahap pembersihan tambahan:

- **Minimum mapping unit 0,05 ha** (500 m² ≈ 5 piksel) — membuang *patch* satu-dua piksel yang
  merupakan derau *salt-and-pepper* khas klasifikasi per-piksel
- **Simplifikasi geometri toleransi 10 m** — mengurangi jumlah simpul agar peta ringan dibuka

Konsekuensinya, menjumlahkan atribut `area_ha` seluruh poligon akan menghasilkan angka sedikit
lebih kecil daripada luas resmi di tabel. Ini disengaja: tabel melaporkan hasil analisis, GeoJSON
dioptimalkan untuk visualisasi.

### Keterbatasan

Ground truth disusun lewat interpretasi visual tanpa validasi lapangan. Klasifikasi hanya dua
kelas, sehingga belum merinci jenis tutupan lahan. Rentang dua tahun juga terlalu pendek untuk
menyimpulkan tren jangka panjang — hasil ini lebih tepat dibaca sebagai potret perubahan, bukan
proyeksi.

---

## Reproduksi

**1.** Buka [GEE Code Editor](https://code.earthengine.google.com/)

**2.** Unggah dua aset ke **GEE Assets**:

| Berkas | Tipe upload | Catatan |
|---|---|---|
| `data/raw/mataramm.shp` (+ file pendamping) | Shape files | Batas AOI |
| `data/raw/ground_truth_mataram_2024_2025.csv` | CSV file | X = `longitude`, Y = `latitude` |

**3.** Sesuaikan path aset di bagian konfigurasi `gee/vegetation_change_mataram.js`:

```javascript
var mataram     = ee.FeatureCollection("projects/<project-id>/assets/mataramm");
var groundTruth = ee.FeatureCollection("projects/<project-id>/assets/ground_truth_mataram_2024_2025");
```

**4.** Jalankan script, lalu eksekusi seluruh task di tab **Tasks**

**5.** Unduh hasil dari Google Drive folder `GEE_Output`, tempatkan sesuai
[struktur folder](#struktur-folder)

---

## Tautan

| Berkas | Tautan |
|---|---|
| WebGIS | `<isi tautan GitHub Pages>` |
| Laporan akhir (PDF) | [`report/Laporan_Akhir_Kelompok.pdf`](report/) |
| Raster GeoTIFF | `<isi tautan unduhan bila melebihi batas ukuran GitHub>` |

---

## Kontribusi Anggota

| Anggota | Kontribusi |
|---|---|
| **Fari Habiba** | Penentuan wilayah studi dan objek penelitian, penyiapan boundary Kota Mataram, akuisisi dan pra-pemrosesan citra Sentinel-2 (cloud masking SCL, komposit median, pemotongan AOI) |
| **Femas Alfa Rezel** | Penyiapan band spektral, perhitungan NDVI dan NDMI, penyusunan feature stack, pembuatan 640 titik ground truth untuk dua kelas dan dua tahun |
| **Nabila Khairun Nisa** | Ekstraksi sampel dari feature stack, pembagian training–testing 70:30 per kombinasi kelas–tahun, pelatihan model Random Forest, evaluasi model (confusion matrix, APRF, Kappa) |
| **Muhammad Adriansyah** | Klasifikasi vegetasi 2024 dan 2025, pembuatan peta perubahan empat kategori, perhitungan luas gain, loss, dan net change |
| **Rega Saputra** | Pengembangan WebGIS interaktif: layer, legenda, popup, dashboard evaluasi model, breakdown per kecamatan, serta visualisasi dan interpretasi hasil |

---

<sub>Google Earth Engine · Sentinel-2 · Random Forest · Leaflet 1.9 · HTML/CSS/JavaScript · QGIS</sub>
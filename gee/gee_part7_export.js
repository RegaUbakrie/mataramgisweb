//==============================================================
// PART 7 (TAMBAHAN — belum ada di script asli)
// CHANGE MAP 4 KONDISI + VECTORIZE + EXPORT GEOJSON
//
// Cara pakai:
// 1. Tempel blok ini di BAWAH kode Part 6 (Model Evaluation) yang sudah ada.
// 2. Jalankan script di GEE Code Editor.
// 3. Buka tab "Tasks" di kanan atas, klik RUN pada tiap task export
//    (targetVeg2024, targetVeg2025, gainMataram, lossMataram).
// 4. Hasilnya masuk ke Google Drive folder "WebGIS_Mataram" sebagai .geojson.
// 5. Download 4 file itu, lalu GANTI file dengan nama sama di folder
//    webgis-mataram/data/ pada proyek WebGIS ini (nama file harus persis:
//    target_2024.geojson, target_2025.geojson, gain.geojson, loss.geojson).
//    Struktur/format sudah kompatibel, tidak perlu ubah kode web sama sekali.
//==============================================================


//==============================================================
// 1. LUAS PER KELAS (dalam hektar) — dipakai di Tab 1 & Tab 4
//==============================================================

var pixelArea = ee.Image.pixelArea().divide(10000); // m2 -> ha

var areaVeg2024 = classified2024.eq(1).multiply(pixelArea).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: mataram.geometry(),
  scale: 10,
  maxPixels: 1e13
});

var areaVeg2025 = classified2025.eq(1).multiply(pixelArea).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: mataram.geometry(),
  scale: 10,
  maxPixels: 1e13
});

print("Luas Vegetasi 2024 (ha)", areaVeg2024);
print("Luas Vegetasi 2025 (ha)", areaVeg2025);


//==============================================================
// 2. CHANGE MAP — 4 KONDISI
// kode: 0 = tetap nonveg, 1 = gain, 2 = loss, 3 = tetap veg
//==============================================================

var changeMap = classified2024.multiply(2).add(classified2025).rename('change');
// 0 -> (0*2+0)=0 tetap nonveg
// 1 -> (0*2+1)=1 gain (2024 nonveg, 2025 veg)
// 2 -> (1*2+0)=2 loss (2024 veg, 2025 nonveg)
// 3 -> (1*2+1)=3 tetap veg

var changeVis = {
  min: 0, max: 3,
  palette: ['b9b6a4', 'c99a3d', 'a8452e', '2f6b4f']
};
Map.addLayer(changeMap.clip(mataram), changeVis, 'Change Map 4 Kondisi');


//==============================================================
// 3. LUAS GAIN / LOSS / NET CHANGE
//==============================================================

var areaGain = changeMap.eq(1).multiply(pixelArea).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: mataram.geometry(), scale: 10, maxPixels: 1e13
});
var areaLoss = changeMap.eq(2).multiply(pixelArea).reduceRegion({
  reducer: ee.Reducer.sum(), geometry: mataram.geometry(), scale: 10, maxPixels: 1e13
});

print("Luas Gain (ha)", areaGain);
print("Luas Loss (ha)", areaLoss);
// Net change = Luas Vegetasi 2025 - Luas Vegetasi 2024 (hitung manual dari 2 print di atas)
// Persentase perubahan = Net change / Luas Vegetasi 2024 * 100


//==============================================================
// 4. VECTORIZE — SIAP UNTUK WEBGIS
//==============================================================

// Target 2024
var targetVeg2024 = classified2024.eq(1).selfMask().reduceToVectors({
  geometry: mataram.geometry(),
  scale: 10,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'kategori',
  reducer: ee.Reducer.countEvery(),
  maxPixels: 1e13
}).map(function(f){ return f.set('kategori', 'target_2024'); });

// Target 2025
var targetVeg2025 = classified2025.eq(1).selfMask().reduceToVectors({
  geometry: mataram.geometry(),
  scale: 10,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'kategori',
  reducer: ee.Reducer.countEvery(),
  maxPixels: 1e13
}).map(function(f){ return f.set('kategori', 'target_2025'); });

// Gain (0 -> 1)
var gainMataram = changeMap.eq(1).selfMask().reduceToVectors({
  geometry: mataram.geometry(),
  scale: 10,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'kategori',
  reducer: ee.Reducer.countEvery(),
  maxPixels: 1e13
}).map(function(f){ return f.set('kategori', 'gain'); });

// Loss (1 -> 0)
var lossMataram = changeMap.eq(2).selfMask().reduceToVectors({
  geometry: mataram.geometry(),
  scale: 10,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'kategori',
  reducer: ee.Reducer.countEvery(),
  maxPixels: 1e13
}).map(function(f){ return f.set('kategori', 'loss'); });

// OPSIONAL: buang patch sangat kecil (< 100 m2) sebelum export
function filterKecil(fc){
  return fc.filter(ee.Filter.gt('count', 1)); // sesuaikan ambang sesuai kebutuhan
}


//==============================================================
// 5. EXPORT KE GOOGLE DRIVE (format GeoJSON)
//==============================================================

Export.table.toDrive({
  collection: targetVeg2024,
  description: 'target_2024',
  folder: 'WebGIS_Mataram',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: targetVeg2025,
  description: 'target_2025',
  folder: 'WebGIS_Mataram',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: gainMataram,
  description: 'gain',
  folder: 'WebGIS_Mataram',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: lossMataram,
  description: 'loss',
  folder: 'WebGIS_Mataram',
  fileFormat: 'GeoJSON'
});

//==============================================================
// 6. EXPORT RASTER KLASIFIKASI (opsional, untuk lampiran laporan)
//==============================================================

Export.image.toDrive({
  image: classified2024.clip(mataram),
  description: 'raster_klasifikasi_2024',
  folder: 'WebGIS_Mataram',
  scale: 10,
  region: mataram.geometry(),
  maxPixels: 1e13
});

Export.image.toDrive({
  image: classified2025.clip(mataram),
  description: 'raster_klasifikasi_2025',
  folder: 'WebGIS_Mataram',
  scale: 10,
  region: mataram.geometry(),
  maxPixels: 1e13
});

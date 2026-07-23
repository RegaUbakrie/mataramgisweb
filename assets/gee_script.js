// ANALISIS PERUBAHAN VEGETASI KOTA MATARAM 2024 vs 2025

// # Konfigurasi
var seed = 12345;
var splitRatio = 0.7;
var numberOfTrees = 100;
var scale = 10;
var maxCloud = 20;

var bands = ["B2", "B3", "B4", "B8", "B11", "B12", "NDVI", "NDMI"];

var mataram = ee.FeatureCollection("projects/uas-kel3-gee/assets/mataramm");

var groundTruth = ee.FeatureCollection(
  "projects/uas-kel3-gee/assets/ground_truth_mataram_2024_2025",
);

Map.centerObject(mataram, 11);
Map.addLayer(mataram, { color: "red" }, "Batas Kota Mataram");

var luasKota = ee.Number(mataram.geometry().area()).divide(10000);
print("Luas Kota Mataram (Ha)", luasKota);

// # Preprocessing Sentinel-2
function maskS2(image) {
  var scl = image.select("SCL");

  var mask = scl
    .neq(3) // cloud shadow
    .and(scl.neq(8)) // medium probability cloud
    .and(scl.neq(9)) // high probability cloud
    .and(scl.neq(10)) // cirrus
    .and(scl.neq(11)); // snow/ice

  return image
    .updateMask(mask)
    .divide(10000)
    .copyProperties(image, ["system:time_start"]);
}

function addIndices(image) {
  var ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI");
  var ndmi = image.normalizedDifference(["B8", "B11"]).rename("NDMI");
  return image.addBands([ndvi, ndmi]);
}

// Catatan: tanggal akhir bersifat eksklusif pada GEE,
// sehingga rentang berikut mencakup satu tahun penuh.
var col2024 = ee
  .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(mataram)
  .filterDate("2024-01-01", "2025-01-01")
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", maxCloud))
  .map(maskS2);

var col2025 = ee
  .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
  .filterBounds(mataram)
  .filterDate("2025-01-01", "2026-01-01")
  .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", maxCloud))
  .map(maskS2);

print("Jumlah Citra 2024", col2024.size());
print("Jumlah Citra 2025", col2025.size());

var composite2024 = col2024.median().clip(mataram);
var composite2025 = col2025.median().clip(mataram);

print("Composite 2024", composite2024);
print("Composite 2025", composite2025);

var rgbVis = { bands: ["B4", "B3", "B2"], min: 0, max: 0.3 };
var falseColorVis = { bands: ["B8", "B4", "B3"], min: 0, max: 0.3 };

Map.addLayer(composite2024, rgbVis, "RGB 2024");
Map.addLayer(composite2025, rgbVis, "RGB 2025");
Map.addLayer(composite2024, falseColorVis, "False Color 2024", false);
Map.addLayer(composite2025, falseColorVis, "False Color 2025", false);

// # Feature stack
var image2024 = addIndices(composite2024);
var image2025 = addIndices(composite2025);

var feature2024 = image2024.select(bands);
var feature2025 = image2025.select(bands);

print("Feature Bands", bands);
print("Feature Stack 2024", feature2024);
print("Feature Stack 2025", feature2025);

var ndviVis = {
  min: -1,
  max: 1,
  palette: [
    "red",
    "orange",
    "yellow",
    "white",
    "lightgreen",
    "green",
    "darkgreen",
  ],
};
var ndmiVis = {
  min: -1,
  max: 1,
  palette: ["brown", "orange", "yellow", "white", "cyan", "blue", "darkblue"],
};

Map.addLayer(feature2024.select("NDVI"), ndviVis, "NDVI 2024", false);
Map.addLayer(feature2025.select("NDVI"), ndviVis, "NDVI 2025", false);
Map.addLayer(feature2024.select("NDMI"), ndmiVis, "NDMI 2024", false);
Map.addLayer(feature2025.select("NDMI"), ndmiVis, "NDMI 2025", false);

// # Ground truth
groundTruth = groundTruth.map(function (feature) {
  return feature.set({
    class: ee.Number.parse(ee.String(feature.get("class"))),
    year: ee.Number.parse(ee.String(feature.get("year"))),
  });
});

print("Ground Truth", groundTruth);
print("Total Titik Ground Truth", groundTruth.size());

var gtVeg2024 = groundTruth.filter(
  ee.Filter.and(ee.Filter.eq("class", 1), ee.Filter.eq("year", 2024)),
);
var gtNonVeg2024 = groundTruth.filter(
  ee.Filter.and(ee.Filter.eq("class", 0), ee.Filter.eq("year", 2024)),
);
var gtVeg2025 = groundTruth.filter(
  ee.Filter.and(ee.Filter.eq("class", 1), ee.Filter.eq("year", 2025)),
);
var gtNonVeg2025 = groundTruth.filter(
  ee.Filter.and(ee.Filter.eq("class", 0), ee.Filter.eq("year", 2025)),
);

print("Vegetasi 2024", gtVeg2024.size());
print("Nonvegetasi 2024", gtNonVeg2024.size());
print("Vegetasi 2025", gtVeg2025.size());
print("Nonvegetasi 2025", gtNonVeg2025.size());

Map.addLayer(gtVeg2024, { color: "00FF00" }, "Vegetasi 2024 (GT)");
Map.addLayer(gtNonVeg2024, { color: "FF0000" }, "Nonvegetasi 2024 (GT)");
Map.addLayer(gtVeg2025, { color: "006400" }, "Vegetasi 2025 (GT)");
Map.addLayer(gtNonVeg2025, { color: "FFA500" }, "Nonvegetasi 2025 (GT)");

// # Split 70:30 per tahun dan kelas
function splitCollection(collection, randomColumnName) {
  var withRandom = collection.randomColumn(randomColumnName, seed);

  var train = withRandom.filter(ee.Filter.lt(randomColumnName, splitRatio));
  var test = withRandom.filter(ee.Filter.gte(randomColumnName, splitRatio));

  return { train: train, test: test };
}

var splitVeg2024 = splitCollection(gtVeg2024, "random_v24");
var splitNonVeg2024 = splitCollection(gtNonVeg2024, "random_n24");
var splitVeg2025 = splitCollection(gtVeg2025, "random_v25");
var splitNonVeg2025 = splitCollection(gtNonVeg2025, "random_n25");

var training = splitVeg2024.train
  .merge(splitNonVeg2024.train)
  .merge(splitVeg2025.train)
  .merge(splitNonVeg2025.train);

var testing = splitVeg2024.test
  .merge(splitNonVeg2024.test)
  .merge(splitVeg2025.test)
  .merge(splitNonVeg2025.test);

print("Split Training", "70%");
print("Split Testing", "30%");
print("Jumlah Training", training.size());
print("Jumlah Testing", testing.size());
print("Training per Kelas", training.aggregate_histogram("class"));
print("Testing per Kelas", testing.aggregate_histogram("class"));
print("Training per Tahun", training.aggregate_histogram("year"));
print("Testing per Tahun", testing.aggregate_histogram("year"));

Map.addLayer(training, { color: "00FF00" }, "Training 70%");
Map.addLayer(testing, { color: "FF0000" }, "Testing 30%");

// # Sampling fitur
var trainSample2024 = feature2024.sampleRegions({
  collection: training.filter(ee.Filter.eq("year", 2024)),
  properties: ["class"],
  scale: scale,
  geometries: true,
});

var trainSample2025 = feature2025.sampleRegions({
  collection: training.filter(ee.Filter.eq("year", 2025)),
  properties: ["class"],
  scale: scale,
  geometries: true,
});

var trainingData = trainSample2024.merge(trainSample2025);

print("Jumlah Training Data Valid", trainingData.size());

var testSample2024 = feature2024.sampleRegions({
  collection: testing.filter(ee.Filter.eq("year", 2024)),
  properties: ["class"],
  scale: scale,
  geometries: true,
});

var testSample2025 = feature2025.sampleRegions({
  collection: testing.filter(ee.Filter.eq("year", 2025)),
  properties: ["class"],
  scale: scale,
  geometries: true,
});

var testingData = testSample2024.merge(testSample2025);

print("Jumlah Testing Data Valid", testingData.size());

// # Training Random Forest
var rf = ee.Classifier.smileRandomForest({
  numberOfTrees: numberOfTrees,
  seed: seed,
  bagFraction: 0.7,
  minLeafPopulation: 1,
}).train({
  features: trainingData,
  classProperty: "class",
  inputProperties: bands,
});

print("Random Forest Model", rf);
print("Jumlah Trees", numberOfTrees);
print("Bands", bands);
print("Feature Importance", rf.explain());

var classVis = { min: 0, max: 1, palette: ["red", "green"] };

var classified2024 = feature2024
  .select(bands)
  .classify(rf)
  .rename("classification");
var classified2025 = feature2025
  .select(bands)
  .classify(rf)
  .rename("classification");

Map.addLayer(classified2024, classVis, "Klasifikasi Vegetasi 2024");
Map.addLayer(classified2025, classVis, "Klasifikasi Vegetasi 2025");

// # Evaluasi testing
var validation = testingData.classify(rf);

var confusionMatrix = validation.errorMatrix("class", "classification", [0, 1]);
var matrix = ee.Array(confusionMatrix.array());

var TN = ee.Number(matrix.get([0, 0]));
var FP = ee.Number(matrix.get([0, 1]));
var FN = ee.Number(matrix.get([1, 0]));
var TP = ee.Number(matrix.get([1, 1]));

var accuracy = confusionMatrix.accuracy();
var kappa = confusionMatrix.kappa();
var precision = TP.divide(TP.add(FP));
var recall = TP.divide(TP.add(FN));
var f1 = precision.multiply(recall).multiply(2).divide(precision.add(recall));

print("Confusion Matrix", confusionMatrix);
print("True Negative", TN);
print("False Positive", FP);
print("False Negative", FN);
print("True Positive", TP);
print("Accuracy", accuracy);
print("Precision", precision);
print("Recall", recall);
print("F1 Score", f1);
print("Kappa", kappa);

// # Change detection
var change = classified2024
  .multiply(2)
  .add(classified2025)
  .rename("Change")
  .toByte();

var changeVis = {
  min: 0,
  max: 3,
  palette: ["#d73027", "#ffc0cb", "#fdae61", "#006837"],
  // 0 = tetap nonvegetasi, 1 = gain, 2 = loss, 3 = tetap vegetasi
};

Map.addLayer(change, changeVis, "Change Map 2024-2025");

// # Legend panel untuk change map
var legend = ui.Panel({
  style: { position: "bottom-left", padding: "8px 12px" },
});

legend.add(
  ui.Label({
    value: "Change Detection 2024-2025",
    style: { fontWeight: "bold", fontSize: "13px", margin: "0 0 6px 0" },
  }),
);

function legendRow(color, label) {
  var box = ui.Label({
    style: {
      backgroundColor: color,
      padding: "8px",
      margin: "0 6px 4px 0",
    },
  });
  var desc = ui.Label({ value: label, style: { margin: "0 0 4px 0" } });
  return ui.Panel({
    widgets: [box, desc],
    layout: ui.Panel.Layout.Flow("horizontal"),
  });
}

legend.add(legendRow("#d73027", "Tetap Nonvegetasi"));
legend.add(legendRow("#ffc0cb", "Gain Vegetasi"));
legend.add(legendRow("#fdae61", "Loss Vegetasi"));
legend.add(legendRow("#006837", "Tetap Vegetasi"));

Map.add(legend);

// # Perhitungan luas (grouped reducer, satu kali)
var pixelAreaHa = ee.Image.pixelArea().divide(10000).rename("ha");

var areaByChange = pixelAreaHa.addBands(change).reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: "class",
  }),
  geometry: mataram.geometry(),
  scale: scale,
  maxPixels: 1e13,
  tileScale: 8,
});

print("Luas per Kelas Perubahan", areaByChange);

var groupsList = ee.List(areaByChange.get("groups"));

function getAreaByClass(classValue) {
  var filtered = groupsList
    .map(function (item) {
      item = ee.Dictionary(item);
      return ee.Algorithms.If(
        ee.Number(item.get("class")).eq(classValue),
        item.get("sum"),
        null,
      );
    })
    .removeAll([null]);

  return ee.Number(ee.Algorithms.If(filtered.size().gt(0), filtered.get(0), 0));
}

var stableNonVegHa = getAreaByClass(0);
var gainHa = getAreaByClass(1);
var lossHa = getAreaByClass(2);
var stableVegHa = getAreaByClass(3);

var vegetation2024Ha = lossHa.add(stableVegHa);
var vegetation2025Ha = gainHa.add(stableVegHa);

var persen2024 = vegetation2024Ha.divide(luasKota).multiply(100);
var persen2025 = vegetation2025Ha.divide(luasKota).multiply(100);

var netChange = vegetation2025Ha.subtract(vegetation2024Ha);
var percentChange = netChange.divide(vegetation2024Ha).multiply(100);

print("==============================");
print("HASIL ANALISIS VEGETASI");
print("==============================");
print("Luas Vegetasi 2024 (Ha)", vegetation2024Ha);
print("Luas Vegetasi 2025 (Ha)", vegetation2025Ha);
print("Persentase Vegetasi 2024 (%)", persen2024);
print("Persentase Vegetasi 2025 (%)", persen2025);
print("Tetap Nonvegetasi (Ha)", stableNonVegHa);
print("Gain Vegetasi (Ha)", gainHa);
print("Loss Vegetasi (Ha)", lossHa);
print("Tetap Vegetasi (Ha)", stableVegHa);
print("Net Change (Ha)", netChange);
print("Persentase Perubahan (%)", percentChange);
print("Validasi Gain - Loss", gainHa.subtract(lossHa));
print("==============================");

// # Chart perbandingan luas vegetasi 2024 vs 2025
var vegChartData = ee.FeatureCollection([
  ee.Feature(null, { tahun: "2024", luas: vegetation2024Ha }),
  ee.Feature(null, { tahun: "2025", luas: vegetation2025Ha }),
]);

var chartVegetasi = ui.Chart.feature
  .byFeature({
    features: vegChartData,
    xProperty: "tahun",
    yProperties: ["luas"],
  })
  .setChartType("ColumnChart")
  .setOptions({
    title: "Perbandingan Luas Vegetasi 2024 vs 2025 (Ha)",
    hAxis: { title: "Tahun" },
    vAxis: { title: "Luas (Ha)" },
    colors: ["#006837"],
    legend: { position: "none" },
  });

print(chartVegetasi);

// # Line chart perubahan vegetasi (tren 2024 → 2025)
var lineChartData = ee.FeatureCollection([
  ee.Feature(null, { tahun: 2024, Area_Ha: vegetation2024Ha }),
  ee.Feature(null, { tahun: 2025, Area_Ha: vegetation2025Ha }),
]);

var chartLineVegetasi = ui.Chart.feature
  .byFeature({
    features: lineChartData,
    xProperty: "tahun",
    yProperties: ["Area_Ha"],
  })
  .setChartType("LineChart")
  .setOptions({
    title: "Perubahan Vegetasi",
    hAxis: { title: "Tahun", format: "####" },
    vAxis: { title: "Luas (Ha)" },
    lineWidth: 3,
    pointSize: 6,
    colors: ["#1f77b4"],
  });

print(chartLineVegetasi);

// # Chart breakdown kategori perubahan
var changeChartData = ee.FeatureCollection([
  ee.Feature(null, { kategori: "1. Tetap Nonvegetasi", luas: stableNonVegHa }),
  ee.Feature(null, { kategori: "2. Gain", luas: gainHa }),
  ee.Feature(null, { kategori: "3. Loss", luas: lossHa }),
  ee.Feature(null, { kategori: "4. Tetap Vegetasi", luas: stableVegHa }),
]);

var chartPerubahan = ui.Chart.feature
  .byFeature({
    features: changeChartData,
    xProperty: "kategori",
    yProperties: ["luas"],
  })
  .setChartType("ColumnChart")
  .setOptions({
    title: "Kategori Perubahan Vegetasi 2024-2025 (Ha)",
    hAxis: { title: "Kategori" },
    vAxis: { title: "Luas (Ha)" },
    colors: ["#d73027"],
    legend: { position: "none" },
  });

print(chartPerubahan);

// # Summary
var summary = ee.Feature(null, {
  Wilayah: "Kota Mataram",
  Tahun_Awal: 2024,
  Tahun_Akhir: 2025,
  Jumlah_Training: trainingData.size(),
  Jumlah_Testing: testingData.size(),
  Jumlah_Trees: numberOfTrees,
  Seed: seed,
  Luas_Kota_Ha: luasKota,
  Luas_Vegetasi_2024_Ha: vegetation2024Ha,
  Luas_Vegetasi_2025_Ha: vegetation2025Ha,
  Persentase_Vegetasi_2024: persen2024,
  Persentase_Vegetasi_2025: persen2025,
  Tetap_Nonvegetasi_Ha: stableNonVegHa,
  Gain_Ha: gainHa,
  Loss_Ha: lossHa,
  Tetap_Vegetasi_Ha: stableVegHa,
  Net_Change_Ha: netChange,
  Persentase_Perubahan: percentChange,
  TN: TN,
  FP: FP,
  FN: FN,
  TP: TP,
  Accuracy: accuracy,
  Precision: precision,
  Recall: recall,
  F1_Score: f1,
  Kappa: kappa,
});

print("Summary", summary);

// # Export raster dan CSV
Export.table.toDrive({
  collection: ee.FeatureCollection([summary]),
  description: "Summary_Statistik_Mataram_2024_2025",
  folder: "GEE_Output",
  fileNamePrefix: "Summary_Statistik_Mataram_2024_2025",
  fileFormat: "CSV",
});

// # Export CSV untuk folder results/ (repo GitHub)

// 1. Confusion Matrix — format tabel
var confusionMatrixCSV = ee.FeatureCollection([
  ee.Feature(null, {
    Kelas_Aktual: "Nonvegetasi (0)",
    Prediksi_Nonvegetasi: TN,
    Prediksi_Vegetasi: FP,
  }),
  ee.Feature(null, {
    Kelas_Aktual: "Vegetasi (1)",
    Prediksi_Nonvegetasi: FN,
    Prediksi_Vegetasi: TP,
  }),
]);

Export.table.toDrive({
  collection: confusionMatrixCSV,
  description: "Confusion_Matrix",
  folder: "GEE_Output",
  fileNamePrefix: "confusion_matrix",
  fileFormat: "CSV",
  selectors: ["Kelas_Aktual", "Prediksi_Nonvegetasi", "Prediksi_Vegetasi"],
});

// 2. Metrik Evaluasi APRF
var metrikAPRF = ee.FeatureCollection([
  ee.Feature(null, {
    Metrik: "Overall Accuracy",
    Nilai: accuracy,
    Persen: accuracy.multiply(100),
  }),
  ee.Feature(null, {
    Metrik: "Precision",
    Nilai: precision,
    Persen: precision.multiply(100),
  }),
  ee.Feature(null, {
    Metrik: "Recall",
    Nilai: recall,
    Persen: recall.multiply(100),
  }),
  ee.Feature(null, { Metrik: "F1-Score", Nilai: f1, Persen: f1.multiply(100) }),
  ee.Feature(null, {
    Metrik: "Kappa",
    Nilai: kappa,
    Persen: kappa.multiply(100),
  }),
]);

Export.table.toDrive({
  collection: metrikAPRF,
  description: "Metrik_Evaluasi_APRF",
  folder: "GEE_Output",
  fileNamePrefix: "metrik_evaluasi_aprf",
  fileFormat: "CSV",
  selectors: ["Metrik", "Nilai", "Persen"],
});

// 3. Ringkasan Luas & Perubahan Vegetasi
var ringkasanPerubahan = ee.FeatureCollection([
  ee.Feature(null, {
    Kategori: "Luas Kota Mataram",
    Luas_Ha: luasKota,
    Persen: ee.Number(100),
  }),
  ee.Feature(null, {
    Kategori: "Luas Vegetasi 2024",
    Luas_Ha: vegetation2024Ha,
    Persen: persen2024,
  }),
  ee.Feature(null, {
    Kategori: "Luas Vegetasi 2025",
    Luas_Ha: vegetation2025Ha,
    Persen: persen2025,
  }),
  ee.Feature(null, {
    Kategori: "Tetap Nonvegetasi",
    Luas_Ha: stableNonVegHa,
    Persen: stableNonVegHa.divide(luasKota).multiply(100),
  }),
  ee.Feature(null, {
    Kategori: "Gain Vegetasi",
    Luas_Ha: gainHa,
    Persen: gainHa.divide(luasKota).multiply(100),
  }),
  ee.Feature(null, {
    Kategori: "Loss Vegetasi",
    Luas_Ha: lossHa,
    Persen: lossHa.divide(luasKota).multiply(100),
  }),
  ee.Feature(null, {
    Kategori: "Tetap Vegetasi",
    Luas_Ha: stableVegHa,
    Persen: stableVegHa.divide(luasKota).multiply(100),
  }),
  ee.Feature(null, {
    Kategori: "Net Change",
    Luas_Ha: netChange,
    Persen: percentChange,
  }),
]);

Export.table.toDrive({
  collection: ringkasanPerubahan,
  description: "Ringkasan_Perubahan_Vegetasi",
  folder: "GEE_Output",
  fileNamePrefix: "ringkasan_perubahan_vegetasi",
  fileFormat: "CSV",
  selectors: ["Kategori", "Luas_Ha", "Persen"],
});

// 4. Distribusi Ground Truth & Split
var distribusiData = ee.FeatureCollection([
  ee.Feature(null, {
    Kategori: "Vegetasi 2024",
    Jumlah_Titik: gtVeg2024.size(),
  }),
  ee.Feature(null, {
    Kategori: "Nonvegetasi 2024",
    Jumlah_Titik: gtNonVeg2024.size(),
  }),
  ee.Feature(null, {
    Kategori: "Vegetasi 2025",
    Jumlah_Titik: gtVeg2025.size(),
  }),
  ee.Feature(null, {
    Kategori: "Nonvegetasi 2025",
    Jumlah_Titik: gtNonVeg2025.size(),
  }),
  ee.Feature(null, {
    Kategori: "Total Ground Truth",
    Jumlah_Titik: groundTruth.size(),
  }),
  ee.Feature(null, {
    Kategori: "Training (70%)",
    Jumlah_Titik: trainingData.size(),
  }),
  ee.Feature(null, {
    Kategori: "Testing (30%)",
    Jumlah_Titik: testingData.size(),
  }),
]);

Export.table.toDrive({
  collection: distribusiData,
  description: "Distribusi_Data",
  folder: "GEE_Output",
  fileNamePrefix: "distribusi_data",
  fileFormat: "CSV",
  selectors: ["Kategori", "Jumlah_Titik"],
});

Export.image.toDrive({
  image: classified2024,
  description: "Klasifikasi_Vegetasi_Mataram_2024",
  folder: "GEE_Output",
  region: mataram.geometry(),
  scale: scale,
  crs: "EPSG:32750",
  maxPixels: 1e13,
});

Export.image.toDrive({
  image: classified2025,
  description: "Klasifikasi_Vegetasi_Mataram_2025",
  folder: "GEE_Output",
  region: mataram.geometry(),
  scale: scale,
  crs: "EPSG:32750",
  maxPixels: 1e13,
});

Export.image.toDrive({
  image: change,
  description: "Change_Vegetasi_Mataram_2024_2025",
  folder: "GEE_Output",
  region: mataram.geometry(),
  scale: scale,
  crs: "EPSG:32750",
  maxPixels: 1e13,
});

//==============================================================
// # Export GeoJSON untuk WebGIS
//==============================================================

// Parameter pembersihan polygon
var minAreaHa = 0.05; // buang patch < 500 m² (5 piksel)
var simplifyTolerance = 10; // simplify 10 meter

// Fungsi bantu: raster biner -> polygon bersih
function rasterToPolygon(image, targetValue, kategori, tahun) {
  var mask = image.eq(targetValue).selfMask();

  var vectors = mask.reduceToVectors({
    geometry: mataram.geometry(),
    scale: scale,
    geometryType: "polygon",
    eightConnected: true,
    labelProperty: "label",
    reducer: ee.Reducer.countEvery(),
    maxPixels: 1e13,
  });

  vectors = vectors.map(function (f) {
    var geom = f.geometry().simplify(simplifyTolerance);
    var areaHa = geom.area(1).divide(10000);
    return ee.Feature(geom).set({
      kategori: kategori,
      tahun: tahun,
      area_ha: areaHa,
    });
  });

  vectors = vectors.filter(ee.Filter.gt("area_ha", minAreaHa));

  return vectors;
}

var vegetasi2024Poly = rasterToPolygon(classified2024, 1, "vegetasi", 2024);
var vegetasi2025Poly = rasterToPolygon(classified2025, 1, "vegetasi", 2025);
var gainPoly = rasterToPolygon(change, 1, "gain", 2025);
var lossPoly = rasterToPolygon(change, 2, "loss", 2024);

print("Jumlah Polygon Vegetasi 2024", vegetasi2024Poly.size());
print("Jumlah Polygon Vegetasi 2025", vegetasi2025Poly.size());
print("Jumlah Polygon Gain", gainPoly.size());
print("Jumlah Polygon Loss", lossPoly.size());

Map.addLayer(
  vegetasi2024Poly,
  { color: "00AA00" },
  "Vegetasi 2024 Poly",
  false,
);
Map.addLayer(
  vegetasi2025Poly,
  { color: "006400" },
  "Vegetasi 2025 Poly",
  false,
);
Map.addLayer(gainPoly, { color: "FFC0CB" }, "Gain Poly", false);
Map.addLayer(lossPoly, { color: "FDAE61" }, "Loss Poly", false);

Export.table.toDrive({
  collection: vegetasi2024Poly,
  description: "Vegetasi_Mataram_2024",
  folder: "GEE_Output",
  fileNamePrefix: "vegetasi_2024",
  fileFormat: "GeoJSON",
});

Export.table.toDrive({
  collection: vegetasi2025Poly,
  description: "Vegetasi_Mataram_2025",
  folder: "GEE_Output",
  fileNamePrefix: "vegetasi_2025",
  fileFormat: "GeoJSON",
});

Export.table.toDrive({
  collection: gainPoly,
  description: "Gain_Vegetasi_Mataram",
  folder: "GEE_Output",
  fileNamePrefix: "gain_vegetasi",
  fileFormat: "GeoJSON",
});

Export.table.toDrive({
  collection: lossPoly,
  description: "Loss_Vegetasi_Mataram",
  folder: "GEE_Output",
  fileNamePrefix: "loss_vegetasi",
  fileFormat: "GeoJSON",
});

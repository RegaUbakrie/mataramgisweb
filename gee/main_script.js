var mataram = ee.FeatureCollection(
'projects/uas-kel3-gee/assets/mataramm')

//==============================================================
// UAS MAHA DATA
// ANALISIS PERUBAHAN VEGETASI KOTA MATARAM
// 2024 vs 2025
// PART 1 : PREPROCESSING SENTINEL-2
//==============================================================



//==============================================================
// 1. BATAS WILAYAH
//==============================================================

// Ganti sesuai asset milik Anda

var mataram = ee.FeatureCollection('projects/uas-kel3-gee/assets/mataramm');

Map.centerObject(mataram, 11);

Map.addLayer(
mataram,
{color:'red'},
'Batas Kota Mataram');



//==============================================================
// 2. PERIODE ANALISIS
//==============================================================

var start2024 = '2024-01-01';
var end2024   = '2024-12-31';

var start2025 = '2025-01-01';
var end2025   = '2025-12-31';



//==============================================================
// 3. CLOUD MASK SENTINEL-2
//==============================================================

function maskS2(image){

var qa = image.select('QA60');

var cloudBitMask = 1 << 10;

var cirrusBitMask = 1 << 11;

var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
.and(
qa.bitwiseAnd(cirrusBitMask).eq(0)
);

return image
.updateMask(mask)
.divide(10000)
.copyProperties(image,['system:time_start']);

}



//==============================================================
// 4. MEMANGGIL DATA SENTINEL-2
//==============================================================

var S2_2024 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")

.filterBounds(mataram)

.filterDate(start2024,end2024)

.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))

.map(maskS2);




var S2_2025 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")

.filterBounds(mataram)

.filterDate(start2025,end2025)

.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))

.map(maskS2);




//==============================================================
// 5. JUMLAH CITRA
//==============================================================

print('Jumlah Citra 2024',S2_2024.size());

print('Jumlah Citra 2025',S2_2025.size());




//==============================================================
// 6. KOMPOSIT MEDIAN
//==============================================================

var composite2024 = S2_2024

.median()

.clip(mataram);




var composite2025 = S2_2025

.median()

.clip(mataram);




//==============================================================
// 7. PARAMETER VISUALISASI
//==============================================================

// RGB

var rgb = {

bands:['B4','B3','B2'],

min:0,

max:0.30

};


// False Color Vegetation

var falseColor = {

bands:['B8','B4','B3'],

min:0,

max:0.30

};




//==============================================================
// 8. TAMPILKAN HASIL
//==============================================================

Map.addLayer(

composite2024,

rgb,

'RGB 2024'

);

Map.addLayer(

composite2025,

rgb,

'RGB 2025'

);

Map.addLayer(

composite2024,

falseColor,

'False Color 2024'

);

Map.addLayer(

composite2025,

falseColor,

'False Color 2025'

);




//==============================================================
// 9. INFORMASI
//==============================================================

print("Composite 2024",composite2024);

print("Composite 2025",composite2025);




//==============================================================
// 10. LUAS KOTA
//==============================================================

var luas = mataram.geometry().area().divide(10000);

print("Luas Kota (Ha)",luas);

//==============================================================
// PART 2
// FEATURE STACK
//==============================================================



//==============================================================
// 1. MEMBUAT NDVI
//==============================================================

function addNDVI(image){

var ndvi = image.normalizedDifference(['B8','B4'])
.rename('NDVI');

return image.addBands(ndvi);

}



//==============================================================
// 2. MEMBUAT NDMI
//==============================================================

function addNDMI(image){

var ndmi = image.normalizedDifference(['B8','B11'])
.rename('NDMI');

return image.addBands(ndmi);

}



//==============================================================
// 3. MENAMBAHKAN INDEX KE KOMPOSIT
//==============================================================

var image2024 = addNDMI(
addNDVI(composite2024)
);

var image2025 = addNDMI(
addNDVI(composite2025)
);



//==============================================================
// 4. FEATURE STACK
//==============================================================

var feature2024 = image2024.select([

'B2',
'B3',
'B4',
'B8',
'B11',
'B12',
'NDVI',
'NDMI'

]);



var feature2025 = image2025.select([

'B2',
'B3',
'B4',
'B8',
'B11',
'B12',
'NDVI',
'NDMI'

]);




//==============================================================
// 5. DAFTAR FEATURE
//==============================================================

var bands = [

'B2',
'B3',
'B4',
'B8',
'B11',
'B12',
'NDVI',
'NDMI'

];

print("Feature Bands",bands);




//==============================================================
// 6. VISUALISASI NDVI
//==============================================================

var ndviVis = {

min:-1,

max:1,

palette:[

'red',
'orange',
'yellow',
'white',
'lightgreen',
'green',
'darkgreen'

]

};

Map.addLayer(

feature2024.select('NDVI'),

ndviVis,

'NDVI 2024'

);

Map.addLayer(

feature2025.select('NDVI'),

ndviVis,

'NDVI 2025'

);




//==============================================================
// 7. VISUALISASI NDMI
//==============================================================

var ndmiVis = {

min:-1,

max:1,

palette:[

'brown',
'orange',
'yellow',
'white',
'cyan',
'blue',
'darkblue'

]

};

Map.addLayer(

feature2024.select('NDMI'),

ndmiVis,

'NDMI 2024'

);

Map.addLayer(

feature2025.select('NDMI'),

ndmiVis,

'NDMI 2025'

);




//==============================================================
// 8. CEK FEATURE STACK
//==============================================================

print("Feature Stack 2024",feature2024);

print("Feature Stack 2025",feature2025);




//==============================================================
// 9. HISTOGRAM NDVI
//==============================================================

print(

ui.Chart.image.histogram(

feature2024.select('NDVI'),

mataram,

20

)

.setOptions({

title:'Histogram NDVI 2024'

})

);



print(

ui.Chart.image.histogram(

feature2025.select('NDVI'),

mataram,

20

)

.setOptions({

title:'Histogram NDVI 2025'

})

);

//======================================================
// PART 3
// GROUND TRUTH
//======================================================


//======================================================
// MEMBERI ATRIBUT
//======================================================

veg2024 = veg2024.map(function(f){

return f.set({

'class':1,

'year':2024

});

});



nonveg2024 = nonveg2024.map(function(f){

return f.set({

'class':0,

'year':2024

});

});



veg2025 = veg2025.map(function(f){

return f.set({

'class':1,

'year':2025

});

});



nonveg2025 = nonveg2025.map(function(f){

return f.set({

'class':0,

'year':2025

});

});

var groundTruth = ee.FeatureCollection([

veg2024,
nonveg2024,
veg2025,
nonveg2025

]).flatten();
//==============================================================
// EXPORT GROUND TRUTH KE CSV
//==============================================================

// Tambahkan longitude dan latitude dari geometry titik
var groundTruthCSV = groundTruth.map(function(feature) {

  var coordinate = feature.geometry().coordinates();

  return feature.set({
    longitude: coordinate.get(0),
    latitude: coordinate.get(1)
  });

});

// Cek hasil sebelum export
print(
  'Ground Truth Siap Export CSV',
  groundTruthCSV
);

// Export ke Google Drive
Export.table.toDrive({
  collection: groundTruthCSV,
  description: 'Ground_Truth_Mataram_2024_2025',
  folder: 'GEE',
  fileNamePrefix: 'ground_truth_mataram_2024_2025',
  fileFormat: 'CSV',
  selectors: [
    'longitude',
    'latitude',
    'class',
    'year'
  ]
});

print("Ground Truth",groundTruth);

print("Total Titik",
groundTruth.size());

print(
groundTruth.aggregate_histogram('class')
);

print(
groundTruth.aggregate_histogram('year')
);

Map.addLayer(

veg2024,

{

color:'00FF00'

},

'Vegetasi 2024'

);



Map.addLayer(

nonveg2024,

{

color:'FF0000'

},

'Non Vegetasi 2024'

);



Map.addLayer(

veg2025,

{

color:'006400'

},

'Vegetasi 2025'

);



Map.addLayer(

nonveg2025,

{

color:'FFA500'

},

'Non Vegetasi 2025'

);

//==============================================================
// PART 4
// TRAINING - TESTING SPLIT 60:40
//==============================================================

var seed = 12345;
var splitRatio = 0.6;

// Pisahkan berdasarkan tahun dan kelas
var veg24 = groundTruth.filter(
  ee.Filter.and(
    ee.Filter.eq('class', 1),
    ee.Filter.eq('year', 2024)
  )
);

var non24 = groundTruth.filter(
  ee.Filter.and(
    ee.Filter.eq('class', 0),
    ee.Filter.eq('year', 2024)
  )
);

var veg25 = groundTruth.filter(
  ee.Filter.and(
    ee.Filter.eq('class', 1),
    ee.Filter.eq('year', 2025)
  )
);

var non25 = groundTruth.filter(
  ee.Filter.and(
    ee.Filter.eq('class', 0),
    ee.Filter.eq('year', 2025)
  )
);

// Tambahkan angka random
veg24 = veg24.randomColumn('random', seed);
non24 = non24.randomColumn('random', seed);
veg25 = veg25.randomColumn('random', seed);
non25 = non25.randomColumn('random', seed);

// 60% training
var trainVeg24 = veg24.filter(
  ee.Filter.lt('random', splitRatio)
);

var trainNon24 = non24.filter(
  ee.Filter.lt('random', splitRatio)
);

var trainVeg25 = veg25.filter(
  ee.Filter.lt('random', splitRatio)
);

var trainNon25 = non25.filter(
  ee.Filter.lt('random', splitRatio)
);

// 40% testing
var testVeg24 = veg24.filter(
  ee.Filter.gte('random', splitRatio)
);

var testNon24 = non24.filter(
  ee.Filter.gte('random', splitRatio)
);

var testVeg25 = veg25.filter(
  ee.Filter.gte('random', splitRatio)
);

var testNon25 = non25.filter(
  ee.Filter.gte('random', splitRatio)
);

// Gabungkan training
var training = ee.FeatureCollection([
  trainVeg24,
  trainNon24,
  trainVeg25,
  trainNon25
]).flatten();

// Gabungkan testing
var testing = ee.FeatureCollection([
  testVeg24,
  testNon24,
  testVeg25,
  testNon25
]).flatten();

print('Split Training', '60%');
print('Split Testing', '40%');

print('Training Dataset', training);
print('Testing Dataset', testing);

print('Jumlah Training', training.size());
print('Jumlah Testing', testing.size());

print(
  'Training Class',
  training.aggregate_histogram('class')
);

print(
  'Testing Class',
  testing.aggregate_histogram('class')
);

print(
  'Training Year',
  training.aggregate_histogram('year')
);

print(
  'Testing Year',
  testing.aggregate_histogram('year')
);

Map.addLayer(
  training,
  {color: '00FF00'},
  'Training 60%'
);

Map.addLayer(
  testing,
  {color: 'FF0000'},
  'Testing 40%'
);


//==============================================================
// PART 5
// RANDOM FOREST
//==============================================================

var bands = [
  'B2',
  'B3',
  'B4',
  'B8',
  'B11',
  'B12',
  'NDVI',
  'NDMI'
];

// Sampel training dari citra 2024
var sample2024 = feature2024.sampleRegions({
  collection: training.filter(
    ee.Filter.eq('year', 2024)
  ),
  properties: ['class'],
  scale: 10,
  geometries: true
});

// Sampel training dari citra 2025
var sample2025 = feature2025.sampleRegions({
  collection: training.filter(
    ee.Filter.eq('year', 2025)
  ),
  properties: ['class'],
  scale: 10,
  geometries: true
});

// Gabungkan training 2024 dan 2025
var trainingData = sample2024.merge(sample2025);

print('Training Data', trainingData);
print('Jumlah Training Data', trainingData.size());

// Random Forest
var rf = ee.Classifier.smileRandomForest({
  numberOfTrees: 640,
  seed: seed,
  bagFraction: 0.7,
  minLeafPopulation: 1
}).train({
  features: trainingData,
  classProperty: 'class',
  inputProperties: bands
});

print('Random Forest Model', rf);
print('Jumlah Trees', 640);
print('Bands', bands);

// Klasifikasi 2024
var classified2024 = feature2024
  .select(bands)
  .classify(rf)
  .rename('classification');

// Klasifikasi 2025
var classified2025 = feature2025
  .select(bands)
  .classify(rf)
  .rename('classification');

var classVis = {
  min: 0,
  max: 1,
  palette: [
    'red',
    'green'
  ]
};

Map.addLayer(
  classified2024,
  classVis,
  'Klasifikasi 2024'
);

Map.addLayer(
  classified2025,
  classVis,
  'Klasifikasi 2025'
);

print('Classification 2024', classified2024);
print('Classification 2025', classified2025);


//==============================================================
// PART 6
// MODEL EVALUATION TESTING 40%
//==============================================================

// Testing dari citra 2024
var testing2024 = feature2024.sampleRegions({
  collection: testing.filter(
    ee.Filter.eq('year', 2024)
  ),
  properties: ['class'],
  scale: 10,
  geometries: true
});

// Testing dari citra 2025
var testing2025 = feature2025.sampleRegions({
  collection: testing.filter(
    ee.Filter.eq('year', 2025)
  ),
  properties: ['class'],
  scale: 10,
  geometries: true
});

// Gabungkan testing
var testingData = testing2024.merge(testing2025);

print('Testing Data', testingData);
print('Jumlah Testing Data', testingData.size());

// Prediksi data testing
var validation = testingData.classify(rf);

print('Validation', validation);

// Confusion Matrix
var confusionMatrix = validation.errorMatrix(
  'class',
  'classification'
);

print('Confusion Matrix', confusionMatrix);

// Accuracy
var accuracy = confusionMatrix.accuracy();

print('Overall Accuracy', accuracy);

// Kappa
var kappa = confusionMatrix.kappa();

print('Kappa', kappa);

// TN, FP, FN, TP
var matrix = ee.Array(confusionMatrix.array());

var TN = ee.Number(matrix.get([0, 0]));
var FP = ee.Number(matrix.get([0, 1]));
var FN = ee.Number(matrix.get([1, 0]));
var TP = ee.Number(matrix.get([1, 1]));

print('True Negative', TN);
print('False Positive', FP);
print('False Negative', FN);
print('True Positive', TP);

// Precision
var precision = TP.divide(
  TP.add(FP)
);

print('Precision', precision);

// Recall
var recall = TP.divide(
  TP.add(FN)
);

print('Recall', recall);

// F1-score
var f1 = ee.Algorithms.If(
  precision.add(recall).neq(0),
  precision
    .multiply(recall)
    .multiply(2)
    .divide(
      precision.add(recall)
    ),
  0
);

print('F1 Score', f1);

print('====================');
print('Random Forest');
print('Split', '60:40');
print('Trees', 640);
print('Seed', seed);
print('Training', training.size());
print('Testing', testing.size());
print('====================');

//==============================================================
// PART 7
// CHANGE DETECTION
//==============================================================

var classVis = {

  min:0,

  max:1,

  palette:[
    'red',      // Non Vegetasi
    'green'     // Vegetasi
  ]

};

Map.addLayer(classified2024,classVis,'Vegetasi 2024');

Map.addLayer(classified2025,classVis,'Vegetasi 2025');

var pixelArea = ee.Image.pixelArea().divide(1000).rename('ha'); // hektar

var area2024 = pixelArea.updateMask(classified2024.eq(1));

var luas2024 = area2024.reduceRegion({

  reducer:ee.Reducer.sum(),

  geometry:mataram,

  scale:10,

  maxPixels:1e13

});

print("Luas Vegetasi 2024 (Ha)",luas2024);

var area2025 = pixelArea.updateMask(classified2025.eq(1));

var luas2025 = area2025.reduceRegion({

  reducer:ee.Reducer.sum(),

  geometry:mataram,

  scale:10,

  maxPixels:1e13

});

print("Luas Vegetasi 2025 (Ha)",luas2025);

var luasKota = ee.Number(
mataram.geometry().area()
).divide(10000);

print("Luas Kota (Ha)",luasKota);

var persen2024 = ee.Number(
luas2024.get('Ha')
).divide(luasKota)
.multiply(100);

var persen2025 = ee.Number(
luas2025.get('Ha')
).divide(luasKota)
.multiply(100);

print("Persentase Vegetasi 2024",persen2024);

print("Persentase Vegetasi 2025",persen2025);

var change = classified2024.multiply(2)
.add(classified2025);

var changeVis={

min:0,

max:3,

palette:[

'red',

'yellow',

'blue',

'green'

]

};

Map.addLayer(change,changeVis,'Change Map');

var gain = pixelArea.updateMask(change.eq(1));

var gainArea = gain.reduceRegion({

reducer:ee.Reducer.sum(),

geometry:mataram,

scale:10,

maxPixels:1e13

});

print("Gain (Ha)",gainArea);

var loss = pixelArea.updateMask(change.eq(2));

var lossArea = loss.reduceRegion({

reducer:ee.Reducer.sum(),

geometry:mataram,

scale:10,

maxPixels:1e13

});

print("Loss (Ha)",lossArea);

var stable = pixelArea.updateMask(change.eq(3));

var stableArea = stable.reduceRegion({

reducer:ee.Reducer.sum(),

geometry:mataram,

scale:10,

maxPixels:1e13

});

print("Tetap Vegetasi (Ha)",stableArea);

var netChange = ee.Number(

luas2025.get('area')

).subtract(

ee.Number(luas2024.get('area'))

);

print("Net Change (Ha)",netChange);

var percentChange = netChange

.divide(

ee.Number(luas2024.get('Ha'))

)

.multiply(100);

print("Perubahan (%)",percentChange);

//==============================================================
// PART 8
// LAND COVER STATISTICS
//==============================================================

var areaImage = ee.Image.pixelArea()
.divide(10000)
.rename('ha');

var areaClass2024 = areaImage.addBands(classified2024);

var stats2024 = areaClass2024.reduceRegion({

  reducer: ee.Reducer.sum().group({

    groupField:1,

    groupName:'class'

  }),

  geometry:mataram,

  scale:10,

  maxPixels:1e13

});

print("Statistik 2024",stats2024);

var areaClass2025 = areaImage.addBands(classified2025);

var stats2025 = areaClass2025.reduceRegion({

  reducer: ee.Reducer.sum().group({

    groupField:1,

    groupName:'class'

  }),

  geometry:mataram,

  scale:10,

  maxPixels:1e13

});

print("Statistik 2025",stats2025);

var table2024 = ee.FeatureCollection(

ee.List(stats2024.get('groups')).map(function(item){

item = ee.Dictionary(item);

return ee.Feature(null,{

Class:item.get('class'),

Area_Ha:item.get('sum'),

Year:2024

});

})

);

print(table2024);

var table2025 = ee.FeatureCollection(

ee.List(stats2025.get('groups')).map(function(item){

item = ee.Dictionary(item);

return ee.Feature(null,{

Class:item.get('class'),

Area_Ha:item.get('sum'),

Year:2025

});

})

);

print(table2025);

var statistics = table2024.merge(table2025);

print(statistics);

var chart = ui.Chart.feature.groups({

features:statistics,

xProperty:'Year',

yProperty:'Area_Ha',

seriesProperty:'Class'

})

.setChartType('ColumnChart')

.setOptions({

title:'Perbandingan Luas Vegetasi',

hAxis:{title:'Tahun'},

vAxis:{title:'Luas (Ha)'},

legend:{position:'right'}

});

print(chart);

var vegOnly = statistics.filter(

ee.Filter.eq('Class',1)

);

var chart2 = ui.Chart.feature.byFeature({

features:vegOnly,

xProperty:'Year',

yProperties:['Area_Ha']

})

.setChartType('LineChart')

.setOptions({

title:'Perubahan Vegetasi',

lineWidth:3,

pointSize:6

});

print(chart2);

var veg2024 = ee.Number(

table2024
.filter(ee.Filter.eq('Class',1))
.first()
.get('Area_Ha')

);

var veg2025 = ee.Number(

table2025
.filter(ee.Filter.eq('Class',1))
.first()
.get('Area_Ha')

);

var difference = veg2025.subtract(veg2024);

print("Perubahan Vegetasi (Ha)",difference);

var percent = difference

.divide(veg2024)

.multiply(100);

print("Persentase Perubahan",percent);

//==============================================================
// PART 9
// SUMMARY STATISTICS & EXPORT
//==============================================================

//--------------------------------------------------------------
// 1. Mengubah Dictionary menjadi Number
//--------------------------------------------------------------

// Pastikan pada PART 7 pixelArea sudah di-rename menjadi 'ha'
// var pixelArea = ee.Image.pixelArea().divide(10000).rename('ha');

var vegetasi2024 = ee.Number(luas2024.get('ha'));

var vegetasi2025 = ee.Number(luas2025.get('ha'));

var gainHa = ee.Number(gainArea.get('ha'));

var lossHa = ee.Number(lossArea.get('ha'));

var stableHa = ee.Number(stableArea.get('ha'));


//--------------------------------------------------------------
// 2. Luas Kota Mataram
//--------------------------------------------------------------

var luasMataram = ee.Number(
    mataram.geometry().area()
).divide(10000);

print("Luas Kota Mataram (Ha)",luasMataram);


//--------------------------------------------------------------
// 3. Persentase Vegetasi
//--------------------------------------------------------------

var persen2024 =
vegetasi2024.divide(luasMataram)
.multiply(100);

var persen2025 =
vegetasi2025.divide(luasMataram)
.multiply(100);


//--------------------------------------------------------------
// 4. Net Change
//--------------------------------------------------------------

var netChange =
vegetasi2025.subtract(
vegetasi2024
);


//--------------------------------------------------------------
// 5. Persentase Perubahan
//--------------------------------------------------------------

var percentChange =
netChange
.divide(vegetasi2024)
.multiply(100);


//--------------------------------------------------------------
// 6. Ringkasan Statistik
//--------------------------------------------------------------

print("==============================");

print("HASIL ANALISIS VEGETASI");

print("==============================");

print("Vegetasi Tahun 2024 (Ha)",
vegetasi2024);

print("Vegetasi Tahun 2025 (Ha)",
vegetasi2025);

print("Persentase Vegetasi 2024 (%)",
persen2024);

print("Persentase Vegetasi 2025 (%)",
persen2025);

print("Gain Vegetasi (Ha)",
gainHa);

print("Loss Vegetasi (Ha)",
lossHa);

print("Tetap Vegetasi (Ha)",
stableHa);

print("Net Change (Ha)",
netChange);

print("Perubahan Vegetasi (%)",
percentChange);

print("==============================");

print("Accuracy",
accuracy);

print("Precision",
precision);

print("Recall",
recall);

print("F1 Score",
f1);

print("Kappa",
confusionMatrix.kappa());

print("==============================");

//==============================================================
// MEMBUAT TABEL HASIL
//==============================================================

var summary = ee.Feature(null,{

'Wilayah':'Kota Mataram',

'Tahun_Awal':2024,

'Tahun_Akhir':2025,

'Luas_Vegetasi_2024_Ha':vegetasi2024,

'Luas_Vegetasi_2025_Ha':vegetasi2025,

'Gain_Ha':gainHa,

'Loss_Ha':lossHa,

'Tetap_Vegetasi_Ha':stableHa,

'Net_Change_Ha':netChange,

'Persentase_2024':persen2024,

'Persentase_2025':persen2025,

'Perubahan_Persen':percentChange,

'Accuracy':accuracy,

'Precision':precision,

'Recall':recall,

'F1_Score':f1,

'Kappa':confusionMatrix.kappa()

});

print(summary);

Export.table.toDrive({

collection:
ee.FeatureCollection([
summary
]),

description:
'Summary_Statistik_Mataram_2024_2025',

folder:
'GEE',

fileFormat:
'CSV'

});

Export.image.toDrive({

image:
classified2024,

description:
'RF_2024',

folder:
'GEE',

region:
mataram.geometry(),

scale:
10,

maxPixels:
1e13

});

Export.image.toDrive({

image:
classified2025,

description:
'RF_2025',

folder:
'GEE',

region:
mataram.geometry(),

scale:
10,

maxPixels:
1e13

});

//==============================================================
// PART 10
// CHANGE DETECTION EXPORT (VECTOR)
//==============================================================

var change = classified2024
    .multiply(2)
    .add(classified2025)
    .rename('Change')
    .toByte();

var changeVis = {
  min: 0,
  max: 3,
  palette: [
    '#d73027', // 0 = Tetap Non Vegetasi
    '#ffc0cb', // 1 = Gain Vegetasi
    '#fdae61', // 2 = Loss Vegetasi
    '#006837'  // 3 = Tetap Vegetasi
  ]
};

Map.addLayer(change, changeVis, 'Change Detection');

Export.image.toDrive({
  image: change,
  description: 'Change_2024_2025',
  folder: 'GEE',
  region: mataram.geometry(),
  scale: 10,
  crs: 'EPSG:32750',   // UTM Zona 50S, sesuai lokasi Kota Mataram
  maxPixels: 1e13
});

var gainVector = change
    .eq(1)
    .selfMask()
    .reduceToVectors({

      geometry: mataram.geometry(),

      scale:10,

      geometryType:'polygon',

      eightConnected:true,

      reducer:ee.Reducer.countEvery(),

      maxPixels:1e13

});

Map.addLayer(gainVector,{color:'purple'},'Gain');

Export.table.toDrive({

collection:gainVector,

description:'Gain_Vegetasi',

folder:'GEE',

fileFormat:'SHP'

});

var lossVector = change
    .eq(2)
    .selfMask()
    .reduceToVectors({

      geometry:mataram.geometry(),

      scale:10,

      geometryType:'polygon',

      eightConnected:true,

      reducer:ee.Reducer.countEvery(),

      maxPixels:1e13

});

Export.table.toDrive({

collection:lossVector,

description:'Loss_Vegetasi',

folder:'GEE',

fileFormat:'SHP'

});

// Hilangkan noise kecil
var changeClean = change
    .focalMode({
      radius: 1,
      units: 'pixels'
    })
    .toByte();
    
    var vector = changeClean.reduceToVectors({

  geometry: mataram.geometry(),

  scale:10,

  geometryType:'polygon',

  labelProperty:'kelas',

  reducer:ee.Reducer.first(),

  eightConnected:true,

  maxPixels:1e13

});

var vectorArea = vector.map(function(feature){

  var areaHa = feature.geometry().area().divide(10000);

  return feature.set('Area_Ha', areaHa);

});

Export.table.toDrive({

  collection: vectorArea,

  description:'ChangeDetection_Area',

  folder:'GEE',

  fileFormat:'SHP'

});

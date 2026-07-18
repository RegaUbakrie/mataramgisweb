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
// TRAINING - TESTING SPLIT
//==============================================================

//==============================================================
// 1. SEED RANDOM
//==============================================================

var seed = 12345;

//==============================================================
// 2. MEMISAHKAN BERDASARKAN TAHUN DAN KELAS
//==============================================================

var veg24 = groundTruth.filter(
    ee.Filter.and(
        ee.Filter.eq('class',1),
        ee.Filter.eq('year',2024)
    )
);

var non24 = groundTruth.filter(
    ee.Filter.and(
        ee.Filter.eq('class',0),
        ee.Filter.eq('year',2024)
    )
);

var veg25 = groundTruth.filter(
    ee.Filter.and(
        ee.Filter.eq('class',1),
        ee.Filter.eq('year',2025)
    )
);

var non25 = groundTruth.filter(
    ee.Filter.and(
        ee.Filter.eq('class',0),
        ee.Filter.eq('year',2025)
    )
);

print('Vegetasi 2024',veg24.size());
print('Non Vegetasi 2024',non24.size());
print('Vegetasi 2025',veg25.size());
print('Non Vegetasi 2025',non25.size());

veg24 = veg24.randomColumn('random',seed);

non24 = non24.randomColumn('random',seed);

veg25 = veg25.randomColumn('random',seed);

non25 = non25.randomColumn('random',seed);

var trainVeg24 = veg24.filter('random < 0.7');

var trainNon24 = non24.filter('random < 0.7');

var trainVeg25 = veg25.filter('random < 0.7');

var trainNon25 = non25.filter('random < 0.7');

var testVeg24 = veg24.filter('random >= 0.7');

var testNon24 = non24.filter('random >= 0.7');

var testVeg25 = veg25.filter('random >= 0.7');

var testNon25 = non25.filter('random >= 0.7');

var training = ee.FeatureCollection([

trainVeg24,

trainNon24,

trainVeg25,

trainNon25

]).flatten();

var testing = ee.FeatureCollection([

testVeg24,

testNon24,

testVeg25,

testNon25

]).flatten();

print("Training Dataset",training);

print("Testing Dataset",testing);

print("Jumlah Training",training.size());

print("Jumlah Testing",testing.size());

print(

"Training Class",

training.aggregate_histogram('class')

);

print(

"Testing Class",

testing.aggregate_histogram('class')

);

print(

"Training Year",

training.aggregate_histogram('year')

);

print(

"Testing Year",

testing.aggregate_histogram('year')

);

Map.addLayer(

training,

{

color:'00FF00'

},

'Training'

);

Map.addLayer(

testing,

{

color:'FF0000'

},

'Testing'

);

//==============================================================
// PART 5
// RANDOM FOREST
//==============================================================


//==============================================================
// 1. DAFTAR BAND
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


//==============================================================
// 2. MEMBUAT TRAINING SAMPLE
//==============================================================

// Sample dari citra 2024
var sample2024 = feature2024.sampleRegions({

collection: training.filter(ee.Filter.eq('year',2024)),

properties:['class'],

scale:10,

geometries:true

});

// Sample dari citra 2025
var sample2025 = feature2025.sampleRegions({

collection: training.filter(ee.Filter.eq('year',2025)),

properties:['class'],

scale:10,

geometries:true

});


//==============================================================
// 3. GABUNGKAN TRAINING
//==============================================================

var trainingData = sample2024.merge(sample2025);

print("Training Data",trainingData);

print("Jumlah Training Data",trainingData.size());

//==============================================================
// 4. RANDOM FOREST
//==============================================================

var rf = ee.Classifier.smileRandomForest({

numberOfTrees:640,

seed:12345,

bagFraction:0.7,

minLeafPopulation:1

}).train({

features:trainingData,

classProperty:'class',

inputProperties:bands

});

print("Random Forest Model",rf);

print("Jumlah Trees",640);

print("Bands",bands);

var classified2024 = feature2024

.select(bands)

.classify(rf)

.rename('classification');

var classified2025 = feature2025

.select(bands)

.classify(rf)

.rename('classification');

var classVis = {

min:0,

max:1,

palette:[

'red',

'green'

]

};

Map.addLayer(

classified2024,

classVis,

'Vegetasi 2024'

);

Map.addLayer(

classified2025,

classVis,

'Vegetasi 2025'

);

print("Classification 2024",classified2024);

print("Classification 2025",classified2025);

//==============================================================
// PART 6
// MODEL EVALUATION (TESTING)
//==============================================================

// Testing 2024
var testing2024 = feature2024.sampleRegions({

  collection: testing.filter(ee.Filter.eq('year',2024)),

  properties:['class'],

  scale:10,

  geometries:true

});

// Testing 2025
var testing2025 = feature2025.sampleRegions({

  collection: testing.filter(ee.Filter.eq('year',2025)),

  properties:['class'],

  scale:10,

  geometries:true

});

// Gabungkan

var testingData = testing2024.merge(testing2025);

print("Testing Data",testingData);

var validation = testingData.classify(rf);

print(validation);

//==============================================================
// CONFUSION MATRIX
//==============================================================

var confusionMatrix = validation.errorMatrix(
'class',
'classification'
);

print("Confusion Matrix", confusionMatrix);


//==============================================================
// ACCURACY
//==============================================================

var accuracy = confusionMatrix.accuracy();

print("Overall Accuracy", accuracy);


//==============================================================
// KAPPA
//==============================================================

print("Kappa", confusionMatrix.kappa());


//==============================================================
// MENGAMBIL NILAI TN FP FN TP
//==============================================================

var matrix = ee.Array(confusionMatrix.array());

var TN = ee.Number(matrix.get([0,0]));

var FP = ee.Number(matrix.get([0,1]));

var FN = ee.Number(matrix.get([1,0]));

var TP = ee.Number(matrix.get([1,1]));

print("True Negative",TN);

print("False Positive",FP);

print("False Negative",FN);

print("True Positive",TP);


//==============================================================
// PRECISION
//==============================================================

var precision = TP.divide(
TP.add(FP)
);

print("Precision",precision);


//==============================================================
// RECALL
//==============================================================

var recall = TP.divide(
TP.add(FN)
);

print("Recall",recall);


//==============================================================
// F1 SCORE
//==============================================================

var f1 = ee.Algorithms.If(

precision.add(recall).neq(0),

precision.multiply(recall)
.multiply(2)
.divide(
precision.add(recall)
),

0

);

print("F1 Score",f1);


//==============================================================
// JUMLAH TESTING
//==============================================================

print("Jumlah Testing",testingData.size());


//==============================================================
// INFORMASI MODEL
//==============================================================

print("====================");

print("Random Forest");

print("Trees",640);

print("Seed",12345);

print("Training",training.size());

print("Testing",testing.size());

print("====================");
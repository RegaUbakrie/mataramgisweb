# Struktur Proyek WebGIS Mataram - Production Ready

## 📁 Folder Structure

```
Mataram_WebGIS/
├── index.html                          # ✨ Main entry point (ROOT LEVEL)
├── server.js                           # Node.js Express server
├── package.json                        # Dependencies & scripts
├── Dockerfile                          # Docker configuration
├── docker-compose.yml                  # Docker compose setup
├── .env.production                     # Production environment config
├── DEPLOYMENT.md                       # Deployment guide
├── README.md                           # Project documentation
│
├── WebGIS/                             # ✨ Application folder
│   ├── index.html                      # Original index (legacy)
│   ├── assets/
│   │   ├── leaflet.js                 # Mapping library
│   │   ├── leaflet.css                # Leaflet styles
│   │   ├── main_script.js             # GEE analysis script
│   │   └── logo-mataram.png           # Branding
│   │
│   └── data/                           # GeoJSON & CSV data
│       ├── batas_kota.geojson
│       ├── kecamatan.geojson
│       ├── target_2024.geojson
│       ├── target_2025.geojson
│       ├── gain.geojson
│       ├── loss.geojson
│       ├── ground_truth.geojson
│       ├── confusion_matrix.csv
│       ├── Summary_Statistik_Mataram_2024_2025.csv
│       ├── ground_truth_mataram_2024_2025.csv
│       ├── kecamatan_summary.json
│       └── stats.json
│
├── build-scripts/
│   └── build.ps1                       # PowerShell build script
│
├── dist/                               # Production build output
│   ├── index.html
│   ├── assets/
│   ├── data/
│   └── .htaccess / web.config
│
├── Data/                               # Raw data archive
├── GEE/                                # Google Earth Engine scripts
└── Results/                            # Analysis results
```

---

## 🔑 Key Changes (v1.0.0)

### ✅ Struktur Baru (Recommended)
Akses aplikasi dari **root level**:
```
http://localhost:3000/index.html
atau
http://localhost:3000/
```

**File baru di root:**
- `index.html` - Main entry point dengan path sudah disesuaikan
- Semua asset mengacu ke `WebGIS/assets/`
- Semua data mengacu ke `WebGIS/data/`

### 📦 Path Structure

```
Root Level Access:
index.html
  ├─ link href="WebGIS/assets/leaflet.css"
  ├─ img src="WebGIS/assets/logo-mataram.png"
  ├─ href="WebGIS/data/confusion_matrix.csv"
  └─ href="WebGIS/data/*.geojson"
```

---

## 🚀 Quick Start

### 1. **Local Development**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access: http://localhost:3000
```

### 2. **Production Build**
```bash
# PowerShell
.\build-scripts\build.ps1 -Clean

# Copy dist/ to server
# Configure web server (.htaccess / web.config / nginx.conf)
```

### 3. **Docker Deployment**
```bash
npm run docker:build
npm run docker:run

# Access: http://localhost:3000
```

---

## 📋 Path Mapping Reference

### Old Structure (WebGIS folder)
```
WebGIS/index.html
  ├─ assets/leaflet.css        ✗ deprecated
  ├─ data/confusion_matrix.csv  ✗ deprecated
```

### New Structure (Root level)
```
index.html (ROOT)
  ├─ WebGIS/assets/leaflet.css        ✓ correct
  ├─ WebGIS/data/confusion_matrix.csv ✓ correct
```

---

## ✨ Updated Files

| File | Location | Change |
|------|----------|--------|
| `index.html` | Root | **NEW** - Main entry point |
| `server.js` | Root | **NEW** - Express server |
| `package.json` | Root | **NEW** - Dependencies |
| `Dockerfile` | Root | **NEW** - Container config |
| `docker-compose.yml` | Root | **NEW** - Docker compose |
| `.env.production` | Root | **NEW** - Env config |
| `DEPLOYMENT.md` | Root | **NEW** - Deploy guide |
| `build-scripts/build.ps1` | Root | **NEW** - Build script |

---

## 🔗 All Download Links (Updated)

CSV Files:
- `WebGIS/data/confusion_matrix.csv`
- `WebGIS/data/Summary_Statistik_Mataram_2024_2025.csv`
- `WebGIS/data/ground_truth_mataram_2024_2025.csv`

GeoJSON Files:
- `WebGIS/data/batas_kota.geojson`
- `WebGIS/data/kecamatan.geojson`
- `WebGIS/data/target_2024.geojson`
- `WebGIS/data/target_2025.geojson`
- `WebGIS/data/gain.geojson`
- `WebGIS/data/loss.geojson`
- `WebGIS/data/ground_truth.geojson`

JSON/Scripts:
- `WebGIS/data/kecamatan_summary.json`
- `WebGIS/data/stats.json`
- `WebGIS/assets/main_script.js`

---

## 🧪 Verification Checklist

- [x] `index.html` created at root level
- [x] All asset paths updated to `WebGIS/assets/`
- [x] All data paths updated to `WebGIS/data/`
- [x] Download links corrected
- [x] Server.js configured for static serving
- [x] Docker setup ready
- [x] Production build script created

---

## 📝 Next Steps

1. **Test locally:**
   ```bash
   node server.js
   # Open http://localhost:3000
   ```

2. **Deploy to production:**
   ```bash
   npm run build
   npm run test
   npm run deploy
   ```

3. **Monitor & maintain:**
   - Check logs in `dist/`
   - Monitor performance
   - Update data as needed

---

## 💡 Tips

### Updating Data Files
```bash
# Replace CSV/GeoJSON without restarting
cp data/new_file.geojson WebGIS/data/
```

### Changing Ports
```bash
# Development
PORT=8080 npm run dev

# Production
PORT=3000 npm start
```

### Testing Build
```bash
# Verify all paths
grep -r "WebGIS/" index.html

# Check file sizes
du -sh WebGIS/data/*
```

---

**Version:** 1.0.0  
**Updated:** 2024  
**Status:** ✅ Production Ready

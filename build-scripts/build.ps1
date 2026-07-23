# ============================================
# WebGIS Mataram - Production Build Script
# ============================================
# Script ini mempersiapkan versi production-ready
# Jalankan: .\build-scripts\build.ps1

param(
    [switch]$Compress = $false,
    [switch]$Clean = $false
)

$SourceDir = "WebGIS"
$DistDir = "dist"
$BuildLog = "dist/BUILD_LOG.txt"

Write-Host "=== WebGIS Mataram Build System ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Clean if requested
if ($Clean) {
    Write-Host "`n[1/5] Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path $DistDir) {
        Remove-Item $DistDir -Recurse -Force
        Write-Host "✓ Cleaned $DistDir" -ForegroundColor Green
    }
}

# Create structure
Write-Host "`n[2/5] Creating directory structure..." -ForegroundColor Yellow
@("$DistDir/assets", "$DistDir/data") | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}
Write-Host "✓ Directories ready" -ForegroundColor Green

# Copy files
Write-Host "`n[3/5] Copying files..." -ForegroundColor Yellow
$filesToCopy = @(
    @{src="$SourceDir/index.html"; dst="$DistDir/index.html"},
    @{src="$SourceDir/assets/leaflet.js"; dst="$DistDir/assets/leaflet.js"},
    @{src="$SourceDir/assets/leaflet.css"; dst="$DistDir/assets/leaflet.css"},
    @{src="$SourceDir/assets/logo-mataram.png"; dst="$DistDir/assets/logo-mataram.png"},
    @{src="$SourceDir/assets/main_script.js"; dst="$DistDir/assets/main_script.js"}
)

$filesToCopy | ForEach-Object {
    if (Test-Path $_.src) {
        Copy-Item $_.src $_.dst -Force
        Write-Host "  ✓ $($_.dst)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($_.src) - NOT FOUND" -ForegroundColor Red
    }
}

# Copy data files (critical)
Write-Host "`n[4/5] Copying data files..." -ForegroundColor Yellow
$dataFiles = @(
    "batas_kota.geojson",
    "kecamatan.geojson",
    "kecamatan_summary.json",
    "stats.json",
    "target_2024.geojson",
    "target_2025.geojson",
    "gain.geojson",
    "loss.geojson",
    "ground_truth.geojson",
    "confusion_matrix.csv",
    "Summary_Statistik_Mataram_2024_2025.csv"
)

$dataFiles | ForEach-Object {
    $src = "$SourceDir/data/$_"
    if (Test-Path $src) {
        Copy-Item $src "$DistDir/data/$_" -Force
        $size = (Get-Item $src).Length / 1MB
        Write-Host "  ✓ $_ ($('{0:F2}' -f $size) MB)" -ForegroundColor Green
    }
}

# Create .htaccess for Apache
Write-Host "`n[5/5] Creating server configuration..." -ForegroundColor Yellow
@"
# ============================================
# Apache Configuration for WebGIS Mataram
# ============================================

# Enable gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    AddOutputFilterByType DEFLATE application/x-font-ttf font/opentype image/svg+xml
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 1 hours"
    ExpiresByType text/css "access plus 30 days"
    ExpiresByType text/javascript "access plus 30 days"
    ExpiresByType application/javascript "access plus 30 days"
    ExpiresByType image/png "access plus 30 days"
    ExpiresByType image/jpeg "access plus 30 days"
    ExpiresByType image/gif "access plus 30 days"
    ExpiresByType application/json "access plus 1 hours"
</IfModule>

# CORS headers for GeoJSON
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"

# Disable directory listing
Options -Indexes

# Rewrite rules for SPA
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
"@ | Out-File "$DistDir/.htaccess" -Encoding UTF8

Write-Host "✓ .htaccess created" -ForegroundColor Green

# Create web.config for IIS
@"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Enable gzip compression -->
    <httpCompression directory="%SystemDrive%\inetpub\temp\IIS Temporary Compressed Files">
      <scheme name="gzip" dll="%Windir%\system32\inetsrv\gzip.dll" staticCompressionLevel="9" />
      <dynamicTypes>
        <add mimeType="text/html" enabled="true" />
        <add mimeType="text/css" enabled="true" />
        <add mimeType="text/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </dynamicTypes>
    </httpCompression>
    
    <!-- Browser caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAgeInSeconds="2592000" />
    </staticContent>
    
    <!-- Security headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Access-Control-Allow-Origin" value="*" />
      </customHeaders>
    </httpProtocol>
    
    <!-- URL Rewrite for SPA -->
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@ | Out-File "$DistDir/web.config" -Encoding UTF8

Write-Host "✓ web.config created" -ForegroundColor Green

# Generate build summary
Write-Host "`n=== BUILD COMPLETE ===" -ForegroundColor Green
$totalSize = (Get-ChildItem $DistDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Total size: $('{0:F2}' -f $totalSize) MB"
Write-Host "Output: $DistDir/" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Review: dist/index.html"
Write-Host "  2. Deploy to web server"
Write-Host "  3. Configure domain and SSL"
Write-Host "  4. Test on staging environment"

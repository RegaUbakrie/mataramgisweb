# WebGIS Mataram - Production Deployment Guide

## Versioning
- **Version**: 1.0.0
- **Build Date**: 2024
- **Environment**: Production
- **Status**: Ready for Deployment

---

## 📋 Pre-Deployment Checklist

- [ ] All GeoJSON files optimized and compressed
- [ ] Assets minified (CSS/JS)
- [ ] `.htaccess` or `web.config` configured
- [ ] SSL certificate installed
- [ ] Domain name pointed to server
- [ ] Database/API endpoints configured
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Performance tested (Lighthouse score > 80)
- [ ] Security audit completed
- [ ] Backup strategy configured

---

## 🚀 Deployment Options

### Option 1: Apache Server (Recommended)

**Requirements:**
- Apache 2.4+
- PHP (optional)
- mod_rewrite enabled
- mod_deflate enabled

**Steps:**

1. Upload `dist/` folder to webroot:
```bash
scp -r dist/* user@server:/var/www/html/mataram-webgis/
```

2. Set permissions:
```bash
chmod 755 /var/www/html/mataram-webgis
chmod 644 /var/www/html/mataram-webgis/.htaccess
```

3. Enable modules:
```bash
sudo a2enmod rewrite
sudo a2enmod deflate
sudo a2enmod headers
sudo systemctl restart apache2
```

4. Configure VirtualHost (optional):
```apache
<VirtualHost *:80>
    ServerName mataram-webgis.example.com
    DocumentRoot /var/www/html/mataram-webgis
    
    <Directory /var/www/html/mataram-webgis>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

### Option 2: Nginx Server

**Configuration:**

```nginx
server {
    listen 80;
    server_name mataram-webgis.example.com;
    root /usr/share/nginx/html/mataram-webgis;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript application/x-font-ttf;
    gzip_min_length 1024;
    
    # Browser caching
    location ~* \.(js|css|png|jpg|gif|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location ~* \.json$ {
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

**Upload:**
```bash
scp -r dist/* user@server:/usr/share/nginx/html/mataram-webgis/
sudo systemctl restart nginx
```

---

### Option 3: Microsoft IIS Server

1. Upload `dist/` folder to `C:\inetpub\wwwroot\mataram-webgis`
2. `web.config` is already included
3. Add `Application Pool` with .NET Framework (if needed)
4. Configure bindings (HTTP/HTTPS)
5. Test: `http://localhost/mataram-webgis`

---

### Option 4: Node.js + Express Server

```javascript
const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();

// Middleware
app.use(compression());
app.use(express.static('dist', {
    maxAge: '30d',
    etag: false
}));

// SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`WebGIS running on http://localhost:${PORT}`);
});
```

**Deploy with PM2:**
```bash
npm install pm2 -g
pm2 start server.js --name "mataram-webgis"
pm2 save
pm2 startup
```

---

### Option 5: Docker Container

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY dist ./dist
COPY package.json .
RUN npm install

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "server.js"]
```

**Build & Run:**
```bash
docker build -t mataram-webgis:1.0.0 .
docker run -d -p 80:3000 --name mataram-webgis mataram-webgis:1.0.0
```

---

### Option 6: Static Hosting (GitHub Pages / Vercel / Netlify)

#### GitHub Pages:
```bash
# Copy dist/ to gh-pages branch
git checkout gh-pages
cp -r dist/* .
git add .
git commit -m "Deploy production v1.0.0"
git push origin gh-pages
```

#### Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Vercel:
```bash
npm install -g vercel
vercel --prod
```

---

## 🔐 Security Configuration

### SSL/TLS (HTTPS)

**Using Let's Encrypt (Apache):**
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot certonly --apache -d mataram-webgis.example.com
```

**Using Let's Encrypt (Nginx):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d mataram-webgis.example.com
```

**Force HTTPS in `.htaccess`:**
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### CORS Configuration

**If serving API from different domain:**
```apache
Header set Access-Control-Allow-Origin "https://example.com"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
Header set Access-Control-Max-Age "3600"
```

---

## 📊 Performance Optimization

### Current Optimizations:
- ✅ Leaflet.js (lightweight mapping library)
- ✅ GeoJSON compression via Gzip
- ✅ CSS inlined in HTML (no external requests)
- ✅ Browser caching configured
- ✅ Minimal dependencies

### Further Optimization:

**1. Image Optimization:**
```bash
# Compress PNG logo
pngquant --quality 80-90 assets/logo-mataram.png -o assets/logo-mataram.min.png
```

**2. GeoJSON Optimization:**
```bash
# Reduce GeoJSON precision
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/target_2024.geojson'));
data.features.forEach(f => {
    f.geometry.coordinates = f.geometry.coordinates.map(c => 
        c.map(p => [Math.round(p[0]*10000)/10000, Math.round(p[1]*10000)/10000])
    );
});
fs.writeFileSync('data/target_2024.geojson', JSON.stringify(data));
"
```

**3. Lazy Load GeoJSON:**
```javascript
// Load data on demand instead of on page load
const loadLayer = (layerName) => {
    fetch(`data/${layerName}.geojson`)
        .then(r => r.json())
        .then(data => L.geoJSON(data).addTo(map));
};
```

---

## 🔍 Monitoring & Logging

### Google Analytics
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

### Server Monitoring

**Log rotation (Apache):**
```bash
sudo nano /etc/logrotate.d/apache2
# Daily rotation, 30 days retention
```

**Monitor disk usage:**
```bash
df -h /var/www/html/mataram-webgis
du -sh dist/
```

---

## 🧪 Testing Checklist

- [ ] Load homepage
- [ ] Map layers toggle
- [ ] GeoJSON features clickable
- [ ] Chart interactions responsive
- [ ] Download buttons functional
- [ ] Tab navigation working
- [ ] Mobile responsive (iOS/Android)
- [ ] Performance (< 3s load time)
- [ ] Console errors: 0
- [ ] Accessibility score > 80

### Automated Testing:
```bash
# Lighthouse
npm install -g lighthouse
lighthouse https://mataram-webgis.example.com --view

# Pingdom/GTmetrix
# Manual check at: https://www.gtmetrix.com
```

---

## 📝 Post-Deployment

### Maintenance Tasks:

1. **Weekly:**
   - Check error logs
   - Monitor server resources

2. **Monthly:**
   - Review analytics
   - Update data (if real-time needed)
   - Security audit

3. **Quarterly:**
   - Performance review
   - Dependency updates
   - Backup verification

### Update Data:

To update GeoJSON files without redeploying entire application:
```bash
# Simply replace files in data/ folder
scp data/*.geojson user@server:/var/www/html/mataram-webgis/data/
```

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **Map not loading:**
   - Check browser console for CORS errors
   - Verify GeoJSON paths are correct
   - Check server logs

2. **Slow performance:**
   - Enable gzip compression (check in DevTools)
   - Optimize GeoJSON file size
   - Use CDN for static files

3. **CORS errors:**
   - Verify `.htaccess` or `web.config`
   - Check `Access-Control-Allow-Origin` headers

### Quick Fixes:

```bash
# Clear browser cache
Ctrl+Shift+Delete (Chrome/Firefox)
Cmd+Shift+Delete (Safari)

# Check server headers
curl -I https://mataram-webgis.example.com

# Test gzip compression
curl -I -H "Accept-Encoding: gzip" https://mataram-webgis.example.com
```

---

## 📦 Backup Strategy

```bash
# Automated daily backup (crontab)
0 2 * * * tar -czf /backups/mataram-webgis-$(date +\%Y\%m\%d).tar.gz /var/www/html/mataram-webgis

# Restore from backup
tar -xzf /backups/mataram-webgis-20240101.tar.gz -C /
```

---

## 📄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial production release |

---

**Last Updated**: 2024  
**Maintained By**: WebGIS Team  
**Support Contact**: [your-email@example.com](mailto:your-email@example.com)

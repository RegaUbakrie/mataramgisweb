/**
 * WebGIS Mataram - Production Express Server
 * Lightweight Node.js server for serving static files with optimizations
 */

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Logging
const logStream = fs.createWriteStream(
    path.join(__dirname, 'logs', 'access.log'),
    { flags: 'a' }
);

app.use(morgan('combined', { stream: logStream }));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://maps.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Compression middleware
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Static files with caching
app.use(express.static('dist', {
    maxAge: '30d',
    etag: false,
    setHeaders: (res, filePath) => {
        // Set cache control based on file type
        if (filePath.endsWith('.html')) {
            res.set('Cache-Control', 'public, max-age=3600');
        } else if (filePath.match(/\.(js|css|woff2?|ttf|eot)$/)) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (filePath.match(/\.(json|geojson|csv)$/)) {
            res.set('Cache-Control', 'public, max-age=3600');
        }
        
        // Set proper content type for GeoJSON
        if (filePath.endsWith('.geojson')) {
            res.set('Content-Type', 'application/geo+json; charset=utf-8');
        }
    }
}));

// SPA routing - serve index.html for all non-file requests
app.get('*', (req, res) => {
    // Don't serve index.html for API routes or existing files
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   WebGIS Mataram - Production Server   ║
╠════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(28)} ║
║ Port:        ${PORT.toString().padEnd(28)} ║
║ URL:         http://localhost:${PORT} ║
║ Status:      ✓ Running                  ║
╚════════════════════════════════════════╝
    `);
    
    console.log(`
📍 Routes:
  - Static files: dist/
  - SPA fallback: index.html
  - Logs: logs/access.log
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;

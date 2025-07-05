const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const watermarkRoutes = require('./routes/watermark');
const { initializeSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? 
            (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["https://yourdomain.com"]) : 
            ["http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Verzeichnisse erstellen
const dirs = ['uploads', 'temp', 'processed'];
dirs.forEach(dir => {
    fs.ensureDirSync(path.join(__dirname, '..', dir));
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 
        (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["https://yourdomain.com"]) : 
        ["http://localhost:3000"],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statische Dateien servieren
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
}

// API-Routen
app.use('/api/upload', uploadRoutes);
app.use('/api/watermark', watermarkRoutes);

// Downloads-Route
app.use('/downloads', express.static(path.join(__dirname, '..', 'processed')));

// Gesundheitscheck
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('../package.json').version 
    });
});

// Socket.io-Handler initialisieren
initializeSocketHandlers(io);

// Fallback für React-Router (nur in Production)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
    });
}

// Fehlerbehandlung
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Interner Server-Fehler',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schiefgelaufen'
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
    console.log(`📁 Upload-Verzeichnis: ${path.join(__dirname, '..', 'uploads')}`);
    console.log(`⚡ WebSocket-Server bereit für Echtzeitkommunikation`);
}); 
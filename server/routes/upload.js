const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const router = express.Router();

// Multer-Konfiguration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Dateityp-Validierung
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        // Bilder
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
        // Videos
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Dateityp nicht unterstützt: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB Limit
    }
});

// Datei-Upload für Hauptdatei
router.post('/file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen' });
        }

        const fileInfo = {
            id: uuidv4(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
            uploadedAt: new Date().toISOString()
        };

        // Für Bilder: Metadata extrahieren
        if (fileInfo.type === 'image') {
            try {
                const metadata = await sharp(req.file.path).metadata();
                fileInfo.width = metadata.width;
                fileInfo.height = metadata.height;
                fileInfo.format = metadata.format;
            } catch (err) {
                console.warn('Fehler beim Extrahieren der Bild-Metadaten:', err.message);
            }
        }

        res.json({
            success: true,
            file: fileInfo,
            message: 'Datei erfolgreich hochgeladen'
        });

    } catch (error) {
        console.error('Upload-Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Hochladen der Datei',
            message: error.message 
        });
    }
});

// Wasserzeichen-Upload
router.post('/watermark', upload.single('watermark'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Keine Wasserzeichen-Datei hochgeladen' });
        }

        // Nur Bilder für Wasserzeichen erlauben
        if (!req.file.mimetype.startsWith('image/')) {
            fs.unlinkSync(req.file.path); // Datei löschen
            return res.status(400).json({ error: 'Nur Bilddateien sind als Wasserzeichen erlaubt' });
        }

        const watermarkInfo = {
            id: uuidv4(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadedAt: new Date().toISOString()
        };

        // Metadata extrahieren
        try {
            const metadata = await sharp(req.file.path).metadata();
            watermarkInfo.width = metadata.width;
            watermarkInfo.height = metadata.height;
            watermarkInfo.format = metadata.format;
        } catch (err) {
            console.warn('Fehler beim Extrahieren der Wasserzeichen-Metadaten:', err.message);
        }

        res.json({
            success: true,
            watermark: watermarkInfo,
            message: 'Wasserzeichen erfolgreich hochgeladen'
        });

    } catch (error) {
        console.error('Wasserzeichen-Upload-Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Hochladen des Wasserzeichens',
            message: error.message 
        });
    }
});

// Datei-Information abrufen
router.get('/info/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Datei nicht gefunden' });
        }

        const stats = fs.statSync(filePath);
        const fileInfo = {
            filename: filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        };

        res.json({ success: true, file: fileInfo });

    } catch (error) {
        console.error('Datei-Info-Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Abrufen der Datei-Information',
            message: error.message 
        });
    }
});

// Datei löschen
router.delete('/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Datei nicht gefunden' });
        }

        fs.unlinkSync(filePath);
        
        res.json({ 
            success: true, 
            message: 'Datei erfolgreich gelöscht' 
        });

    } catch (error) {
        console.error('Datei-Lösch-Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Löschen der Datei',
            message: error.message 
        });
    }
});

module.exports = router; 
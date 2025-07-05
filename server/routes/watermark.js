const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { processImageWatermark } = require('../services/imageProcessor');
const { processVideoWatermark } = require('../services/videoProcessor');
const { validateWatermarkParams } = require('../utils/validation');

const router = express.Router();

// Wasserzeichen-Verarbeitung starten
router.post('/process', async (req, res) => {
    try {
        const { 
            sourceFile, 
            watermarkType, 
            watermarkFile, 
            textWatermark,
            params 
        } = req.body;

        // Parameter validieren
        const validation = validateWatermarkParams(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Ungültige Parameter',
                details: validation.errors 
            });
        }

        // Eindeutige Job-ID generieren
        const jobId = uuidv4();
        const sourcePath = path.join(__dirname, '..', '..', 'uploads', sourceFile);
        
        // Prüfen ob Quelldatei existiert
        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: 'Quelldatei nicht gefunden' });
        }

        // Ausgabedatei-Pfad generieren
        const outputFilename = `watermarked_${jobId}_${Date.now()}${path.extname(sourceFile)}`;
        const outputPath = path.join(__dirname, '..', '..', 'processed', outputFilename);

        // Dateityp bestimmen
        const mimeType = require('mime-types').lookup(sourcePath);
        const isImage = mimeType && mimeType.startsWith('image/');
        const isVideo = mimeType && mimeType.startsWith('video/');

        if (!isImage && !isVideo) {
            return res.status(400).json({ error: 'Dateityp nicht unterstützt' });
        }

        // Job-Informationen für Client zurückgeben
        res.json({
            success: true,
            jobId: jobId,
            message: 'Wasserzeichen-Verarbeitung gestartet',
            outputFile: outputFilename
        });

        // Verarbeitung asynchron starten
        const processingParams = {
            jobId,
            sourcePath,
            outputPath,
            watermarkType,
            watermarkFile,
            textWatermark,
            params
        };

        if (isImage) {
            processImageWatermark(processingParams);
        } else if (isVideo) {
            processVideoWatermark(processingParams);
        }

    } catch (error) {
        console.error('Wasserzeichen-Verarbeitungs-Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Starten der Wasserzeichen-Verarbeitung',
            message: error.message 
        });
    }
});

// Job-Status abfragen
router.get('/status/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    
    // Hier würde normalerweise eine Datenbank oder ein Cache abgefragt werden
    // Für diese Demo verwenden wir eine einfache In-Memory-Lösung
    const jobStatus = global.jobStatuses?.[jobId] || { status: 'unknown' };
    
    res.json({
        success: true,
        jobId: jobId,
        ...jobStatus
    });
});

// Vorschau generieren
router.post('/preview', async (req, res) => {
    try {
        const { 
            sourceFile, 
            watermarkType, 
            watermarkFile, 
            textWatermark,
            params 
        } = req.body;

        const sourcePath = path.join(__dirname, '..', '..', 'uploads', sourceFile);
        
        if (!fs.existsSync(sourcePath)) {
            return res.status(404).json({ error: 'Quelldatei nicht gefunden' });
        }

        // Temporäre Vorschau-Datei generieren
        const previewId = uuidv4();
        const previewFilename = `preview_${previewId}.jpg`;
        const previewPath = path.join(__dirname, '..', '..', 'temp', previewFilename);

        // Kleine Vorschau erstellen (nur für Bilder)
        const mimeType = require('mime-types').lookup(sourcePath);
        if (mimeType && mimeType.startsWith('image/')) {
            const { generateImagePreview } = require('../services/previewGenerator');
            
            await generateImagePreview({
                sourcePath,
                previewPath,
                watermarkType,
                watermarkFile,
                textWatermark,
                params
            });

            res.json({
                success: true,
                previewId: previewId,
                previewUrl: `/api/watermark/preview/${previewId}`,
                message: 'Vorschau generiert'
            });
        } else {
            res.status(400).json({ 
                error: 'Vorschau nur für Bilder verfügbar' 
            });
        }

    } catch (error) {
        console.error('Vorschau-Fehler:', error);
        res.status(500).json({ 
            error: 'Fehler beim Generieren der Vorschau',
            message: error.message 
        });
    }
});

// Vorschau-Datei servieren
router.get('/preview/:previewId', (req, res) => {
    const previewId = req.params.previewId;
    const previewPath = path.join(__dirname, '..', '..', 'temp', `preview_${previewId}.jpg`);
    
    if (!fs.existsSync(previewPath)) {
        return res.status(404).json({ error: 'Vorschau nicht gefunden' });
    }

    res.sendFile(previewPath);
});

// Wasserzeichen-Vorlagen abrufen
router.get('/templates', (req, res) => {
    const templates = [
        {
            id: 'copyright',
            name: 'Copyright',
            text: '© 2024 Ihr Name',
            fontSize: 24,
            fontColor: '#ffffff',
            position: 'bottom-right',
            opacity: 0.8
        },
        {
            id: 'watermark',
            name: 'Wasserzeichen',
            text: 'WASSERZEICHEN',
            fontSize: 48,
            fontColor: '#ffffff',
            position: 'center',
            opacity: 0.3,
            rotation: -45
        },
        {
            id: 'draft',
            name: 'Entwurf',
            text: 'ENTWURF',
            fontSize: 36,
            fontColor: '#ff0000',
            position: 'top-left',
            opacity: 0.6
        }
    ];

    res.json({
        success: true,
        templates: templates
    });
});

module.exports = router; 
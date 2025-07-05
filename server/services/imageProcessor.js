const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const { broadcastJobProgress, broadcastJobComplete, broadcastJobError } = require('./socketBroadcaster');

// Job-Status-Speicher mit automatischer Bereinigung
const jobStatuses = new Map();

// Aufräumfunktion für abgelaufene Jobs
function cleanupExpiredJobs() {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 Stunden
    
    for (const [jobId, job] of jobStatuses.entries()) {
        const jobTime = job.endTime || job.startTime || now;
        if (now - jobTime > maxAge) {
            jobStatuses.delete(jobId);
        }
    }
}

// Periodische Bereinigung alle 30 Minuten
setInterval(cleanupExpiredJobs, 30 * 60 * 1000);

async function processImageWatermark(params) {
    const { jobId, sourcePath, outputPath, watermarkType, watermarkFile, textWatermark, params: options } = params;
    
    try {
        // Job-Status initialisieren
        jobStatuses.set(jobId, {
            status: 'processing',
            progress: 0,
            startTime: Date.now(),
            message: 'Bildverarbeitung gestartet...'
        });

        // Socket-Benachrichtigung senden
        broadcastJobProgress(jobId, 0, 'Bildverarbeitung gestartet...', 'image');

        let processedImage = sharp(sourcePath);

        // Bildwasserzeichen anwenden
        if (watermarkType === 'image' && watermarkFile) {
            await applyImageWatermark(processedImage, watermarkFile, options, jobId);
        }
        
        // Textwasserzeichen anwenden
        if (watermarkType === 'text' && textWatermark) {
            await applyTextWatermark(processedImage, textWatermark, options, jobId);
        }

        // Beide Wasserzeichen anwenden
        if (watermarkType === 'both' && watermarkFile && textWatermark) {
            await applyImageWatermark(processedImage, watermarkFile, options, jobId);
            await applyTextWatermark(processedImage, textWatermark, options, jobId);
        }

        // Fortschritt: 80%
        updateJobProgress(jobId, 80, 'Bild wird gespeichert...');

        // Finales Bild speichern
        await processedImage.toFile(outputPath);

        // Erfolgreich abgeschlossen
        jobStatuses.set(jobId, {
            status: 'completed',
            progress: 100,
            endTime: Date.now(),
            message: 'Bildverarbeitung erfolgreich abgeschlossen',
            outputFile: path.basename(outputPath)
        });

        broadcastJobComplete(jobId, path.basename(outputPath), 'Bildverarbeitung erfolgreich abgeschlossen', 'image');

    } catch (error) {
        console.error('Bildverarbeitungs-Fehler:', error);
        
        jobStatuses.set(jobId, {
            status: 'error',
            progress: 0,
            endTime: Date.now(),
            message: 'Fehler bei der Bildverarbeitung',
            error: error.message
        });

        broadcastJobError(jobId, error.message, 'Fehler bei der Bildverarbeitung', 'image');
    }
}

async function applyImageWatermark(image, watermarkFile, options, jobId) {
    try {
        updateJobProgress(jobId, 20, 'Bildwasserzeichen wird angewendet...');

        const watermarkPath = path.join(__dirname, '..', '..', 'uploads', watermarkFile);
        
        if (!fs.existsSync(watermarkPath)) {
            throw new Error('Wasserzeichen-Datei nicht gefunden');
        }

        // Wasserzeichen-Bild laden und skalieren
        let watermark = sharp(watermarkPath);
        
        // Größe anpassen basierend auf Parametern
        if (options.size) {
            const sizePercent = parseFloat(options.size) / 100;
            const { width: sourceWidth, height: sourceHeight } = await image.metadata();
            const targetWidth = Math.round(sourceWidth * sizePercent);
            
            watermark = watermark.resize(targetWidth, null, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Transparenz anwenden
        if (options.opacity && options.opacity < 1) {
            watermark = watermark.modulate({ 
                saturation: 1, 
                brightness: options.opacity 
            });
        }

        // Rotation anwenden
        if (options.rotation && options.rotation !== 0) {
            watermark = watermark.rotate(parseFloat(options.rotation));
        }

        // Position berechnen
        const gravity = getGravityFromPosition(options.position);
        
        // Wasserzeichen zusammenfügen
        image.composite([{
            input: await watermark.toBuffer(),
            gravity: gravity,
            blend: 'over'
        }]);

        updateJobProgress(jobId, 50, 'Bildwasserzeichen angewendet');

    } catch (error) {
        throw new Error(`Fehler beim Anwenden des Bildwasserzeichens: ${error.message}`);
    }
}

async function applyTextWatermark(image, textWatermark, options, jobId) {
    try {
        updateJobProgress(jobId, 60, 'Textwasserzeichen wird angewendet...');

        // Text-Wasserzeichen mit SVG erstellen
        const textSvg = createTextSvg(textWatermark, options);
        
        // Position berechnen
        const gravity = getGravityFromPosition(options.position);
        
        // Text-Wasserzeichen zusammenfügen
        image.composite([{
            input: Buffer.from(textSvg),
            gravity: gravity,
            blend: 'over'
        }]);

        updateJobProgress(jobId, 70, 'Textwasserzeichen angewendet');

    } catch (error) {
        throw new Error(`Fehler beim Anwenden des Textwasserzeichens: ${error.message}`);
    }
}

function createTextSvg(text, options) {
    const {
        fontSize = 24,
        fontColor = '#ffffff',
        opacity = 0.8,
        rotation = 0,
        fontFamily = 'Arial'
    } = options;

    const rotationTransform = rotation ? `rotate(${rotation})` : '';
    
    return `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <text
                x="50%"
                y="50%"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="${fontFamily}"
                font-size="${fontSize}px"
                fill="${fontColor}"
                opacity="${opacity}"
                transform="${rotationTransform}"
            >
                ${text}
            </text>
        </svg>
    `;
}

function getGravityFromPosition(position) {
    const positions = {
        'top-left': 'northwest',
        'top-center': 'north',
        'top-right': 'northeast',
        'center-left': 'west',
        'center': 'center',
        'center-right': 'east',
        'bottom-left': 'southwest',
        'bottom-center': 'south',
        'bottom-right': 'southeast'
    };
    
    return positions[position] || 'center';
}

function updateJobProgress(jobId, progress, message) {
    const jobStatus = jobStatuses.get(jobId);
    if (jobStatus) {
        jobStatus.progress = progress;
        jobStatus.message = message;
        jobStatuses.set(jobId, jobStatus);
        
        broadcastJobProgress(jobId, progress, message, 'image');
    }
}

// Funktion zum Abrufen des Job-Status
function getJobStatus(jobId) {
    return jobStatuses.get(jobId);
}

module.exports = {
    processImageWatermark,
    applyImageWatermark,
    applyTextWatermark,
    getJobStatus
}; 
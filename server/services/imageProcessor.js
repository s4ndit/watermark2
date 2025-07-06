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

        // Bild-Metadaten abrufen
        const imageMetadata = await image.metadata();
        const { width: sourceWidth, height: sourceHeight } = imageMetadata;
        
        // Wasserzeichen-Bild laden
        let watermark = sharp(watermarkPath);
        const watermarkMetadata = await watermark.metadata();
        
        // Wasserzeichen skalieren basierend auf Parametern
        const sizePercent = parseFloat(options.size || 20) / 100;
        const maxWidth = Math.round(sourceWidth * sizePercent);
        const maxHeight = Math.round(sourceHeight * sizePercent);
        
        // Wasserzeichen auf maximale Größe begrenzen
        watermark = watermark.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        });

        // Transparenz anwenden (mit Alpha-Kanal)
        if (options.opacity && options.opacity < 1) {
            const opacityValue = Math.round(parseFloat(options.opacity) * 255);
            watermark = watermark.ensureAlpha().modulate({
                brightness: 1,
                saturation: 1,
                hue: 0
            }).composite([{
                input: Buffer.from([255, 255, 255, opacityValue]),
                raw: { width: 1, height: 1, channels: 4 },
                tile: true,
                blend: 'dest-in'
            }]);
        }

        // Rotation anwenden
        if (options.rotation && options.rotation !== 0) {
            watermark = watermark.rotate(parseFloat(options.rotation), {
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            });
        }

        // Position berechnen
        const position = calculatePosition(options.position, sourceWidth, sourceHeight, maxWidth, maxHeight, options.margin);
        
        // Wasserzeichen zusammenfügen
        image.composite([{
            input: await watermark.toBuffer(),
            top: position.top,
            left: position.left,
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

        // Bild-Metadaten abrufen
        const imageMetadata = await image.metadata();
        const { width: sourceWidth, height: sourceHeight } = imageMetadata;

        // Text-Wasserzeichen mit SVG erstellen
        const textSvg = createTextSvg(textWatermark, options, sourceWidth, sourceHeight);
        
        // Position berechnen
        const position = calculateTextPosition(options.position, sourceWidth, sourceHeight, options.margin);
        
        // Text-Wasserzeichen zusammenfügen
        image.composite([{
            input: Buffer.from(textSvg),
            top: position.top,
            left: position.left,
            blend: 'over'
        }]);

        updateJobProgress(jobId, 70, 'Textwasserzeichen angewendet');

    } catch (error) {
        throw new Error(`Fehler beim Anwenden des Textwasserzeichens: ${error.message}`);
    }
}

function createTextSvg(text, options, sourceWidth, sourceHeight) {
    const {
        fontSize = 24,
        fontColor = '#ffffff',
        opacity = 0.8,
        rotation = 0,
        fontFamily = 'Arial'
    } = options;

    const rotationTransform = rotation ? `rotate(${rotation} 50 50)` : '';
    
    // Berechne die SVG-Größe basierend auf der Schriftgröße
    const estimatedWidth = text.length * fontSize * 0.6;
    const estimatedHeight = fontSize * 1.2;
    
    const svgWidth = Math.min(estimatedWidth, sourceWidth * 0.8);
    const svgHeight = Math.min(estimatedHeight, sourceHeight * 0.2);
    
    return `
        <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
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

function calculatePosition(position, sourceWidth, sourceHeight, watermarkWidth, watermarkHeight, margin = 10) {
    const positions = {
        'top-left': { top: margin, left: margin },
        'top-center': { top: margin, left: Math.round((sourceWidth - watermarkWidth) / 2) },
        'top-right': { top: margin, left: sourceWidth - watermarkWidth - margin },
        'center-left': { top: Math.round((sourceHeight - watermarkHeight) / 2), left: margin },
        'center': { top: Math.round((sourceHeight - watermarkHeight) / 2), left: Math.round((sourceWidth - watermarkWidth) / 2) },
        'center-right': { top: Math.round((sourceHeight - watermarkHeight) / 2), left: sourceWidth - watermarkWidth - margin },
        'bottom-left': { top: sourceHeight - watermarkHeight - margin, left: margin },
        'bottom-center': { top: sourceHeight - watermarkHeight - margin, left: Math.round((sourceWidth - watermarkWidth) / 2) },
        'bottom-right': { top: sourceHeight - watermarkHeight - margin, left: sourceWidth - watermarkWidth - margin }
    };
    
    return positions[position] || positions['bottom-right'];
}

function calculateTextPosition(position, sourceWidth, sourceHeight, margin = 10) {
    const positions = {
        'top-left': { top: margin, left: margin },
        'top-center': { top: margin, left: Math.round(sourceWidth * 0.1) },
        'top-right': { top: margin, left: Math.round(sourceWidth * 0.8) },
        'center-left': { top: Math.round(sourceHeight * 0.4), left: margin },
        'center': { top: Math.round(sourceHeight * 0.4), left: Math.round(sourceWidth * 0.1) },
        'center-right': { top: Math.round(sourceHeight * 0.4), left: Math.round(sourceWidth * 0.8) },
        'bottom-left': { top: sourceHeight - 80 - margin, left: margin },
        'bottom-center': { top: sourceHeight - 80 - margin, left: Math.round(sourceWidth * 0.1) },
        'bottom-right': { top: sourceHeight - 80 - margin, left: Math.round(sourceWidth * 0.8) }
    };
    
    return positions[position] || positions['bottom-right'];
}

function getGravityFromPosition(position) {
    const gravities = {
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
    
    return gravities[position] || 'southeast';
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
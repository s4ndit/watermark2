const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const { broadcastJobProgress, broadcastJobComplete, broadcastJobError } = require('../socket/handlers');

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

async function processVideoWatermark(params) {
    const { jobId, sourcePath, outputPath, watermarkType, watermarkFile, textWatermark, params: options } = params;
    
    try {
        // Job-Status initialisieren
        jobStatuses.set(jobId, {
            status: 'processing',
            progress: 0,
            startTime: Date.now(),
            message: 'Videobearbeitung gestartet...'
        });

        // Socket-Benachrichtigung senden
        broadcastJobProgress(jobId, 0, 'Videobearbeitung gestartet...', 'video');

        // FFmpeg-Befehl erstellen
        const command = ffmpeg(sourcePath);

        // Video-Codec und Qualität einstellen
        command
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('mp4')
            .outputOptions([
                '-movflags', 'faststart',
                '-preset', 'medium',
                '-crf', '23'
            ]);

        // Filter für Wasserzeichen erstellen
        const filters = [];

        // Bildwasserzeichen
        if (watermarkType === 'image' && watermarkFile) {
            const watermarkPath = path.join(__dirname, '..', '..', 'uploads', watermarkFile);
            
            if (!fs.existsSync(watermarkPath)) {
                throw new Error('Wasserzeichen-Datei nicht gefunden');
            }

            command.input(watermarkPath);
            
            const imageFilter = createImageWatermarkFilter(options);
            filters.push(imageFilter);
        }

        // Textwasserzeichen
        if (watermarkType === 'text' && textWatermark) {
            const textFilter = createTextWatermarkFilter(textWatermark, options);
            filters.push(textFilter);
        }

        // Beide Wasserzeichen
        if (watermarkType === 'both' && watermarkFile && textWatermark) {
            const watermarkPath = path.join(__dirname, '..', '..', 'uploads', watermarkFile);
            
            if (!fs.existsSync(watermarkPath)) {
                throw new Error('Wasserzeichen-Datei nicht gefunden');
            }

            command.input(watermarkPath);
            
            const imageFilter = createImageWatermarkFilter(options);
            const textFilter = createTextWatermarkFilter(textWatermark, options);
            filters.push(imageFilter, textFilter);
        }

        // Filter anwenden
        if (filters.length > 0) {
            command.complexFilter(filters);
        }

        // Fortschritt-Tracking
        command.on('progress', (progress) => {
            const percent = Math.round(progress.percent || 0);
            updateJobProgress(jobId, percent, `Video wird verarbeitet... ${percent}%`);
        });

        // Fehlerbehandlung
        command.on('error', (error) => {
            console.error('FFmpeg-Fehler:', error);
            
            jobStatuses.set(jobId, {
                status: 'error',
                progress: 0,
                endTime: Date.now(),
                message: 'Fehler bei der Videobearbeitung',
                error: error.message
            });

            broadcastJobError(jobId, error.message, 'Fehler bei der Videobearbeitung', 'video');
        });

        // Erfolgreiches Ende
        command.on('end', () => {
            jobStatuses.set(jobId, {
                status: 'completed',
                progress: 100,
                endTime: Date.now(),
                message: 'Videobearbeitung erfolgreich abgeschlossen',
                outputFile: path.basename(outputPath)
            });

            broadcastJobComplete(jobId, path.basename(outputPath), 'Videobearbeitung erfolgreich abgeschlossen', 'video');
        });

        // Verarbeitung starten
        command.save(outputPath);

    } catch (error) {
        console.error('Videobearbeitungs-Fehler:', error);
        
        jobStatuses.set(jobId, {
            status: 'error',
            progress: 0,
            endTime: Date.now(),
            message: 'Fehler bei der Videobearbeitung',
            error: error.message
        });

        broadcastJobError(jobId, error.message, 'Fehler bei der Videobearbeitung', 'video');
    }
}

function createImageWatermarkFilter(options) {
    const {
        position = 'bottom-right',
        size = 20,
        opacity = 0.8,
        margin = 10
    } = options;

    // Wasserzeichen skalieren
    const scaleFilter = `[1:v]scale=iw*${size/100}:ih*${size/100}[watermark]`;
    
    // Position berechnen
    const overlay = getOverlayPosition(position, margin);
    
    // Transparenz anwenden
    const alphaFilter = opacity < 1 ? `[watermark]format=yuva420p,colorchannelmixer=aa=${opacity}[watermark_alpha]` : '';
    const overlayInput = alphaFilter ? '[watermark_alpha]' : '[watermark]';
    
    const overlayFilter = `[0:v]${overlayInput}overlay=${overlay}`;
    
    return alphaFilter ? 
        [scaleFilter, alphaFilter, overlayFilter] :
        [scaleFilter, overlayFilter];
}

function createTextWatermarkFilter(text, options) {
    const {
        fontSize = 24,
        fontColor = 'white',
        position = 'bottom-right',
        opacity = 0.8,
        rotation = 0,
        fontFamily = 'Arial',
        margin = 10
    } = options;

    // Position berechnen
    const textPosition = getTextPosition(position, margin);
    
    // Text-Filter erstellen
    const textFilter = `drawtext=text='${text}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=${fontSize}:fontcolor=${fontColor}@${opacity}:${textPosition}`;
    
    // Rotation hinzufügen
    if (rotation && rotation !== 0) {
        return `${textFilter}:angle=${rotation}*PI/180`;
    }
    
    return textFilter;
}

function getOverlayPosition(position, margin) {
    const positions = {
        'top-left': `${margin}:${margin}`,
        'top-center': `(W-w)/2:${margin}`,
        'top-right': `W-w-${margin}:${margin}`,
        'center-left': `${margin}:(H-h)/2`,
        'center': `(W-w)/2:(H-h)/2`,
        'center-right': `W-w-${margin}:(H-h)/2`,
        'bottom-left': `${margin}:H-h-${margin}`,
        'bottom-center': `(W-w)/2:H-h-${margin}`,
        'bottom-right': `W-w-${margin}:H-h-${margin}`
    };
    
    return positions[position] || positions['bottom-right'];
}

function getTextPosition(position, margin) {
    const positions = {
        'top-left': `x=${margin}:y=${margin}`,
        'top-center': `x=(w-text_w)/2:y=${margin}`,
        'top-right': `x=w-text_w-${margin}:y=${margin}`,
        'center-left': `x=${margin}:y=(h-text_h)/2`,
        'center': `x=(w-text_w)/2:y=(h-text_h)/2`,
        'center-right': `x=w-text_w-${margin}:y=(h-text_h)/2`,
        'bottom-left': `x=${margin}:y=h-text_h-${margin}`,
        'bottom-center': `x=(w-text_w)/2:y=h-text_h-${margin}`,
        'bottom-right': `x=w-text_w-${margin}:y=h-text_h-${margin}`
    };
    
    return positions[position] || positions['bottom-right'];
}

function updateJobProgress(jobId, progress, message) {
    const jobStatus = jobStatuses.get(jobId);
    if (jobStatus) {
        jobStatus.progress = progress;
        jobStatus.message = message;
        jobStatuses.set(jobId, jobStatus);
        
        broadcastJobProgress(jobId, progress, message, 'video');
    }
}

// Funktion zum Abrufen des Job-Status
function getJobStatus(jobId) {
    return jobStatuses.get(jobId);
}

module.exports = {
    processVideoWatermark,
    createImageWatermarkFilter,
    createTextWatermarkFilter,
    getJobStatus
}; 
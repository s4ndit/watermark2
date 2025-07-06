const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
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

        // Wasserzeichen-Filter anwenden
        if (watermarkType === 'image' && watermarkFile) {
            await addImageWatermark(command, watermarkFile, options);
        } else if (watermarkType === 'text' && textWatermark) {
            await addTextWatermark(command, textWatermark, options);
        } else if (watermarkType === 'both' && watermarkFile && textWatermark) {
            await addBothWatermarks(command, watermarkFile, textWatermark, options);
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

async function addImageWatermark(command, watermarkFile, options) {
    const watermarkPath = path.join(__dirname, '..', '..', 'uploads', watermarkFile);
    
    if (!fs.existsSync(watermarkPath)) {
        throw new Error('Wasserzeichen-Datei nicht gefunden');
    }

    // Wasserzeichen-Datei als Input hinzufügen
    command.input(watermarkPath);
    
    const {
        position = 'bottom-right',
        size = 20,
        opacity = 0.8,
        margin = 10
    } = options;

    // Einfacher Overlay-Filter ohne complexFilter
    const overlayPosition = getSimpleOverlayPosition(position, margin);
    const scaleSize = size / 100;
    
    // Video-Filter mit einfacher Syntax
    const filterString = `[1:v]scale=iw*${scaleSize}:ih*${scaleSize}:force_original_aspect_ratio=decrease[scaled];[0:v][scaled]overlay=${overlayPosition}:format=auto,format=yuv420p[v]`;
    
    command.complexFilter(filterString);
    command.outputOptions(['-map', '[v]', '-map', '0:a?']);
}

async function addTextWatermark(command, textWatermark, options) {
    const {
        fontSize = 24,
        fontColor = 'white',
        position = 'bottom-right',
        opacity = 0.8,
        margin = 10
    } = options;

    // Position berechnen
    const textPosition = getTextPosition(position, margin);
    
    // Einfacher drawtext-Filter
    const filterString = `drawtext=text='${textWatermark}':fontsize=${fontSize}:fontcolor=${fontColor}@${opacity}:${textPosition}`;
    
    command.videoFilters(filterString);
}

async function addBothWatermarks(command, watermarkFile, textWatermark, options) {
    const watermarkPath = path.join(__dirname, '..', '..', 'uploads', watermarkFile);
    
    if (!fs.existsSync(watermarkPath)) {
        throw new Error('Wasserzeichen-Datei nicht gefunden');
    }

    // Wasserzeichen-Datei als Input hinzufügen
    command.input(watermarkPath);
    
    const {
        position = 'bottom-right',
        size = 20,
        opacity = 0.8,
        fontSize = 24,
        fontColor = 'white',
        margin = 10
    } = options;

    // Einfacher kombinierter Filter
    const overlayPosition = getSimpleOverlayPosition(position, margin);
    const textPosition = getTextPosition(position, margin);
    const scaleSize = size / 100;
    
    const filterString = `[1:v]scale=iw*${scaleSize}:ih*${scaleSize}:force_original_aspect_ratio=decrease[scaled];[0:v][scaled]overlay=${overlayPosition}:format=auto[watermarked];[watermarked]drawtext=text='${textWatermark}':fontsize=${fontSize}:fontcolor=${fontColor}@${opacity}:${textPosition}[v]`;
    
    command.complexFilter(filterString);
    command.outputOptions(['-map', '[v]', '-map', '0:a?']);
}

function getSimpleOverlayPosition(position, margin) {
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
    const job = jobStatuses.get(jobId);
    if (job) {
        job.progress = progress;
        job.message = message;
        jobStatuses.set(jobId, job);
    }
    
    broadcastJobProgress(jobId, progress, message, 'video');
}

function getJobStatus(jobId) {
    return jobStatuses.get(jobId) || { status: 'unknown', progress: 0, message: 'Job nicht gefunden' };
}

module.exports = {
    processVideoWatermark,
    getJobStatus
}; 
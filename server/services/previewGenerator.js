const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

async function generateImagePreview(options) {
    const { sourcePath, previewPath, watermarkType, watermarkFile, textWatermark, params } = options;
    
    try {
        // Kleinere Vorschau-Version erstellen (max. 800x600)
        let previewImage = sharp(sourcePath)
            .resize(800, 600, {
                fit: 'inside',
                withoutEnlargement: true
            });

        // Wasserzeichen anwenden (vereinfachte Version)
        if (watermarkType === 'image' && watermarkFile) {
            await applyImageWatermarkPreview(previewImage, watermarkFile, params);
        }
        
        if (watermarkType === 'text' && textWatermark) {
            await applyTextWatermarkPreview(previewImage, textWatermark, params);
        }

        if (watermarkType === 'both' && watermarkFile && textWatermark) {
            await applyImageWatermarkPreview(previewImage, watermarkFile, params);
            await applyTextWatermarkPreview(previewImage, textWatermark, params);
        }

        // Vorschau speichern
        await previewImage
            .jpeg({ quality: 80 })
            .toFile(previewPath);

        return true;

    } catch (error) {
        console.error('Fehler beim Generieren der Vorschau:', error);
        throw error;
    }
}

async function applyImageWatermarkPreview(image, watermarkFile, params) {
    const watermarkPath = path.join(__dirname, '..', '..', 'uploads', watermarkFile);
    
    if (!fs.existsSync(watermarkPath)) {
        throw new Error('Wasserzeichen-Datei nicht gefunden');
    }

    const {
        size = 20,
        opacity = 0.8,
        rotation = 0,
        position = 'bottom-right'
    } = params;

    let watermark = sharp(watermarkPath);

    // Größe anpassen
    const sizePercent = parseFloat(size) / 100;
    watermark = watermark.resize(Math.round(200 * sizePercent), null, {
        fit: 'inside',
        withoutEnlargement: true
    });

    // Transparenz anwenden
    if (opacity < 1) {
        watermark = watermark.modulate({ 
            saturation: 1, 
            brightness: opacity 
        });
    }

    // Rotation anwenden
    if (rotation !== 0) {
        watermark = watermark.rotate(parseFloat(rotation));
    }

    // Position berechnen
    const gravity = getGravityFromPosition(position);
    
    // Wasserzeichen anwenden
    image.composite([{
        input: await watermark.toBuffer(),
        gravity: gravity,
        blend: 'over'
    }]);
}

async function applyTextWatermarkPreview(image, textWatermark, params) {
    const {
        fontSize = 24,
        fontColor = '#ffffff',
        opacity = 0.8,
        rotation = 0,
        position = 'bottom-right'
    } = params;

    // Kleinere Schriftgröße für Vorschau
    const previewFontSize = Math.min(fontSize, 32);

    // Text-SVG erstellen
    const textSvg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <text
                x="50%"
                y="50%"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="Arial"
                font-size="${previewFontSize}px"
                fill="${fontColor}"
                opacity="${opacity}"
                transform="rotate(${rotation})"
            >
                ${textWatermark}
            </text>
        </svg>
    `;

    // Position berechnen
    const gravity = getGravityFromPosition(position);
    
    // Text-Wasserzeichen anwenden
    image.composite([{
        input: Buffer.from(textSvg),
        gravity: gravity,
        blend: 'over'
    }]);
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

module.exports = {
    generateImagePreview,
    applyImageWatermarkPreview,
    applyTextWatermarkPreview
}; 
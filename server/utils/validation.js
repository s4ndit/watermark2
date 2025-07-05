function validateWatermarkParams(data) {
    const errors = [];
    
    // Pflichtfelder prüfen
    if (!data.sourceFile) {
        errors.push('Quelldatei ist erforderlich');
    }
    
    if (!data.watermarkType) {
        errors.push('Wasserzeichen-Typ ist erforderlich');
    }
    
    // Wasserzeichen-Typ validieren
    const validTypes = ['image', 'text', 'both'];
    if (data.watermarkType && !validTypes.includes(data.watermarkType)) {
        errors.push('Ungültiger Wasserzeichen-Typ');
    }
    
    // Bei Bildwasserzeichen: Datei erforderlich
    if ((data.watermarkType === 'image' || data.watermarkType === 'both') && !data.watermarkFile) {
        errors.push('Wasserzeichen-Datei ist erforderlich');
    }
    
    // Bei Textwasserzeichen: Text erforderlich
    if ((data.watermarkType === 'text' || data.watermarkType === 'both') && !data.textWatermark) {
        errors.push('Wasserzeichen-Text ist erforderlich');
    }
    
    // Parameter validieren
    if (data.params) {
        const paramErrors = validateParams(data.params);
        errors.push(...paramErrors);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function validateParams(params) {
    const errors = [];
    
    // Opacity validieren
    if (params.opacity !== undefined) {
        const opacity = parseFloat(params.opacity);
        if (isNaN(opacity) || opacity < 0 || opacity > 1) {
            errors.push('Transparenz muss zwischen 0 und 1 liegen');
        }
    }
    
    // Size validieren
    if (params.size !== undefined) {
        const size = parseFloat(params.size);
        if (isNaN(size) || size < 1 || size > 100) {
            errors.push('Größe muss zwischen 1 und 100 Prozent liegen');
        }
    }
    
    // Rotation validieren
    if (params.rotation !== undefined) {
        const rotation = parseFloat(params.rotation);
        if (isNaN(rotation) || rotation < -360 || rotation > 360) {
            errors.push('Rotation muss zwischen -360 und 360 Grad liegen');
        }
    }
    
    // Position validieren
    if (params.position !== undefined) {
        const validPositions = [
            'top-left', 'top-center', 'top-right',
            'center-left', 'center', 'center-right',
            'bottom-left', 'bottom-center', 'bottom-right'
        ];
        
        if (!validPositions.includes(params.position)) {
            errors.push('Ungültige Position');
        }
    }
    
    // FontSize validieren
    if (params.fontSize !== undefined) {
        const fontSize = parseFloat(params.fontSize);
        if (isNaN(fontSize) || fontSize < 8 || fontSize > 200) {
            errors.push('Schriftgröße muss zwischen 8 und 200 liegen');
        }
    }
    
    // FontColor validieren
    if (params.fontColor !== undefined) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(params.fontColor)) {
            errors.push('Ungültige Farbe (Format: #RRGGBB oder #RGB)');
        }
    }
    
    // Margin validieren
    if (params.margin !== undefined) {
        const margin = parseFloat(params.margin);
        if (isNaN(margin) || margin < 0 || margin > 100) {
            errors.push('Rand muss zwischen 0 und 100 Pixel liegen');
        }
    }
    
    return errors;
}

function validateFileType(filename, allowedTypes) {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedTypes.includes(ext);
}

function validateFileSize(size, maxSize) {
    return size <= maxSize;
}

function sanitizeFilename(filename) {
    // Gefährliche Zeichen entfernen
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

function validateTextInput(text, maxLength = 100) {
    if (!text || typeof text !== 'string') {
        return { isValid: false, error: 'Text ist erforderlich' };
    }
    
    if (text.length > maxLength) {
        return { isValid: false, error: `Text zu lang (max. ${maxLength} Zeichen)` };
    }
    
    // Gefährliche Zeichen entfernen
    const sanitized = text.replace(/[<>\"'&]/g, '');
    
    return { isValid: true, sanitized };
}

module.exports = {
    validateWatermarkParams,
    validateParams,
    validateFileType,
    validateFileSize,
    sanitizeFilename,
    validateTextInput
}; 
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');

async function checkFFmpeg() {
    return new Promise((resolve) => {
        const ffmpegCheck = spawn('ffmpeg', ['-version']);
        
        ffmpegCheck.on('close', (code) => {
            if (code === 0) {
                resolve({ 
                    available: true, 
                    message: 'FFmpeg ist verfügbar' 
                });
            } else {
                resolve({ 
                    available: false, 
                    message: 'FFmpeg ist nicht verfügbar oder nicht korrekt installiert' 
                });
            }
        });
        
        ffmpegCheck.on('error', (error) => {
            resolve({ 
                available: false, 
                message: `FFmpeg-Fehler: ${error.message}` 
            });
        });
    });
}

async function checkImageMagick() {
    return new Promise((resolve) => {
        const magickCheck = spawn('convert', ['-version']);
        
        magickCheck.on('close', (code) => {
            if (code === 0) {
                resolve({ 
                    available: true, 
                    message: 'ImageMagick ist verfügbar' 
                });
            } else {
                resolve({ 
                    available: false, 
                    message: 'ImageMagick ist nicht verfügbar oder nicht korrekt installiert' 
                });
            }
        });
        
        magickCheck.on('error', (error) => {
            resolve({ 
                available: false, 
                message: `ImageMagick-Fehler: ${error.message}` 
            });
        });
    });
}

async function checkSharp() {
    try {
        const sharp = require('sharp');
        const info = sharp.versions;
        return { 
            available: true, 
            message: `Sharp ist verfügbar (Version: ${info.sharp})` 
        };
    } catch (error) {
        return { 
            available: false, 
            message: `Sharp-Fehler: ${error.message}` 
        };
    }
}

async function checkSystemRequirements() {
    console.log('🔍 Überprüfe System-Anforderungen...');
    
    const checks = await Promise.all([
        checkFFmpeg(),
        checkImageMagick(),
        checkSharp()
    ]);
    
    const [ffmpegStatus, imageMagickStatus, sharpStatus] = checks;
    
    console.log(`📹 FFmpeg: ${ffmpegStatus.message}`);
    console.log(`🖼️  ImageMagick: ${imageMagickStatus.message}`);
    console.log(`⚡ Sharp: ${sharpStatus.message}`);
    
    const allAvailable = checks.every(check => check.available);
    
    if (!allAvailable) {
        console.log('⚠️  Einige Tools sind nicht verfügbar. Installation erforderlich:');
        
        if (!ffmpegStatus.available) {
            console.log('   - FFmpeg: sudo apt-get install ffmpeg');
        }
        
        if (!imageMagickStatus.available) {
            console.log('   - ImageMagick: sudo apt-get install imagemagick');
        }
        
        if (!sharpStatus.available) {
            console.log('   - Sharp: npm install sharp');
        }
    } else {
        console.log('✅ Alle erforderlichen Tools sind verfügbar');
    }
    
    return {
        ffmpeg: ffmpegStatus.available,
        imageMagick: imageMagickStatus.available,
        sharp: sharpStatus.available,
        allAvailable
    };
}

module.exports = {
    checkFFmpeg,
    checkImageMagick,
    checkSharp,
    checkSystemRequirements
}; 
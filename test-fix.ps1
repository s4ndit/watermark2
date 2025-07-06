Write-Host "🔧 Wasserzeichen-Webapp Fehlerbehebung" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# System-Anforderungen überprüfen
Write-Host "`n📋 Überprüfe System-Anforderungen..." -ForegroundColor Yellow

# FFmpeg überprüfen
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-String "ffmpeg version" | Select-Object -First 1
    if ($ffmpegVersion) {
        Write-Host "✅ FFmpeg ist installiert" -ForegroundColor Green
        Write-Host "   $ffmpegVersion" -ForegroundColor Gray
    } else {
        Write-Host "❌ FFmpeg ist NICHT installiert" -ForegroundColor Red
        Write-Host "   Installation: Laden Sie FFmpeg von https://ffmpeg.org/download.html herunter" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FFmpeg ist NICHT installiert" -ForegroundColor Red
    Write-Host "   Installation: Laden Sie FFmpeg von https://ffmpeg.org/download.html herunter" -ForegroundColor Yellow
}

# ImageMagick überprüfen
try {
    $convertVersion = convert -version 2>&1 | Select-String "Version" | Select-Object -First 1
    if ($convertVersion) {
        Write-Host "✅ ImageMagick ist installiert" -ForegroundColor Green
        Write-Host "   $convertVersion" -ForegroundColor Gray
    } else {
        Write-Host "❌ ImageMagick ist NICHT installiert" -ForegroundColor Red
        Write-Host "   Installation: Laden Sie ImageMagick von https://imagemagick.org/script/download.php#windows herunter" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ImageMagick ist NICHT installiert" -ForegroundColor Red
    Write-Host "   Installation: Laden Sie ImageMagick von https://imagemagick.org/script/download.php#windows herunter" -ForegroundColor Yellow
}

# Node.js und npm überprüfen
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js ist nicht installiert" -ForegroundColor Red
}

try {
    $npmVersion = npm --version
    Write-Host "✅ NPM Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM ist nicht installiert" -ForegroundColor Red
}

# Verzeichnisse überprüfen
Write-Host "`n📁 Überprüfe Verzeichnisse..." -ForegroundColor Yellow
$directories = @("uploads", "temp", "processed")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir/ existiert" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir/ fehlt - wird erstellt..." -ForegroundColor Red
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   $dir/ wurde erstellt" -ForegroundColor Green
    }
}

# Dependencies überprüfen
Write-Host "`n📦 Überprüfe Node.js Dependencies..." -ForegroundColor Yellow
try {
    npm list sharp 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sharp ist installiert" -ForegroundColor Green
    } else {
        Write-Host "❌ Sharp fehlt - wird installiert..." -ForegroundColor Red
        npm install sharp
    }
} catch {
    Write-Host "❌ Sharp fehlt - wird installiert..." -ForegroundColor Red
    npm install sharp
}

try {
    npm list fluent-ffmpeg 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Fluent-FFmpeg ist installiert" -ForegroundColor Green
    } else {
        Write-Host "❌ Fluent-FFmpeg fehlt - wird installiert..." -ForegroundColor Red
        npm install fluent-ffmpeg
    }
} catch {
    Write-Host "❌ Fluent-FFmpeg fehlt - wird installiert..." -ForegroundColor Red
    npm install fluent-ffmpeg
}

# Client Build überprüfen
Write-Host "`n🏗️ Überprüfe Client Build..." -ForegroundColor Yellow
if (Test-Path "client\build") {
    Write-Host "✅ Client Build existiert" -ForegroundColor Green
} else {
    Write-Host "❌ Client Build fehlt - wird erstellt..." -ForegroundColor Red
    Set-Location client
    npm run build
    Set-Location ..
}

# Server Test
Write-Host "`n🚀 Teste Server-Verbindung..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server ist erreichbar" -ForegroundColor Green
    } else {
        Write-Host "❌ Server ist nicht erreichbar" -ForegroundColor Red
        Write-Host "   Starte Server mit: `$env:NODE_ENV='production'; npm start" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Server ist nicht erreichbar" -ForegroundColor Red
    Write-Host "   Starte Server mit: `$env:NODE_ENV='production'; npm start" -ForegroundColor Yellow
}

Write-Host "`n🎯 Fehlerbehebung abgeschlossen!" -ForegroundColor Green
Write-Host "   Starte die Anwendung mit: `$env:NODE_ENV='production'; npm start" -ForegroundColor Cyan
Write-Host "   Oder verwende: npm run build && npm start" -ForegroundColor Cyan 
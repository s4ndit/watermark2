#!/bin/bash

echo "🔧 Wasserzeichen-Webapp Fehlerbehebung"
echo "======================================"

# System-Anforderungen überprüfen
echo "📋 Überprüfe System-Anforderungen..."

# FFmpeg überprüfen
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg ist installiert"
    ffmpeg -version | head -n 1
else
    echo "❌ FFmpeg ist NICHT installiert"
    echo "   Installation: sudo apt-get install ffmpeg"
fi

# ImageMagick überprüfen
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick ist installiert"
    convert -version | head -n 1
else
    echo "❌ ImageMagick ist NICHT installiert"
    echo "   Installation: sudo apt-get install imagemagick"
fi

# Node.js und npm überprüfen
echo "✅ Node.js Version: $(node --version)"
echo "✅ NPM Version: $(npm --version)"

# Verzeichnisse überprüfen
echo ""
echo "📁 Überprüfe Verzeichnisse..."
for dir in uploads temp processed; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ existiert"
    else
        echo "❌ $dir/ fehlt - wird erstellt..."
        mkdir -p "$dir"
    fi
done

# Dependencies überprüfen
echo ""
echo "📦 Überprüfe Node.js Dependencies..."
if npm list sharp &> /dev/null; then
    echo "✅ Sharp ist installiert"
else
    echo "❌ Sharp fehlt - wird installiert..."
    npm install sharp
fi

if npm list fluent-ffmpeg &> /dev/null; then
    echo "✅ Fluent-FFmpeg ist installiert"
else
    echo "❌ Fluent-FFmpeg fehlt - wird installiert..."
    npm install fluent-ffmpeg
fi

# Berechtigungen überprüfen
echo ""
echo "🔐 Überprüfe Berechtigungen..."
for dir in uploads temp processed; do
    if [ -w "$dir" ]; then
        echo "✅ $dir/ ist beschreibbar"
    else
        echo "❌ $dir/ ist nicht beschreibbar - korrigiere..."
        chmod 755 "$dir"
    fi
done

# Client Build überprüfen
echo ""
echo "🏗️ Überprüfe Client Build..."
if [ -d "client/build" ]; then
    echo "✅ Client Build existiert"
else
    echo "❌ Client Build fehlt - wird erstellt..."
    cd client && npm run build && cd ..
fi

# Server Test
echo ""
echo "🚀 Teste Server-Verbindung..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Server ist erreichbar"
else
    echo "❌ Server ist nicht erreichbar"
    echo "   Starte Server mit: NODE_ENV=production npm start"
fi

echo ""
echo "🎯 Fehlerbehebung abgeschlossen!"
echo "   Starte die Anwendung mit: NODE_ENV=production npm start" 
# 🌊 Wasserzeichen-Webapp

Eine moderne, professionelle Webapp zum Hinzufügen von Wasserzeichen zu Bildern und Videos. Basiert auf FFmpeg und ImageMagick mit einem React-Frontend und Node.js-Backend.

## ✨ Features

- 🖼️ **Bildwasserzeichen**: Unterstützung für PNG, JPG, GIF, WebP, BMP, TIFF
- 🎥 **Videowasserzeichen**: Unterstützung für MP4, AVI, MOV, MKV, WebM, FLV
- ✍️ **Text-Wasserzeichen**: Anpassbare Schriftart, Größe, Farbe und Rotation
- 🎨 **Bild-Wasserzeichen**: Upload eigener Logos oder Grafiken
- 🔄 **Beide gleichzeitig**: Kombination von Text- und Bildwasserzeichen
- ⚡ **Echtzeitfortschritt**: Live-Updates via WebSocket
- 🎛️ **Vollständige Kontrolle**: Position, Transparenz, Größe, Rotation, Ränder
- 👀 **Live-Vorschau**: Sofortige Vorschau vor der Verarbeitung
- 📱 **Responsive Design**: Optimiert für Desktop und Mobile
- 🐳 **Docker-Support**: Einfache Bereitstellung mit Docker
- 🔒 **Sicher**: Datei-Validierung und sichere Uploads

## 🚀 Schnellstart

### Option 1: Docker (Empfohlen)

```bash
# Repository klonen
git clone <repository-url>
cd watermark2

# Mit Docker Compose starten
docker-compose up -d

# Oder manuell bauen und starten
docker build -t wasserzeichen-webapp .
docker run -p 3000:3001 wasserzeichen-webapp
```

Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

### Option 2: Lokale Installation

#### Voraussetzungen

- Node.js 18+
- npm 8+
- FFmpeg
- ImageMagick

#### Installation auf Debian/Ubuntu

```bash
# System-Abhängigkeiten installieren
sudo apt update
sudo apt install -y ffmpeg imagemagick imagemagick-dev python3 build-essential

# Repository klonen
git clone <repository-url>
cd watermark2

# Abhängigkeiten installieren
npm run install:all

# Entwicklung starten
npm run dev

# Oder für Production
npm run build
npm start
```

#### Installation auf anderen Systemen

**macOS (Homebrew):**
```bash
brew install ffmpeg imagemagick
```

**Windows:**
- FFmpeg von https://ffmpeg.org/download.html
- ImageMagick von https://imagemagick.org/script/download.php

## 📖 Verwendung

### 1. Datei hochladen
- Ziehen Sie Ihre Bild- oder Videodatei in den Upload-Bereich
- Oder klicken Sie zum Durchsuchen
- Unterstützte Formate werden automatisch erkannt

### 2. Wasserzeichen konfigurieren
- **Text-Wasserzeichen**: Geben Sie Ihren Text ein und passen Sie Schriftart, Größe und Farbe an
- **Bild-Wasserzeichen**: Laden Sie Ihr Logo oder Ihre Grafik hoch
- **Position**: Wählen Sie aus 9 vordefinierten Positionen
- **Transparenz**: Stellen Sie die Sichtbarkeit ein (0-100%)
- **Größe**: Passen Sie die Wasserzeichen-Größe an
- **Rotation**: Drehen Sie das Wasserzeichen (-180° bis 180°)

### 3. Vorschau generieren
- Klicken Sie auf "Vorschau" um eine Vorschau zu sehen
- Passen Sie Einstellungen bei Bedarf an
- Wiederholen Sie den Vorgang bis Sie zufrieden sind

### 4. Verarbeitung starten
- Klicken Sie auf "Verarbeitung starten"
- Verfolgen Sie den Fortschritt in Echtzeit
- Laden Sie das fertige Ergebnis herunter

## 🛠️ Konfiguration

### Umgebungsvariablen

Kopieren Sie `.env.example` zu `.env` und passen Sie die Werte an:

```bash
# Server-Konfiguration
NODE_ENV=production
PORT=3001

# Datei-Limits
MAX_FILE_SIZE=500MB
MAX_CONCURRENT_JOBS=3

# Pfade (werden automatisch erkannt)
FFMPEG_PATH=/usr/bin/ffmpeg
MAGICK_PATH=/usr/bin/magick
```

### Nginx-Konfiguration (Production)

Für Production-Deployments ist eine Nginx-Konfiguration enthalten:

```bash
# SSL-Zertifikate generieren
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem

# Nginx starten
docker-compose up -d nginx
```

## 📁 Projektstruktur

```
watermark2/
├── client/                 # React-Frontend
│   ├── public/            # Statische Dateien
│   │   ├── components/    # React-Komponenten
│   │   ├── contexts/      # React-Kontexte
│   │   ├── hooks/         # Custom Hooks
│   │   └── ...
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js-Backend
│   ├── routes/           # API-Routen
│   ├── services/         # Business Logic
│   ├── socket/           # WebSocket-Handler
│   ├── utils/            # Hilfsfunktionen
│   └── index.js
├── uploads/              # Hochgeladene Dateien
├── processed/            # Verarbeitete Dateien
├── temp/                 # Temporäre Dateien
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
└── README.md
```

## 🔧 API-Dokumentation

### Datei-Upload

```http
POST /api/upload/file
Content-Type: multipart/form-data

file: <Ihre Datei>
```

### Wasserzeichen-Upload

```http
POST /api/upload/watermark
Content-Type: multipart/form-data

watermark: <Wasserzeichen-Bild>
```

### Vorschau generieren

```http
POST /api/watermark/preview
Content-Type: application/json

{
  "sourceFile": "dateiname.jpg",
  "watermarkType": "text|image|both",
  "watermarkFile": "wasserzeichen.png",
  "textWatermark": "Mein Text",
  "params": {
    "position": "bottom-right",
    "opacity": 0.8,
    "size": 20,
    "rotation": 0,
    "fontSize": 24,
    "fontColor": "#ffffff"
  }
}
```

### Verarbeitung starten

```http
POST /api/watermark/process
Content-Type: application/json

{
  "sourceFile": "dateiname.jpg",
  "watermarkType": "text|image|both",
  "watermarkFile": "wasserzeichen.png",
  "textWatermark": "Mein Text",
  "params": { ... }
}
```

## 🔌 WebSocket-Events

### Client → Server

- `subscribe-job`: Job-Updates abonnieren
- `unsubscribe-job`: Job-Updates abmelden
- `ping`: Verbindungstest

### Server → Client

- `job-progress`: Fortschritt-Update
- `job-complete`: Verarbeitung abgeschlossen
- `job-error`: Fehler aufgetreten
- `system-stats`: System-Statistiken

## 🚢 Deployment

### Docker Deployment

```bash
# Produktions-Build
docker-compose -f docker-compose.yml up -d

# Mit Nginx Reverse Proxy
docker-compose up -d nginx
```

### Manuelle Bereitstellung

```bash
# Frontend bauen
cd client && npm run build

# Server starten
npm start
```

### Systemd Service (Linux)

```ini
[Unit]
Description=Wasserzeichen Webapp
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/wasserzeichen-webapp
ExecStart=/usr/bin/node server/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## 🎨 Anpassung

### UI-Anpassung

Die UI verwendet Tailwind CSS. Farben und Styling können in `client/tailwind.config.js` angepasst werden.

### Backend-Erweiterung

Neue Features können durch:
- Neue Routen in `server/routes/`
- Services in `server/services/`
- Validierungen in `server/utils/validation.js`

hinzugefügt werden.

## 🐛 Fehlerbehebung

### Häufige Probleme

**FFmpeg nicht gefunden:**
```bash
# Pfad prüfen
which ffmpeg
# In .env eintragen
FFMPEG_PATH=/usr/bin/ffmpeg
```

**ImageMagick Fehler:**
```bash
# ImageMagick-Politik anpassen (falls nötig)
sudo nano /etc/ImageMagick-6/policy.xml
# PDF-Beschränkung entfernen
```

**Upload-Fehler:**
```bash
# Berechtigungen prüfen
chmod 755 uploads/ processed/ temp/
```

**Socket-Verbindungsfehler:**
- Firewall-Einstellungen prüfen
- Port 3001 freigeben
- CORS-Konfiguration überprüfen

### Logs

```bash
# Docker-Logs
docker-compose logs -f wasserzeichen-app

# Systemd-Logs
journalctl -u wasserzeichen-webapp -f
```

## 🔒 Sicherheit

- Datei-Upload-Validierung
- MIME-Type-Prüfung
- Größenlimits
- Sichere Dateinamen
- CORS-Schutz
- Rate-Limiting (empfohlen für Production)

## 📊 Performance

### Empfohlene System-Anforderungen

- **CPU**: 2+ Kerne
- **RAM**: 4GB+ (für große Videodateien mehr)
- **Speicher**: 10GB+ frei
- **Netzwerk**: Stabile Verbindung für WebSocket

### Optimierungen

- Nginx als Reverse Proxy
- Gzip-Kompression
- Datei-Caching
- CDN für statische Assets
- Load Balancing bei hoher Last

## 🤝 Beiträge

Beiträge sind willkommen! Bitte:

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- FFmpeg-Team für das großartige Video-Processing-Tool
- ImageMagick für die Bildverarbeitung
- React & Node.js Communities
- Tailwind CSS für das Design-System

---

**Erstellt mit ❤️ für professionelle Wasserzeichen-Bearbeitung** 
# 🚀 Deployment-Anleitung für Debian-Server

Diese Anleitung beschreibt die Bereitstellung der Wasserzeichen-Webapp auf einem Debian-Server.

## 📋 Voraussetzungen

- Debian 11+ oder Ubuntu 20.04+
- Root-Zugriff oder sudo-Berechtigungen
- Mindestens 2 GB RAM und 10 GB freier Speicherplatz
- Internetverbindung

## 🔧 System-Vorbereitung

### 1. System aktualisieren

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Notwendige System-Pakete installieren

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    ffmpeg \
    imagemagick \
    imagemagick-dev \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw
```

### 3. Node.js installieren

```bash
# NodeSource Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Version überprüfen
node --version
npm --version
```

### 4. Docker installieren (Alternative)

```bash
# Docker Repository hinzufügen
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

# GPG-Schlüssel hinzufügen
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Repository hinzufügen
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker installieren
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker Compose installieren
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Benutzer zur Docker-Gruppe hinzufügen
sudo usermod -aG docker $USER
```

## 🏗️ Anwendung bereitstellen

### Option A: Docker-Deployment (Empfohlen)

#### 1. Repository klonen

```bash
cd /opt
sudo git clone https://github.com/s4ndit/watermark2.git wasserzeichen-webapp
sudo chown -R $USER:$USER wasserzeichen-webapp
cd wasserzeichen-webapp
```

#### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
nano .env
```

Anpassen der Produktions-Einstellungen:

```bash
NODE_ENV=production
PORT=3001
MAX_FILE_SIZE=500MB
MAX_CONCURRENT_JOBS=3
FFMPEG_PATH=/usr/bin/ffmpeg
MAGICK_PATH=/usr/bin/magick
```

#### 3. SSL-Zertifikate erstellen

```bash
sudo mkdir -p ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=DE/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

#### 4. Docker-Container starten

```bash
# Anwendung bauen und starten
docker-compose up -d

# Logs überprüfen
docker-compose logs -f
```

### Option B: Native Installation

#### 1. Repository klonen und Dependencies installieren

```bash
cd /opt
sudo git clone https://github.com/s4ndit/watermark2.git wasserzeichen-webapp
sudo chown -R $USER:$USER wasserzeichen-webapp
cd wasserzeichen-webapp

# Abhängigkeiten installieren
npm run install:all
```

#### 2. Frontend bauen

```bash
npm run build
```

#### 3. Systemd Service erstellen

```bash
sudo nano /etc/systemd/system/wasserzeichen-webapp.service
```

Service-Datei:

```ini
[Unit]
Description=Wasserzeichen Webapp
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/wasserzeichen-webapp
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=wasserzeichen-webapp

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/wasserzeichen-webapp/uploads
ReadWritePaths=/opt/wasserzeichen-webapp/processed
ReadWritePaths=/opt/wasserzeichen-webapp/temp

[Install]
WantedBy=multi-user.target
```

#### 4. Service aktivieren und starten

```bash
# Service aktivieren
sudo systemctl enable wasserzeichen-webapp

# Service starten
sudo systemctl start wasserzeichen-webapp

# Status überprüfen
sudo systemctl status wasserzeichen-webapp
```

## 🌐 Nginx konfigurieren

### 1. Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/wasserzeichen-webapp
```

Nginx-Konfiguration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL-Konfiguration
    ssl_certificate /opt/wasserzeichen-webapp/ssl/cert.pem;
    ssl_certificate_key /opt/wasserzeichen-webapp/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Upload-Limits
    client_max_body_size 500M;
    client_body_timeout 300s;
    client_header_timeout 300s;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/javascript
        application/json
        image/svg+xml;

    # API und WebSocket Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Downloads
    location /downloads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # Statische Dateien
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/wasserzeichen-webapp.access.log;
    error_log /var/log/nginx/wasserzeichen-webapp.error.log;
}
```

### 2. Site aktivieren

```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/wasserzeichen-webapp /etc/nginx/sites-enabled/

# Default-Site deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neustarten
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL-Zertifikat mit Let's Encrypt (Optional)

```bash
# Certbot für echte SSL-Zertifikate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Automatische Erneuerung testen
sudo certbot renew --dry-run

# Cronjob für automatische Erneuerung
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 🔥 Firewall konfigurieren

```bash
# UFW aktivieren
sudo ufw enable

# SSH erlauben (wichtig!)
sudo ufw allow ssh

# HTTP und HTTPS erlauben
sudo ufw allow 'Nginx Full'

# Status überprüfen
sudo ufw status
```

## 📊 Monitoring und Logs

### 1. Logs überprüfen

```bash
# Anwendung-Logs (Systemd)
sudo journalctl -u wasserzeichen-webapp -f

# Nginx-Logs
sudo tail -f /var/log/nginx/wasserzeichen-webapp.access.log
sudo tail -f /var/log/nginx/wasserzeichen-webapp.error.log

# Docker-Logs (falls Docker verwendet)
docker-compose logs -f
```

### 2. System-Monitoring

```bash
# PM2 für erweiterte Process-Verwaltung (optional)
sudo npm install -g pm2

# PM2-Konfiguration
pm2 start server/index.js --name "wasserzeichen-webapp"
pm2 startup
pm2 save
```

### 3. Backup-Strategie

```bash
# Backup-Script erstellen
sudo nano /opt/backup-wasserzeichen.sh
```

Backup-Script:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/wasserzeichen-webapp"

mkdir -p $BACKUP_DIR

# Datenbank-Backup (falls vorhanden)
# mysqldump -u user -p database > $BACKUP_DIR/database_$DATE.sql

# Dateien sichern
tar -czf $BACKUP_DIR/wasserzeichen_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='temp' \
    $APP_DIR

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "wasserzeichen_*.tar.gz" -mtime +30 -delete

echo "Backup completed: wasserzeichen_$DATE.tar.gz"
```

```bash
# Script ausführbar machen
sudo chmod +x /opt/backup-wasserzeichen.sh

# Cronjob für tägliche Backups
echo "0 2 * * * /opt/backup-wasserzeichen.sh" | sudo crontab -
```

## 🔧 Wartung und Updates

### 1. Anwendung aktualisieren

```bash
cd /opt/wasserzeichen-webapp

# Git-Updates abrufen
git pull origin main

# Dependencies aktualisieren
npm run install:all

# Frontend neu bauen
npm run build

# Service neustarten
sudo systemctl restart wasserzeichen-webapp

# Oder bei Docker:
docker-compose down
docker-compose up -d --build
```

### 2. System-Updates

```bash
# Regelmäßige System-Updates
sudo apt update && sudo apt upgrade -y

# Automatische Updates aktivieren
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 🚨 Fehlerbehebung

### 1. Häufige Probleme

**Service startet nicht:**
```bash
# Logs überprüfen
sudo journalctl -u wasserzeichen-webapp --no-pager

# Berechtigungen prüfen
sudo chown -R www-data:www-data /opt/wasserzeichen-webapp
```

**Nginx-Fehler:**
```bash
# Nginx-Konfiguration testen
sudo nginx -t

# Nginx-Logs überprüfen
sudo tail -f /var/log/nginx/error.log
```

**Docker-Probleme:**
```bash
# Container-Status prüfen
docker-compose ps

# Container-Logs anzeigen
docker-compose logs -f wasserzeichen-app
```

### 2. Performance-Optimierung

```bash
# Node.js Performance-Monitoring
npm install -g clinic
clinic doctor -- node server/index.js

# System-Ressourcen überwachen
htop
iotop
```

## ✅ Deployment-Checkliste

- [ ] System-Pakete installiert
- [ ] Node.js/Docker installiert
- [ ] Repository geklont
- [ ] Umgebungsvariablen konfiguriert
- [ ] SSL-Zertifikate erstellt
- [ ] Anwendung gestartet
- [ ] Nginx konfiguriert
- [ ] Firewall aktiviert
- [ ] Monitoring eingerichtet
- [ ] Backup-Strategie implementiert
- [ ] DNS-Einträge gesetzt
- [ ] Funktionstest durchgeführt

## 📞 Support

Bei Problemen:

1. Logs überprüfen
2. Dokumentation konsultieren
3. GitHub Issues erstellen
4. Community fragen

**Die Anwendung sollte jetzt unter `https://yourdomain.com` erreichbar sein! 🎉** 
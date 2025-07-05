# Multi-stage build für optimale Performance
FROM node:18-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm ci --only=production

# Client Dependencies installieren und Build erstellen
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Production stage
FROM node:18-alpine

# Notwendige System-Abhängigkeiten installieren
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    imagemagick-dev \
    python3 \
    make \
    g++

# Arbeitsverzeichnis setzen
WORKDIR /app

# Nur Production-Dependencies kopieren
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/build ./client/build

# Server-Code kopieren
COPY server/ ./server/
COPY package*.json ./

# Uploads- und Temp-Verzeichnisse erstellen
RUN mkdir -p uploads temp processed

# Ports freigeben
EXPOSE 3001

# Gesundheitscheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Anwendung starten
CMD ["npm", "start"] 
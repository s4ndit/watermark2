# 🤝 Beitragen zur Wasserzeichen-Webapp

Vielen Dank für Ihr Interesse daran, zur Wasserzeichen-Webapp beizutragen! Wir freuen uns über alle Arten von Beiträgen.

## 🚀 Schnellstart für Entwickler

### 1. Repository forken und klonen

```bash
# Repository forken auf GitHub, dann klonen
git clone https://github.com/IHR-USERNAME/wasserzeichen-webapp.git
cd wasserzeichen-webapp

# Upstream-Remote hinzufügen
git remote add upstream https://github.com/ORIGINAL-OWNER/wasserzeichen-webapp.git
```

### 2. Entwicklungsumgebung einrichten

```bash
# Abhängigkeiten installieren
npm run install:all

# Umgebungsvariablen konfigurieren
cp .env.example .env

# Entwicklungsserver starten
npm run dev
```

### 3. Branch für Feature erstellen

```bash
# Neuen Feature-Branch erstellen
git checkout -b feature/mein-neues-feature

# Oder Bug-Fix-Branch
git checkout -b bugfix/mein-bugfix
```

## 📝 Arten von Beiträgen

### 🐛 Bug Reports

Wenn Sie einen Bug finden, erstellen Sie bitte ein Issue mit:

- **Kurze Beschreibung** des Problems
- **Schritte zur Reproduktion**
- **Erwartetes Verhalten**
- **Tatsächliches Verhalten**
- **Screenshots** (falls hilfreich)
- **System-Informationen** (OS, Node.js-Version, etc.)

### ✨ Feature Requests

Für neue Features:

- **Beschreibung** des gewünschten Features
- **Anwendungsfall** und Begründung
- **Mockups** oder Beispiele (falls vorhanden)
- **Mögliche Implementierungsansätze**

### 🔧 Code-Beiträge

#### Backend (Node.js)

```
server/
├── routes/         # API-Endpunkte
├── services/       # Business Logic
├── utils/          # Hilfsfunktionen
├── socket/         # WebSocket-Handler
└── middleware/     # Express-Middleware
```

#### Frontend (React)

```
client/src/
├── components/     # React-Komponenten
├── contexts/       # React-Kontexte
├── hooks/          # Custom Hooks
├── utils/          # Hilfsfunktionen
└── styles/         # CSS/Styling
```

## 🎯 Entwicklungsrichtlinien

### Code-Style

#### JavaScript/React

```javascript
// Verwenden Sie moderne ES6+ Syntax
const myFunction = (param) => {
  // Funktionslogik hier
};

// React-Komponenten mit Hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  return (
    <div className="my-component">
      {/* JSX hier */}
    </div>
  );
};
```

#### CSS/Tailwind

```jsx
// Verwenden Sie Tailwind-Klassen für Styling
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    Titel
  </h2>
</div>
```

### Naming Conventions

- **Dateien**: kebab-case (`my-component.js`)
- **Komponenten**: PascalCase (`MyComponent`)
- **Variablen/Funktionen**: camelCase (`myVariable`)
- **Konstanten**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Git Commit Messages

Verwenden Sie aussagekräftige Commit-Messages:

```
feat: Neue Video-Wasserzeichen-Funktionalität hinzufügen
fix: Problem mit Datei-Upload bei großen Dateien beheben
docs: README mit neuen Installationsanweisungen aktualisieren
style: Code-Formatierung in VideoProcessor verbessern
refactor: ImageProcessor-Service umstrukturieren
test: Unit-Tests für Validierungslogik hinzufügen
chore: Dependencies auf neueste Versionen aktualisieren
```

### Testing

```bash
# Tests ausführen
npm test

# Tests mit Coverage
npm run test:coverage

# E2E-Tests
npm run test:e2e
```

### Linting

```bash
# ESLint ausführen
npm run lint

# Auto-Fix für ESLint-Probleme
npm run lint:fix

# Prettier für Code-Formatierung
npm run format
```

## 🔍 Pull Request Prozess

### 1. Vor dem Erstellen eines PRs

- [ ] Code funktioniert lokal
- [ ] Tests wurden geschrieben/aktualisiert
- [ ] Linting-Probleme behoben
- [ ] Dokumentation aktualisiert
- [ ] CHANGELOG.md aktualisiert (falls zutreffend)

### 2. PR erstellen

```bash
# Änderungen committen
git add .
git commit -m "feat: Beschreibung der Änderung"

# Branch pushen
git push origin feature/mein-neues-feature
```

Erstellen Sie dann einen Pull Request auf GitHub mit:

- **Klarer Titel** der Änderung
- **Beschreibung** was geändert wurde und warum
- **Screenshots** bei UI-Änderungen
- **Testing-Hinweise** für Reviewer
- **Breaking Changes** (falls vorhanden)

### 3. Review-Prozess

- Mindestens ein Core-Maintainer muss den PR reviewen
- Alle CI-Checks müssen bestehen
- Konflikte müssen aufgelöst werden
- Feedback wird zeitnah bearbeitet

### 4. Nach dem Merge

```bash
# Zurück zum main branch
git checkout main

# Lokalen main branch aktualisieren
git pull upstream main

# Feature-Branch löschen
git branch -d feature/mein-neues-feature
```

## 🧪 Lokale Entwicklung

### Development-Setup

```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd client
npm start

# Oder beides gleichzeitig
npm run dev
```

### Docker-Entwicklung

```bash
# Development mit Docker
docker-compose -f docker-compose.dev.yml up

# Nur Services (ohne Frontend-Dev-Server)
docker-compose up postgres redis
```

### Debugging

#### Backend-Debugging

```bash
# Node.js Debugger
node --inspect server/index.js

# Mit VS Code: F5 drücken oder Debug-Konfiguration verwenden
```

#### Frontend-Debugging

```bash
# React DevTools installieren
# Chrome/Firefox Extension

# Redux DevTools (falls Redux verwendet wird)
```

## 📚 Ressourcen

### Dokumentation

- [Node.js Dokumentation](https://nodejs.org/docs/)
- [React Dokumentation](https://reactjs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Socket.io Dokumentation](https://socket.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools

- [FFmpeg Dokumentation](https://ffmpeg.org/documentation.html)
- [ImageMagick Guides](https://imagemagick.org/script/command-line-processing.php)
- [Sharp API](https://sharp.pixelplumbing.com/api-constructor)

## ❓ Fragen?

- **Issues**: Für Bugs und Feature Requests
- **Discussions**: Für allgemeine Fragen und Diskussionen
- **Email**: [maintainer@example.com] für private Anfragen

## 🙏 Anerkennungen

Alle Beiträge werden in der [Contributors](CONTRIBUTORS.md) Datei aufgeführt.

---

**Vielen Dank für Ihren Beitrag zur Wasserzeichen-Webapp! 🎉** 
# 🎨 CutPilot - PDF Cut Contour Tool

**CutPilot** ist ein professionelles Tool zum Hinzufügen von Cut-Konturen (Schnittlinien) zu PDF-Dateien für Druckereien und Grafikdesigner.

## ✨ Features

### PDF-Bearbeitung
- ✅ **Cut-Konturen hinzufügen** - Automatische 100% Magenta Spot Color Kontur
- ✅ **Konfigurierbarer Abstand** - 3-10mm Offset
- ✅ **PDF/X-3 kompatibel** - Adobe Illustrator Metadaten
- ✅ **ICC-Profil Support** - Korrekter Farbraum-Export
- ✅ **Batch-Verarbeitung** - Mehrere Dateien gleichzeitig

### Print Plate (Druckplatte)
- ✅ **Mehrere PDFs kombinieren** - Auf einer Platte platzieren
- ✅ **Automatisches Layout** - Auto-Position Algorithmus
- ✅ **Rotation** - 90°, 180°, 270° Drehung
- ✅ **Snap-to-Grid** - Präzise Positionierung
- ✅ **Plattengröße konfigurierbar** - Benutzerdefinierte Dimensionen

### Desktop-Integration (Tauri)
- ✅ **Native File Dialogs** - System-Dateiauswahl (Mac/Windows)
- ✅ **Direkter Dateisystem-Zugriff** - Kein Browser-Upload nötig
- ✅ **ICC-Profile laden** - Lokale Profile importieren
- ✅ **Schneller PDF-Export** - Native Speichern-Dialog
- ✅ **Offline-fähig** - Keine Internetverbindung nötig

## 🚀 Schnellstart

### Als Desktop-App (empfohlen)

**Download:**
- **macOS**: `CutPilot.dmg` von [Releases](https://github.com/IHR-USERNAME/cutpilot/releases)
- **Windows**: `CutPilot.msi` von [Releases](https://github.com/IHR-USERNAME/cutpilot/releases)

**Installation:**
1. Laden Sie den Installer für Ihr System herunter
2. **macOS**: Öffnen Sie die `.dmg` und ziehen Sie CutPilot in den Programme-Ordner
3. **Windows**: Führen Sie die `.msi` Datei aus und folgen Sie dem Installer

### Als Web-App

```bash
# Repository klonen
git clone https://github.com/IHR-USERNAME/cutpilot.git
cd cutpilot

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffnen Sie http://localhost:8080

## 🔧 Entwicklung

### Voraussetzungen

- **Node.js** 18+
- **Rust** (für Desktop-App)
- **Git**

### Setup

```bash
# Dependencies installieren
npm install

# Web-Entwicklung
npm run dev

# Desktop-App Entwicklung (Tauri)
npm run tauri:dev

# Production Build (Desktop)
npm run tauri:build
```

Siehe [BUILD.md](BUILD.md) für detaillierte Build-Anleitung.

## 📖 Verwendung

### 1. Einzelne PDF mit Cut-Kontur erstellen

1. **Bild hochladen** - JPG, PNG, oder andere Bildformate
2. **Einstellungen anpassen**:
   - Offset: 3-10mm (Standard: 3mm)
   - Spot Color Name: "CutContour" oder "Cut"
3. **Konvertieren** - Klick auf "In PDF konvertieren"
4. **Download** - PDF mit Cut-Kontur herunterladen

### 2. Print Plate (Druckplatte) erstellen

1. **PDFs hochladen** - Mehrere PDF-Dateien auswählen
2. **Plattengröße festlegen** - z.B. 100x70 cm
3. **PDFs positionieren**:
   - Drag & Drop auf der Platte
   - Auto-Position für automatisches Layout
   - Rotation bei Bedarf
4. **Exportieren** - Komplette Platte als einzelnes PDF

### 3. Batch-Verarbeitung

1. **Mehrere Bilder auswählen**
2. **Batch Convert** - Alle auf einmal konvertieren
3. **Download** - Alle PDFs mit Cut-Konturen

## 🎯 Use Cases

### Druckereien
- Aufkleber-Produktion mit exakten Schnittlinien
- Etiketten-Druck mit Cut-Konturen
- Großformat-Druck mit Ausschnitt-Pfaden

### Grafikdesigner
- Vorbereitung von Druckdaten
- PDF/X-3 Export mit Spot Colors
- ICC-Profil-Management

### Packaging Design
- Verpackungs-Stanzformen
- Faltschachteln mit Schnittlinien
- Display-Aufsteller

## 🏗️ Architektur

### Technologien

**Frontend:**
- React 18.3 + TypeScript
- Tailwind CSS + shadcn-ui
- Vite 5.4

**PDF-Verarbeitung:**
- `pdf-lib` - PDF-Erstellung und Manipulation
- `pdfjs-dist` - PDF-Rendering
- `react-pdf` - PDF-Viewer

**Desktop-Integration:**
- Tauri 1.5 - Native Desktop-Wrapper
- Rust - Backend für File-System-Zugriff

**Speicherung:**
- IndexedDB - Browser-Storage (Web)
- Dateisystem - Native Storage (Desktop)

### Projektstruktur

```
cutpilot/
├── src/
│   ├── components/       # React-Komponenten
│   │   ├── pdf/         # PDF-Viewer & Controls
│   │   ├── print-plate/ # Druckplatten-Canvas
│   │   └── upload/      # File-Upload
│   ├── hooks/           # Custom React Hooks
│   ├── utils/           # Hilfsfunktionen
│   │   ├── pdf/         # PDF-Erstellung
│   │   ├── print-plate/ # Druckplatten-Export
│   │   └── tauriFileDialog.ts  # Desktop File Dialogs
│   └── types/           # TypeScript Definitionen
├── src-tauri/           # Tauri Desktop-Backend
│   ├── src/
│   │   └── main.rs      # Rust Entry Point
│   ├── icons/           # App-Icons
│   └── tauri.conf.json  # Tauri-Konfiguration
└── BUILD.md             # Build-Anleitung
```

## 🔐 Sicherheit

- ✅ Keine Daten werden an Server gesendet
- ✅ Alle Verarbeitung lokal (Client-side)
- ✅ Keine Telemetrie oder Tracking
- ✅ Quellcode Open Source

## 🐛 Probleme melden

Bugs und Feature-Requests bitte als [GitHub Issue](https://github.com/IHR-USERNAME/cutpilot/issues) melden.

## 📄 Lizenz

[Fügen Sie hier Ihre Lizenz ein]

## 🤝 Mitwirken

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request.

## 📞 Support

- **Dokumentation**: [BUILD.md](BUILD.md)
- **Issues**: [GitHub Issues](https://github.com/IHR-USERNAME/cutpilot/issues)
- **Email**: [Ihre E-Mail]

## 🚀 Roadmap

- [ ] Linux Desktop-App
- [ ] Mehr Spot Color Optionen (Cyan, Yellow, Black)
- [ ] Vorlagen für gängige Druckformate
- [ ] Cloud-Sync für Einstellungen
- [ ] Plugin-System für benutzerdefinierte Workflows

## ⭐ Credits

Entwickelt mit:
- [Tauri](https://tauri.app)
- [pdf-lib](https://pdf-lib.js.org)
- [React](https://react.dev)
- [shadcn-ui](https://ui.shadcn.com)

---

**Made with ❤️ for Print Professionals**

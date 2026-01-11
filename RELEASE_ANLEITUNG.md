# 🚀 Release erstellen - Schritt-für-Schritt

## Super einfach über GitHub Website (3 Minuten)

### Schritt 1: Gehe zu Releases

1. Öffne: https://github.com/kobot24/cutpilot-98343
2. Klicke rechts auf **"Releases"** (oder direkt: https://github.com/kobot24/cutpilot-98343/releases)
3. Klicke **"Create a new release"** (grüner Button oben rechts)

### Schritt 2: Release konfigurieren

**Tag auswählen:**
- Klicke auf das Dropdown "Choose a tag"
- Tippe: `v1.0.0`
- Klicke "Create new tag: v1.0.0 on publish"

**Target Branch:**
- Wähle: `claude/embed-ghostscript-binary-KXTSr`

**Release Title:**
```
CutPilot v1.0.0
```

**Description:**
```markdown
## CutPilot v1.0.0 - Erste vollständige Release 🎉

### ✨ Features
- ✅ **PDF Cut Contour Erstellung** - Automatische CutContour-Linien
- ✅ **CMYK-Konvertierung** - Professionell mit embedded Ghostscript
- ✅ **ICC-Profil-Unterstützung** - ISOcoated v2, sRGB, PSO Coated v3
- ✅ **Spot Color Preservation** - CutContour bleibt als Sonderfarbe erhalten
- ✅ **Batch-Verarbeitung** - Mehrere PDFs auf einmal
- ✅ **Cross-Platform** - macOS, Windows, Linux

### 📦 Installation
**Keine zusätzliche Software nötig!**
- Ghostscript ist embedded
- ICC-Profile sind embedded
- Einfach herunterladen und starten

### 🖥️ Downloads
Wähle die passende Datei für dein System unten ⬇️

Die Builds werden automatisch in wenigen Minuten erstellt.

### 💡 Hinweise
- **macOS**: Bei "App kann nicht geöffnet werden" → Rechtsklick → Öffnen
- **Windows**: Bei SmartScreen Warnung → "Weitere Informationen" → "Trotzdem ausführen"
- **Linux AppImage**: `chmod +x` nicht vergessen

### 🐛 Probleme?
Öffne ein Issue: https://github.com/kobot24/cutpilot-98343/issues
```

### Schritt 3: Veröffentlichen

- ✅ Haken setzen bei "Set as the latest release"
- Klicke **"Publish release"** (grüner Button unten)

## ⏱️ Was passiert dann?

1. **GitHub Actions startet automatisch** (sofort)
2. **Builds laufen parallel** für alle Plattformen (~15-20 Minuten):
   - macOS Intel (x86_64)
   - macOS Apple Silicon (ARM)
   - Windows (x64)
   - Linux (x64)
3. **Dateien erscheinen automatisch** auf der Release-Page:
   ```
   ✓ CutPilot_x64.dmg
   ✓ CutPilot_aarch64.dmg
   ✓ CutPilot_x64-setup.exe
   ✓ CutPilot_x64_en-US.msi
   ✓ cutpilot_amd64.AppImage
   ✓ cutpilot_amd64.deb
   ```

## 📊 Build Status prüfen

Während der Build läuft:
1. Gehe zu: **Actions** Tab
2. Siehst du "Build and Release" laufen
3. Nach ~15-20 Minuten: ✅ Alle grün
4. Refresh die Release-Page → Downloads sind da!

## 🎯 Fertig!

Deine User können jetzt:
- Release-Page öffnen
- Installer für ihre Plattform runterladen
- Installieren
- Loslegen!

**KEINE Installation von Ghostscript oder ICC-Profilen nötig - alles embedded!**

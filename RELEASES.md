# CutPilot Releases

## Download & Installation

### Automatische Releases

Neue Versionen von CutPilot werden automatisch über GitHub Actions gebaut und veröffentlicht.

### Release erstellen

**Option 1: Git Tag (empfohlen)**
```bash
# Version Tag erstellen
git tag v1.0.0

# Tag pushen (triggert automatischen Build)
git push origin v1.0.0
```

**Option 2: Manueller Workflow**
1. Gehe zu: **Actions** → **Build and Release**
2. Klicke: **Run workflow**
3. Gib Version ein: `v1.0.0`
4. Klicke: **Run workflow**

### Was wird gebaut?

| Plattform | Dateien | Hinweise |
|-----------|---------|----------|
| **macOS Intel** | `CutPilot_x64.dmg`<br>`CutPilot_x64.app.tar.gz` | Für Intel Macs (x86_64) |
| **macOS Apple Silicon** | `CutPilot_aarch64.dmg`<br>`CutPilot_aarch64.app.tar.gz` | Für M1/M2/M3 Macs (ARM) |
| **Windows** | `CutPilot_x64_en-US.msi`<br>`CutPilot_x64-setup.exe` | Windows Installer + Setup |
| **Linux** | `cutpilot_amd64.AppImage`<br>`cutpilot_amd64.deb` | AppImage (universal) + Debian |

### Installation

#### macOS
```bash
# DMG herunterladen
open CutPilot_*.dmg

# App in Applications ziehen
# Fertig!
```

#### Windows
```powershell
# Setup.exe herunterladen und ausführen
CutPilot_x64-setup.exe

# Oder MSI Installer
msiexec /i CutPilot_x64_en-US.msi
```

#### Linux (AppImage)
```bash
# Herunterladen
wget https://github.com/[user]/cutpilot/releases/latest/download/cutpilot_amd64.AppImage

# Ausführbar machen
chmod +x cutpilot_amd64.AppImage

# Starten
./cutpilot_amd64.AppImage
```

#### Linux (Debian/Ubuntu)
```bash
# .deb herunterladen und installieren
sudo dpkg -i cutpilot_amd64.deb

# Starten
cutpilot
```

### Enthaltene Komponenten

Jede Release-Datei enthält:
- ✅ **Ghostscript Binary** (embedded)
- ✅ **ICC-Profile** (ISOcoated_v2_eci, sRGB, etc.)
- ✅ **Alle Dependencies**
- ✅ **Keine externe Installation nötig!**

User müssen **NICHTS** installieren außer der App selbst!

---

## Für Entwickler

### Release-Workflow

1. **Vorbereitung:**
   ```bash
   # Ghostscript Binary committen (falls noch nicht geschehen)
   git add src-tauri/binaries/
   git commit -m "Add Ghostscript binary for [platform]"
   git push
   ```

2. **Version erhöhen:**
   ```bash
   # package.json
   npm version 1.0.0

   # Cargo.toml
   # version = "1.0.0"

   # tauri.conf.json
   # "version": "1.0.0"
   ```

3. **Tag erstellen:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. **Automatischer Build:**
   - GitHub Actions startet automatisch
   - Baut für alle Plattformen parallel
   - Uploadet Artefakte zum Release
   - Veröffentlicht Release

### Lokaler Test-Build

```bash
# Alle Plattformen testen
npm run tauri:build

# Debug-Build
npm run tauri:build:debug

# Specific target
npm run tauri build -- --target aarch64-apple-darwin
```

### CI/CD Details

**Workflow-Datei:** `.github/workflows/release.yml`

**Jobs:**
1. `create-release` - Erstellt GitHub Release
2. `build-tauri` - Baut für alle Plattformen
3. `publish-release` - Veröffentlicht Release

**Umgebungsvariablen:**
- `GITHUB_TOKEN` - Automatisch von GitHub bereitgestellt
- `TAURI_PRIVATE_KEY` - Optional, für Code Signing
- `TAURI_KEY_PASSWORD` - Optional, für Code Signing

### Code Signing (Optional)

#### macOS:
```bash
# Developer ID Application Zertifikat benötigt
# In Tauri.conf.json:
"signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
```

#### Windows:
```bash
# Code Signing Zertifikat (.pfx) benötigt
# In Tauri.conf.json:
"certificateThumbprint": "YOUR_CERT_THUMBPRINT"
```

Für Entwicklung/Testing ist Code Signing **nicht erforderlich**.

---

## Troubleshooting

### ❌ Build schlägt fehl: "Ghostscript binary not found"

**Lösung:**
```bash
# Ghostscript installieren (auf Build-Maschine)
brew install ghostscript  # macOS
sudo apt install ghostscript  # Linux

# Ersten Build ausführen (kopiert Binary)
npm run tauri:build

# Binary committen
git add src-tauri/binaries/
git commit -m "Add Ghostscript binary"
git push
```

### ❌ GitHub Actions Fehler: "Resource not accessible by integration"

**Lösung:**
- Gehe zu: **Settings** → **Actions** → **General**
- Setze: **Workflow permissions** → **Read and write permissions**
- Aktiviere: **Allow GitHub Actions to create and approve pull requests**

### ❌ Release existiert bereits

**Lösung:**
```bash
# Tag löschen und neu erstellen
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Neuen Tag erstellen
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### ✅ Releases prüfen

```bash
# Alle Releases anzeigen
gh release list

# Specific Release Details
gh release view v1.0.0

# Assets herunterladen
gh release download v1.0.0
```

---

## Changelog

Siehe [Releases](https://github.com/[user]/cutpilot/releases) für vollständige Release-Notes.

### Version Guidelines

- **Major** (v2.0.0): Breaking Changes
- **Minor** (v1.1.0): Neue Features
- **Patch** (v1.0.1): Bug Fixes

---

## Support

Bei Problemen:
1. Prüfe [Troubleshooting](#troubleshooting)
2. Suche in [Issues](https://github.com/[user]/cutpilot/issues)
3. Erstelle neues Issue mit:
   - Platform (macOS/Windows/Linux)
   - Version (siehe About Dialog)
   - Fehlermeldung
   - Schritte zur Reproduktion

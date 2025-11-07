# CutPilot Build-Anleitung

Diese Anleitung erklärt, wie Sie CutPilot als Desktop-App für Mac und Windows bauen.

## 📋 Voraussetzungen

### Alle Plattformen

1. **Node.js** (Version 18 oder höher)
   ```bash
   node --version
   ```

2. **Rust** (neueste stabile Version)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Git**
   ```bash
   git --version
   ```

### macOS

Xcode Command Line Tools:
```bash
xcode-select --install
```

### Windows

1. **Microsoft Visual Studio C++ Build Tools**
   - Laden Sie von [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Installieren Sie "Desktop development with C++"

2. **WebView2** (normalerweise bereits installiert auf Windows 10/11)

### Linux (optional)

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

## 🚀 Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/IHR-USERNAME/cutpilot.git
   cd cutpilot
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

## 🔨 Entwicklung

### Web-Version starten (Browser)

```bash
npm run dev
```

Öffnen Sie http://localhost:8080 im Browser.

### Desktop-App starten (Tauri)

```bash
npm run tauri:dev
```

Dies startet die App als Desktop-Anwendung mit Hot Reload.

## 📦 Production Build

### Desktop-App bauen

**macOS:**
```bash
npm run tauri:build
```

**Ausgabe:**
- `src-tauri/target/release/bundle/dmg/CutPilot_1.0.0_x64.dmg` (Intel)
- `src-tauri/target/release/bundle/macos/CutPilot.app`

**Windows:**
```bash
npm run tauri:build
```

**Ausgabe:**
- `src-tauri/target/release/bundle/msi/CutPilot_1.0.0_x64_en-US.msi`
- `src-tauri/target/release/bundle/nsis/CutPilot_1.0.0_x64-setup.exe`

### Nur Web-Version bauen

```bash
npm run build
```

**Ausgabe:** `dist/` Ordner mit statischen Dateien

## 🏗️ Cross-Platform Builds

### macOS Universal Binary (Intel + Apple Silicon)

```bash
# Rust Targets hinzufügen
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

# Universal Binary bauen
npm run tauri build -- --target universal-apple-darwin
```

### Windows für verschiedene Architekturen

```bash
# ARM64 (für Windows on ARM)
rustup target add aarch64-pc-windows-msvc
npm run tauri build -- --target aarch64-pc-windows-msvc
```

## 🤖 Automatische Builds mit GitHub Actions

Pushen Sie Ihren Code zu GitHub. Der Workflow in `.github/workflows/build-release.yml` baut automatisch:

- **macOS**: Intel und Apple Silicon
- **Windows**: x64

### Release erstellen

1. Tag erstellen und pushen:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions baut automatisch und erstellt einen Draft Release

3. Gehen Sie zu GitHub → Releases → Bearbeiten Sie den Draft → Veröffentlichen

## 🐛 Troubleshooting

### macOS: "Developer cannot be verified"

```bash
# Code-Signing deaktivieren (nur für lokale Entwicklung)
xattr -cr src-tauri/target/release/bundle/macos/CutPilot.app
```

### Windows: "SmartScreen" Warnung

- Das ist normal für nicht signierte Apps
- Klicken Sie auf "More info" → "Run anyway"

### Build-Fehler: "Failed to bundle project"

```bash
# Cache löschen und neu bauen
rm -rf src-tauri/target
cargo clean --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```

### Rust Toolchain Probleme

```bash
# Rust neu installieren
rustup update
rustup default stable
```

## 📝 Build-Optionen

### Debug Build (schneller, größere Datei)

```bash
npm run tauri:build:debug
```

### Nur für aktuelle Plattform

```bash
npm run tauri:build
```

### Verbose Output

```bash
npm run tauri build -- --verbose
```

## 🔑 Code Signing (optional)

### macOS

1. Apple Developer Account benötigt
2. Developer ID Application Zertifikat erstellen
3. In `tauri.conf.json` konfigurieren:
   ```json
   {
     "tauri": {
       "bundle": {
         "macOS": {
           "signingIdentity": "Developer ID Application: Ihr Name (TEAM_ID)"
         }
       }
     }
   }
   ```

### Windows

1. Code Signing Zertifikat benötigt
2. In `tauri.conf.json` konfigurieren:
   ```json
   {
     "tauri": {
       "bundle": {
         "windows": {
           "certificateThumbprint": "YOUR_THUMBPRINT",
           "digestAlgorithm": "sha256",
           "timestampUrl": "http://timestamp.digicert.com"
         }
       }
     }
   }
   ```

## 📊 Build-Größen

Typische Größen:

- **macOS DMG**: 8-12 MB
- **Windows MSI**: 6-10 MB
- **Windows NSIS**: 5-8 MB

## 🌐 Web vs Desktop

| Feature | Web | Desktop |
|---------|-----|---------|
| Installation | ❌ Keine | ✅ Native App |
| Dateisystem | ❌ Browser-Upload | ✅ Direkter Zugriff |
| Offline | ⚠️ Begrenzt | ✅ Voll funktionsfähig |
| Updates | ✅ Automatisch | ⚠️ Manuell |
| Größe | ~2 MB | ~8-12 MB |

## 📚 Weitere Ressourcen

- [Tauri Dokumentation](https://tauri.app/v1/guides/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)
- [CutPilot Issues](https://github.com/IHR-USERNAME/cutpilot/issues)

## ⚙️ Erweiterte Konfiguration

Die Build-Konfiguration finden Sie in:
- `src-tauri/tauri.conf.json` - Tauri-Einstellungen
- `src-tauri/Cargo.toml` - Rust-Dependencies
- `package.json` - Node-Dependencies und Skripte
- `vite.config.ts` - Frontend-Build-Konfiguration

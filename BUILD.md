# CutPilot Build-Anleitung

## 🚀 Schneller lokaler Build (für sofortige Installationsdatei)

### Voraussetzungen prüfen

```bash
# 1. Ghostscript installiert?
which gs          # macOS/Linux
where gswin64c    # Windows

# Falls nicht installiert:
brew install ghostscript  # macOS
```

### Lokalen Build erstellen

```bash
# 1. Dependencies installieren
npm install

# 2. Release Build (optimiert, für Distribution)
npm run tauri:build

# Build läuft... dauert 5-10 Minuten
```

### Installationsdateien finden

Nach erfolgreichem Build:

**macOS:**
```
src-tauri/target/release/bundle/dmg/CutPilot_1.0.0_x64.dmg
```

**Windows:**
```
src-tauri/target/release/bundle/msi/CutPilot_1.0.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/CutPilot_1.0.0_x64-setup.exe
```

**Linux:**
```
src-tauri/target/release/bundle/appimage/cutpilot_1.0.0_amd64.AppImage
src-tauri/target/release/bundle/deb/cutpilot_1.0.0_amd64.deb
```

---

## 📦 GitHub Actions Release (automatisch)

### Setup (einmalig)

1. **GitHub Repository Settings:**
   - Settings → Actions → General
   - Setze: Workflow permissions → Read and write permissions

2. **Release erstellen:**
```bash
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions baut automatisch für ALLE Plattformen!
```

---

## ✅ Was ist schief gelaufen?

Wahrscheinliche Ursache:

1. ❌ **Kein Git Tag gepusht** - GitHub Actions triggert nur bei Tags
2. ❌ **Permissions fehlen** - Workflow kann kein Release erstellen  
3. ❌ **Alter Workflow** - Ich habe ihn gerade gelöscht ✅

## Jetzt sofort:

```bash
# Lokaler Build (5-10 Minuten)
npm run tauri:build

# Installationsdatei in:
# src-tauri/target/release/bundle/
```

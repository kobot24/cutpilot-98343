# ⚡ CutPilot - Schnellstart für Mac

## 🚀 In 3 Schritten zur DMG-Datei

### Schritt 1: Repository herunterladen

**Mit SSH (empfohlen):**
```bash
git clone git@github.com:kobot24/cutpilot-98343.git
cd cutpilot-98343
git checkout claude/cross-platform-cutpilot-011CUuNF8ZQdn3x6n9BY2PXo
```

**Mit Personal Access Token:**
```bash
git clone https://github.com/kobot24/cutpilot-98343.git
# Username: kobot24
# Password: [IHR_GITHUB_TOKEN]

cd cutpilot-98343
git checkout claude/cross-platform-cutpilot-011CUuNF8ZQdn3x6n9BY2PXo
```

**ODER: Download als ZIP:**
1. Gehen Sie zu: https://github.com/kobot24/cutpilot-98343
2. Branch wechseln zu: `claude/cross-platform-cutpilot-011CUuNF8ZQdn3x6n9BY2PXo`
3. Klicken Sie "Code" → "Download ZIP"
4. ZIP entpacken und Terminal im Ordner öffnen

---

### Schritt 2: Build-Skript ausführen

```bash
# Skript ausführbar machen
chmod +x build-mac.sh

# Build starten (automatisch!)
./build-mac.sh
```

**Das Skript macht alles automatisch:**
- ✅ Prüft alle Voraussetzungen
- ✅ Installiert Rust (falls nötig)
- ✅ Installiert Dependencies
- ✅ Baut die Desktop-App
- ✅ Zeigt die fertige DMG-Datei

⏱️ **Dauer:** 5-10 Minuten beim ersten Mal

---

### Schritt 3: DMG-Datei testen

Die fertige DMG-Datei finden Sie hier:
```
src-tauri/target/release/bundle/dmg/CutPilot_1.0.0_x64.dmg
```

**Testen:**
```bash
# DMG öffnen
open src-tauri/target/release/bundle/dmg/*.dmg

# Oder App direkt starten
open src-tauri/target/release/bundle/macos/CutPilot.app
```

---

## 🔧 Manuelle Installation (falls Build-Skript nicht funktioniert)

### Voraussetzungen installieren:

```bash
# 1. Xcode Command Line Tools
xcode-select --install

# 2. Homebrew (falls noch nicht installiert)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Node.js
brew install node

# 4. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Build durchführen:

```bash
# 1. Dependencies installieren
npm install

# 2. Build starten
npm run tauri:build

# 3. DMG finden
open src-tauri/target/release/bundle/dmg/
```

---

## 🐛 Probleme?

### "Command not found: git"
```bash
xcode-select --install
```

### "Command not found: npm"
```bash
brew install node
```

### "Command not found: cargo"
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### "Developer cannot be verified"
```bash
xattr -cr src-tauri/target/release/bundle/macos/CutPilot.app
open src-tauri/target/release/bundle/macos/CutPilot.app
```

### Build schlägt fehl
```bash
# Cache löschen
rm -rf src-tauri/target
rm -rf node_modules

# Neu installieren
npm install
npm run tauri:build
```

---

## 📦 Nur schnell testen (ohne Build)

```bash
# Dependencies installieren
npm install

# Desktop-App im Entwicklungsmodus starten
npm run tauri:dev

# Startet in ~2 Minuten (statt 10 Minuten für vollständigen Build)
```

---

## ✅ Nach dem Build

Die **DMG-Datei** können Sie:
- ✅ An Kollegen schicken
- ✅ Auf anderen Macs installieren
- ✅ Auf USB-Stick kopieren
- ✅ Via Dropbox/WeTransfer teilen

**Installation für Endnutzer:**
1. DMG-Datei öffnen
2. CutPilot-Icon in Programme-Ordner ziehen
3. Fertig! 🎉

---

## 🚀 Noch schneller: GitHub Actions nutzen

Statt lokal zu bauen, pushen Sie einfach einen Tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

**Nach 10 Minuten:**
- Gehen Sie zu: https://github.com/kobot24/cutpilot-98343/releases
- Laden Sie die fertige DMG herunter
- Auch Windows MSI wird automatisch gebaut!

---

**Viel Erfolg!** 🎨

# Ghostscript Integration - Embedded Binary

## ✅ Für End-User: **KEINE Installation nötig!**

CutPilot kommt mit **eingebettetem Ghostscript**. User müssen **nichts** installieren - einfach die App öffnen und loslegen!

Genau wie **Illustrator**, **Photoshop** etc. - alle benötigten Komponenten sind im App-Bundle enthalten.

---

## 🛠️ Für Entwickler: Einmalige Einrichtung

### Workflow

1. **Ghostscript einmalig installieren** (einmalig auf deinem Entwickler-System)
2. **Ersten Build ausführen** → Ghostscript wird automatisch kopiert
3. **Binary committen** → Wird Teil des Repos
4. **Fertig!** Alle weiteren Builds und Users haben Ghostscript automatisch

### Schritt-für-Schritt

#### 1. Ghostscript installieren (Entwickler-System)

**macOS:**
```bash
brew install ghostscript
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install ghostscript
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install ghostscript
```

**Windows:**
1. Download: https://ghostscript.com/releases/gsdnld.html
2. Installiere "Ghostscript 10.03.1 for Windows (64 bit)"

#### 2. Ersten Build ausführen

```bash
# Clone Repository
git clone <your-repo>
cd cutpilot

# Dependencies installieren
npm install

# Entwickler-Build (kopiert Ghostscript automatisch!)
npm run tauri:dev
```

Beim ersten Build passiert **automatisch**:
- ✓ build.rs findet Ghostscript auf deinem System
- ✓ Kopiert Binary nach `src-tauri/binaries/`
- ✓ Macht sie ausführbar (macOS/Linux)
- ✓ Zeigt Success-Meldung

#### 3. Binary committen (einmalig)

```bash
# Git LFS installieren (falls noch nicht vorhanden)
git lfs install

# Binary committen
git add src-tauri/binaries/
git commit -m "Add Ghostscript binary for [platform]"
git push
```

**Das war's!** Alle anderen Entwickler und End-User haben jetzt Ghostscript automatisch.

---

## 🔧 Wie funktioniert das?

### Build-Process (automatisch)

```
┌─────────────────────────────────────────────────────────┐
│  cargo build / npm run tauri:build                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  build.rs (Rust Build Script)                           │
├─────────────────────────────────────────────────────────┤
│  1. Prüft: Existiert binaries/gs-[platform]?            │
│                                                          │
│  ✓ JA  → Build weiter, Binary wird eingebettet          │
│                                                          │
│  ✗ NEIN → Sucht Ghostscript auf System:                 │
│           - which gs (macOS/Linux)                       │
│           - Common paths (C:\Program Files\gs\...)      │
│                                                          │
│  ✓ Gefunden → Kopiert nach binaries/                    │
│  ✗ Nicht gefunden → Zeigt Installations-Anweisungen     │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Tauri Bundle Process                                    │
├─────────────────────────────────────────────────────────┤
│  - Packt Binary ins App-Bundle                          │
│  - macOS: CutPilot.app/Contents/Resources/binaries/     │
│  - Windows: CutPilot/resources/binaries/                │
│  - Linux: /usr/lib/cutpilot/binaries/                   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Fertige App (Standalone!)                              │
│  ✓ Ghostscript embedded                                 │
│  ✓ ICC-Profile embedded (optional)                      │
│  ✓ Keine externe Abhängigkeiten                         │
└─────────────────────────────────────────────────────────┘
```

### Zur Laufzeit

```rust
// src-tauri/src/main.rs
let gs_binary = app_handle
    .path_resolver()
    .resolve_resource("binaries/gs")  // ← Aus App-Bundle
    .expect("Ghostscript binary not found");

// Ghostscript ausführen
Command::new(gs_binary)
    .args(["-dBATCH", "-dNOPAUSE", ...])
    .output()?;
```

Die Binary ist **fest im App-Bundle** integriert - genau wie bei Illustrator!

---

## 📦 Git LFS für große Binaries

Ghostscript-Binaries sind ~30 MB. Wir nutzen **Git LFS** (Large File Storage) für effizientes Handling:

### Setup Git LFS (einmalig)

```bash
# Git LFS installieren
brew install git-lfs        # macOS
sudo apt install git-lfs    # Ubuntu

# Im Repository aktivieren
git lfs install

# .gitattributes ist bereits konfiguriert:
# src-tauri/binaries/gs-* filter=lfs
```

### Verifizieren

```bash
# Prüfen ob Binary mit LFS getrackt wird
git lfs ls-files

# Sollte zeigen:
# src-tauri/binaries/gs-x86_64-apple-darwin
# src-tauri/binaries/gs-x86_64-pc-windows-msvc.exe
# ...
```

---

## 🎯 Multi-Platform Builds

### Für alle Plattformen builden

Du kannst Binaries für mehrere Plattformen committen:

```bash
# macOS (Intel)
src-tauri/binaries/gs-x86_64-apple-darwin

# macOS (Apple Silicon)
src-tauri/binaries/gs-aarch64-apple-darwin

# Windows
src-tauri/binaries/gs-x86_64-pc-windows-msvc.exe

# Linux
src-tauri/binaries/gs-x86_64-unknown-linux-gnu
```

**Beim Build wird automatisch die richtige Binary verwendet!**

### Cross-Platform Build

```bash
# Windows Binary auf macOS hinzufügen
# 1. Lade Ghostscript für Windows herunter
# 2. Extrahiere gswin64c.exe
# 3. Kopiere nach src-tauri/binaries/gs-x86_64-pc-windows-msvc.exe
# 4. Commit

git add src-tauri/binaries/gs-x86_64-pc-windows-msvc.exe
git commit -m "Add Windows Ghostscript binary"
```

---

## 🚨 Troubleshooting

### ❌ Build Error: "Ghostscript binary required for release build"

**Problem:** Du versuchst einen Release-Build, aber Binary fehlt.

**Lösung:**
```bash
# 1. Ghostscript installieren (siehe oben)
# 2. Debug-Build zuerst (kopiert Binary)
cargo build

# 3. Prüfen ob Binary vorhanden
ls src-tauri/binaries/

# 4. Jetzt Release-Build
cargo build --release
```

### ❌ "Ghostscript not found on system"

**Problem:** build.rs kann Ghostscript nicht finden.

**Lösung:**
```bash
# Prüfe ob installiert
which gs              # macOS/Linux
where gswin64c        # Windows

# Falls nicht gefunden, nochmal installieren
brew reinstall ghostscript  # macOS
```

### ❌ Git LFS Fehler beim Pushen

**Problem:** Binary ist zu groß für normales Git.

**Lösung:**
```bash
# Git LFS installieren
git lfs install

# Binary zu LFS migrieren
git lfs migrate import --include="src-tauri/binaries/gs-*"

# Nochmal pushen
git push
```

### ✅ Binary manuell hinzufügen

Falls automatisches Kopieren nicht funktioniert:

```bash
# macOS/Linux
cp $(which gs) src-tauri/binaries/gs-x86_64-apple-darwin
chmod +x src-tauri/binaries/gs-x86_64-apple-darwin

# Windows (PowerShell)
Copy-Item "C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe" `
          "src-tauri\binaries\gs-x86_64-pc-windows-msvc.exe"
```

---

## 📊 Binary Größen

| Platform | Binary | Größe | Mit LFS |
|----------|--------|-------|---------|
| macOS Intel | gs-x86_64-apple-darwin | ~23 MB | ~100 KB pointer |
| macOS ARM | gs-aarch64-apple-darwin | ~21 MB | ~100 KB pointer |
| Windows | gs-x86_64-pc-windows-msvc.exe | ~35 MB | ~100 KB pointer |
| Linux | gs-x86_64-unknown-linux-gnu | ~23 MB | ~100 KB pointer |

Mit Git LFS werden nur kleine Pointer-Dateien in Git gespeichert, die großen Binaries liegen auf LFS-Server.

---

## 🎨 ICC-Profile (Optional)

Funktioniert genauso wie Ghostscript:

```bash
# ICC-Profile hinzufügen
cp /path/to/ISOcoated_v2_eci.icc src-tauri/resources/icc-profiles/

# Committen (wird auch mit LFS getrackt)
git add src-tauri/resources/icc-profiles/
git commit -m "Add ISOcoated_v2_eci ICC profile"

# Werden automatisch ins App-Bundle gepackt!
```

---

## ✨ End-User Erlebnis

**Nach diesem Setup:**

1. User lädt `CutPilot.app` (oder `.exe` / `.deb`) herunter
2. User öffnet die App
3. **Alles funktioniert sofort!**
   - ✓ Ghostscript ist drin
   - ✓ ICC-Profile sind drin
   - ✓ Keine Installation nötig
   - ✓ Keine Konfiguration nötig

**Genau wie Illustrator, Photoshop, InDesign etc.!**

---

## 🔐 Lizenz-Hinweise

- **Ghostscript**: AGPL v3 (Open Source)
  - Für Open-Source-Projekte: ✓ Kostenlos
  - Für kommerzielle Closed-Source-Projekte: Kommerzielle Lizenz erforderlich
  - Mehr Info: https://www.ghostscript.com/licensing/

- **Embedding erlaubt**: Ja, du darfst Ghostscript in deine App einbetten, solange du die AGPL-Lizenz einhältst (oder eine kommerzielle Lizenz kaufst).

---

## 📚 Zusammenfassung

| Wer | Was | Wie |
|-----|-----|-----|
| **Entwickler (einmalig)** | Ghostscript einrichten | `brew install ghostscript` → `npm run tauri:dev` → `git commit` |
| **Weitere Entwickler** | Repository klonen | `git clone` → `npm install` → **Fertig!** |
| **End-User** | App installieren | App herunterladen → Öffnen → **Fertig!** |

**Keine manuellen Schritte für End-User!** 🎉

# Ghostscript Integration Setup Guide

## Übersicht

CutPilot nutzt jetzt Ghostscript als eingebettete Binary für professionelle CMYK-Konvertierung mit ICC-Profil-Unterstützung. Diese Anleitung erklärt, wie du die fehlenden Komponenten einrichtest.

## ✅ Was bereits implementiert ist

- ✅ Verzeichnisstruktur (`binaries/`, `resources/icc-profiles/`)
- ✅ Tauri-Konfiguration (`externalBin`, `resources`)
- ✅ Rust Backend mit Ghostscript-Integration
- ✅ TypeScript API Wrapper (`ghostscriptApi.ts`)
- ✅ React Hooks (`useGhostscript.ts`)
- ✅ Automatische Erkennung von Spot Colors
- ✅ ICC-Profil Metadaten-Parsing

## ❌ Was du noch machen musst

### 1. Ghostscript Binaries herunterladen

Die Ghostscript-Binaries sind **NICHT im Repository enthalten** (zu groß für Git).

#### Option A: Offizielle Releases (empfohlen für Produktion)

**Windows:**
```bash
# 1. Download von https://ghostscript.com/releases/gsdnld.html
# 2. Installiere Ghostscript (z.B. gs10.03.0 für Windows)
# 3. Kopiere die Binary aus dem Installationsverzeichnis

# Binary finden (normalerweise in C:\Program Files\gs\gs10.03.0\bin\)
# Kopiere gswin64c.exe nach:
cp "C:\Program Files\gs\gs10.03.0\bin\gswin64c.exe" src-tauri/binaries/gs-x86_64-pc-windows-msvc.exe

# Eventuelle DLLs auch kopieren:
cp "C:\Program Files\gs\gs10.03.0\bin\gsdll64.dll" src-tauri/binaries/
```

**macOS:**
```bash
# Via Homebrew
brew install ghostscript

# Binary kopieren
cp $(which gs) src-tauri/binaries/gs-x86_64-apple-darwin

# Für Apple Silicon (M1/M2)
cp $(which gs) src-tauri/binaries/gs-aarch64-apple-darwin

# Ausführbar machen
chmod +x src-tauri/binaries/gs-*
```

**Linux:**
```bash
# Via Package Manager
sudo apt install ghostscript  # Debian/Ubuntu
sudo dnf install ghostscript  # Fedora

# Binary kopieren
cp $(which gs) src-tauri/binaries/gs-x86_64-unknown-linux-gnu
chmod +x src-tauri/binaries/gs-x86_64-unknown-linux-gnu
```

#### Option B: Selbst kompilieren (kleiner, ~15-20 MB)

```bash
# Repository klonen
git clone https://github.com/ArtifexSoftware/ghostpdl.git
cd ghostpdl

# Nur benötigte Features kompilieren
./configure --disable-cups --disable-gtk \
            --with-drivers=pdfwrite,ps2write \
            --disable-compile-inits

make

# Binary ist in ./bin/gs
# Kopiere entsprechend deiner Plattform nach src-tauri/binaries/
```

#### Option C: Von bestehender Installation extrahieren

Wenn du Ghostscript bereits installiert hast:

```bash
# Binary finden
which gs  # macOS/Linux
where gs  # Windows

# Kopieren mit Platform-Name
cp $(which gs) src-tauri/binaries/gs-$(rustc -vV | grep host | cut -d' ' -f2)
```

### 2. ICC-Profile herunterladen

Die ICC-Profile sind ebenfalls **NICHT enthalten** (Lizenzgründe).

#### Empfohlene Profile für Druckereien:

**ISOcoated_v2_eci.icc (Fogra39)** - Standard Europa
```bash
# Download von ECI
# https://www.eci.org/downloads
# -> "Offset Printing" -> "ISOcoated_v2_eci.icc"

# Speichern nach:
# src-tauri/resources/icc-profiles/ISOcoated_v2_eci.icc
```

**PSO_Coated_v3.icc (Fogra51)** - Moderner Standard
```bash
# Download von ECI
# https://www.eci.org/downloads
# -> "Offset Printing" -> "PSO_Coated_v3.icc"

# Speichern nach:
# src-tauri/resources/icc-profiles/PSO_Coated_v3.icc
```

**sRGB.icc** - Standard RGB
```bash
# Download von Adobe oder International Color Consortium
# https://www.color.org/srgbprofiles.xalter

# Oder von deinem System kopieren:
# macOS: /System/Library/ColorSync/Profiles/sRGB Profile.icc
# Windows: C:\Windows\System32\spool\drivers\color\sRGB Color Space Profile.icm
# Linux: /usr/share/color/icc/sRGB.icc

# Speichern nach:
# src-tauri/resources/icc-profiles/sRGB.icc
```

#### Alle Downloads auf einen Blick:

| Profil | Zweck | Download |
|--------|-------|----------|
| ISOcoated_v2_eci.icc | CMYK Offset-Druck (Fogra39) | https://www.eci.org/downloads |
| PSO_Coated_v3.icc | CMYK Modern (Fogra51) | https://www.eci.org/downloads |
| sRGB.icc | RGB Standard | https://www.color.org/srgbprofiles.xalter |
| USWebCoatedSWOP.icc | CMYK USA | https://www.color.org/ |
| AdobeRGB1998.icc | RGB Wide Gamut | Adobe Website |

### 3. Verifikation

Nach dem Hinzufügen der Binaries und Profile:

```bash
# Verzeichnisstruktur prüfen
tree src-tauri/binaries
tree src-tauri/resources

# Sollte so aussehen:
# src-tauri/
# ├── binaries/
# │   ├── gs-x86_64-pc-windows-msvc.exe  (Windows)
# │   ├── gs-x86_64-apple-darwin         (macOS Intel)
# │   ├── gs-aarch64-apple-darwin        (macOS ARM)
# │   └── gs-x86_64-unknown-linux-gnu    (Linux)
# └── resources/
#     └── icc-profiles/
#         ├── ISOcoated_v2_eci.icc
#         ├── PSO_Coated_v3.icc
#         ├── sRGB.icc
#         └── ...
```

### 4. Build und Test

```bash
# Dependencies installieren
cd src-tauri
cargo fetch

# Development Build
npm run tauri dev

# Production Build
npm run tauri build
```

## Verwendung im Code

### TypeScript/React

```tsx
import { useGhostscript } from './hooks/useGhostscript';
import { RenderIntent } from './utils/ghostscript/ghostscriptApi';

function PDFConverter() {
  const {
    availableProfiles,
    convert,
    isLoading,
    error,
    conversionResult
  } = useGhostscript();

  const handleConvert = async () => {
    const result = await convert({
      inputPath: '/path/to/input.pdf',
      outputPath: '/path/to/output.pdf',
      iccProfileName: 'ISOcoated_v2_eci.icc',
      preserveSpotColors: true,  // CutContour erhalten!
      renderIntent: RenderIntent.RelativeColorimetric
    });

    if (result.success) {
      console.log('✅ CMYK Conversion successful!');
    } else {
      console.error('❌ Error:', result.error);
    }
  };

  return (
    <div>
      <h2>Verfügbare ICC-Profile:</h2>
      <select>
        {availableProfiles.map(profile => (
          <option key={profile} value={profile}>
            {profile}
          </option>
        ))}
      </select>

      <button onClick={handleConvert} disabled={isLoading}>
        {isLoading ? 'Konvertiere...' : 'Zu CMYK konvertieren'}
      </button>

      {error && <div className="error">{error}</div>}
      {conversionResult && (
        <div className="success">
          {conversionResult.message}
        </div>
      )}
    </div>
  );
}
```

### Direkte API-Nutzung

```ts
import {
  convertToCMYK,
  listICCProfiles,
  checkSpotColors,
  RenderIntent
} from './utils/ghostscript/ghostscriptApi';

// ICC-Profile auflisten
const profiles = await listICCProfiles();
console.log('Available profiles:', profiles);

// Spot Colors prüfen
const spotColors = await checkSpotColors('/path/to/input.pdf');
console.log('Spot colors:', spotColors);  // ['CutContour', ...]

// CMYK-Konvertierung
const result = await convertToCMYK({
  inputPath: '/path/to/input.pdf',
  outputPath: '/path/to/output.pdf',
  iccProfileName: 'ISOcoated_v2_eci.icc',
  preserveSpotColors: true,
  renderIntent: RenderIntent.RelativeColorimetric
});

if (result.success) {
  console.log('✅ Success!');
} else {
  console.error('❌ Error:', result.error);
}
```

## Technische Details

### Ghostscript Parameter

Die Rust-Implementation nutzt folgende Ghostscript-Parameter:

```bash
gs \
  -dSAFER \                                    # Sicherheitsmodus
  -dBATCH \                                    # Batch-Modus
  -dNOPAUSE \                                  # Keine Pausen
  -sDEVICE=pdfwrite \                          # PDF Output
  -dPDFSETTINGS=/prepress \                    # Prepress-Qualität
  -sProcessColorModel=DeviceCMYK \             # CMYK Output
  -sColorConversionStrategy=CMYK \             # Zu CMYK konvertieren
  -sColorConversionStrategyForImages=CMYK \    # Auch Bilder
  -dOverrideICC=true \                         # ICC-Profil erzwingen
  -dPreserveSeparation=true \                  # Spot Colors erhalten!
  -dPreserveDeviceN=true \                     # DeviceN erhalten
  -sOutputICCProfile=/path/to/profile.icc \    # ICC-Profil
  -dRenderIntent=1 \                           # RelativeColorimetric
  -sOutputFile=/path/to/output.pdf \           # Output
  /path/to/input.pdf                           # Input
```

### Render Intents

| Intent | Wert | Beschreibung | Verwendung |
|--------|------|--------------|------------|
| Perceptual | 0 | Gamut-Kompression, behält Verhältnisse | Fotos |
| RelativeColorimetric | 1 | Erhält In-Gamut-Farben | **Standard Druck** |
| Saturation | 2 | Maximale Sättigung | Grafiken, Charts |
| AbsoluteColorimetric | 3 | Simuliert Papier-Weiß | Proofing |

### Spot Color Preservation

Wenn `preserveSpotColors: true` gesetzt ist:
- CutContour wird **nicht** nach CMYK konvertiert
- Bleibt als Separation Color Space erhalten
- Wird in Illustrator/Acrobat als Spot Color angezeigt
- Perfekt für Druckerei-Workflows

## Troubleshooting

### ❌ "Ghostscript binary not found"

**Lösung:** Binary fehlt oder falscher Name
```bash
# Prüfe, ob Binary existiert:
ls -la src-tauri/binaries/

# Binary muss heißen:
# - Windows: gs-x86_64-pc-windows-msvc.exe
# - macOS Intel: gs-x86_64-apple-darwin
# - macOS ARM: gs-aarch64-apple-darwin
# - Linux: gs-x86_64-unknown-linux-gnu
```

### ❌ "ICC profile not found"

**Lösung:** ICC-Profil fehlt
```bash
# Prüfe, ob Profile existieren:
ls -la src-tauri/resources/icc-profiles/

# Lade fehlende Profile herunter (siehe oben)
```

### ❌ "Permission denied" (macOS/Linux)

**Lösung:** Binary ist nicht ausführbar
```bash
chmod +x src-tauri/binaries/gs-*
```

### ❌ Build schlägt fehl

**Lösung:** Rust-Dependencies fehlen
```bash
cd src-tauri
cargo clean
cargo fetch
cargo build
```

## Lizenzhinweise

- **Ghostscript**: AGPL v3 (Open Source)
  - Für kommerzielle Nutzung ohne AGPL: Kommerzielle Lizenz erforderlich
  - Mehr Info: https://www.ghostscript.com/licensing/

- **ICC-Profile**: Unterschiedlich je nach Profil
  - ECI-Profile (ISOcoated, PSO): Kostenlos nutzbar
  - sRGB: Public Domain
  - Prüfe spezifische Lizenzen vor Redistribution

## Weitere Ressourcen

- **Ghostscript Dokumentation**: https://www.ghostscript.com/doc/
- **ICC-Profile Standard**: https://www.color.org/
- **ECI Downloads**: https://www.eci.org/downloads
- **Tauri External Binaries**: https://tauri.app/v1/guides/building/sidecar

## Support

Bei Problemen:
1. Prüfe diese Anleitung
2. Überprüfe `src-tauri/binaries/README.md`
3. Überprüfe `src-tauri/resources/icc-profiles/README.md`
4. Öffne ein Issue auf GitHub

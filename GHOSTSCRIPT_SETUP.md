# Ghostscript Integration - Automatisches Setup

## ✅ Automatische Installation

CutPilot nutzt Ghostscript für professionelle CMYK-Konvertierung. **Das Setup läuft automatisch!**

### Wie es funktioniert

Wenn du `npm install` ausführst, wird automatisch:

1. **Ghostscript erkannt** (falls auf deinem System installiert)
2. **Binary kopiert** nach `src-tauri/binaries/`
3. **Ausführbar gemacht** (macOS/Linux)

**Du musst nichts manuell machen!**

---

## 🖥️ Pro Plattform

### macOS

```bash
# 1. Ghostscript installieren
brew install ghostscript

# 2. npm install ausführen (kopiert Ghostscript automatisch)
npm install

# Fertig! ✓
```

### Linux (Ubuntu/Debian)

```bash
# 1. Ghostscript installieren
sudo apt install ghostscript

# 2. npm install ausführen
npm install

# Fertig! ✓
```

### Linux (Fedora/RHEL)

```bash
# 1. Ghostscript installieren
sudo dnf install ghostscript

# 2. npm install ausführen
npm install

# Fertig! ✓
```

### Windows

Windows erfordert **einen manuellen Schritt** (einmalig):

```powershell
# 1. Ghostscript herunterladen und installieren
# https://ghostscript.com/releases/gsdnld.html
# -> "Ghostscript 10.03.1 for Windows (64 bit)"

# 2. Binary kopieren (PowerShell als Administrator)
Copy-Item "C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe" "src-tauri\binaries\gs-x86_64-pc-windows-msvc.exe"

# 3. npm install ausführen
npm install

# Fertig! ✓
```

**Oder:** Führe einfach `npm install` aus - es zeigt dir die genauen Schritte!

---

## 🔍 Was wurde implementiert?

### 1. Automatisches Setup-Script

**`scripts/setup-ghostscript.js`** läuft bei jedem `npm install`:

- Erkennt deine Plattform (Windows/macOS/Linux)
- Findet Ghostscript auf deinem System
- Kopiert die Binary automatisch
- Macht sie ausführbar

### 2. Build-Integration

**`src-tauri/build.rs`** prüft beim Cargo-Build:

- ✅ Ist Ghostscript-Binary vorhanden?
- ⚠️ Falls nicht: Zeigt klare Anweisungen

### 3. Rust Backend

**`src-tauri/src/main.rs`** - 4 Tauri Commands:

```rust
convert_to_cmyk         // RGB → CMYK mit ICC-Profil
list_icc_profiles       // Verfügbare Profile auflisten
check_spot_colors       // Spot Colors erkennen (z.B. CutContour)
get_icc_profile_info    // ICC-Profil Metadaten lesen
```

### 4. Frontend Integration

**TypeScript Funktionen:**

```ts
// src/utils/ghostscript/ghostscriptApi.ts
convertToCMYK()         // CMYK konvertieren
listICCProfiles()       // Profile auflisten
checkSpotColors()       // Spot Colors prüfen
getICCProfileInfo()     // Profil-Info abrufen
```

**React Hook:**

```tsx
// src/hooks/useGhostscript.ts
const { convert, availableProfiles, isLoading } = useGhostscript();
```

---

## 💻 Verwendung im Code

### React Component (einfachste Variante)

```tsx
import { useGhostscript } from './hooks/useGhostscript';
import { RenderIntent } from './utils/ghostscript/ghostscriptApi';

function PDFConverter() {
  const {
    availableProfiles,  // Verfügbare ICC-Profile
    convert,            // Konvertierungs-Funktion
    isLoading,          // Lädt gerade?
    error               // Fehler?
  } = useGhostscript();

  const handleConvert = async () => {
    const result = await convert({
      inputPath: '/path/to/input.pdf',
      outputPath: '/path/to/output.pdf',
      iccProfileName: 'ISOcoated_v2_eci.icc',
      preserveSpotColors: true,  // CutContour bleibt erhalten!
      renderIntent: RenderIntent.RelativeColorimetric
    });

    if (result.success) {
      console.log('✅ CMYK Conversion erfolgreich!');
    } else {
      console.error('❌ Fehler:', result.error);
    }
  };

  return (
    <div>
      <h2>CMYK Konvertierung</h2>

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

// 1. Profile auflisten
const profiles = await listICCProfiles();
console.log('Verfügbare Profile:', profiles);
// → ['ISOcoated_v2_eci.icc', 'sRGB.icc', ...]

// 2. Spot Colors prüfen
const spotColors = await checkSpotColors('/path/to/input.pdf');
console.log('Spot Colors:', spotColors);
// → ['CutContour', 'PantoneCoolGray11C']

// 3. CMYK konvertieren
const result = await convertToCMYK({
  inputPath: '/path/to/input.pdf',
  outputPath: '/path/to/output-cmyk.pdf',
  iccProfileName: 'ISOcoated_v2_eci.icc',
  preserveSpotColors: true,
  renderIntent: RenderIntent.RelativeColorimetric
});

if (result.success) {
  console.log('✅ Erfolgreich konvertiert!');
} else {
  console.error('❌ Fehler:', result.error);
}
```

---

## 🎯 Features

### CMYK-Konvertierung

- ✅ **Echte RGB → CMYK Konvertierung** (nicht nur Metadaten!)
- ✅ **ICC-Profil-Unterstützung** (ISOcoated_v2_eci, PSO_Coated_v3, etc.)
- ✅ **4 Render Intents**:
  - `Perceptual` (0) - Für Fotos
  - `RelativeColorimetric` (1) - **Standard für Druck**
  - `Saturation` (2) - Für Grafiken
  - `AbsoluteColorimetric` (3) - Für Proofing

### Spot Color Preservation

- ✅ **CutContour bleibt erhalten** als Separation Color
- ✅ **Automatische Erkennung** von Spot Colors
- ✅ **Keine Konvertierung** wenn `preserveSpotColors: true`

### Qualität

- ✅ **Prepress-Qualität** (`/prepress` Settings)
- ✅ **Professionelle Ghostscript-Parameter**
- ✅ **PDF/X-3 kompatibel**

---

## 🔧 Technische Details

### Ghostscript-Parameter (in Rust Backend)

```bash
gs \
  -dSAFER                                    # Sicherheitsmodus
  -dBATCH                                    # Batch-Modus
  -dNOPAUSE                                  # Keine Pausen
  -sDEVICE=pdfwrite                          # PDF Output
  -dPDFSETTINGS=/prepress                    # Höchste Qualität
  -sProcessColorModel=DeviceCMYK             # CMYK Output
  -sColorConversionStrategy=CMYK             # Zu CMYK konvertieren
  -sColorConversionStrategyForImages=CMYK    # Auch Bilder
  -dOverrideICC=true                         # ICC-Profil erzwingen
  -dPreserveSeparation=true                  # Spot Colors erhalten!
  -dPreserveDeviceN=true                     # DeviceN erhalten
  -sOutputICCProfile=/path/to/profile.icc    # ICC-Profil
  -dRenderIntent=1                           # RelativeColorimetric
  -sOutputFile=/path/to/output.pdf           # Output
  /path/to/input.pdf                         # Input
```

### Verzeichnisstruktur

```
cutpilot/
├── src-tauri/
│   ├── binaries/                  ← Ghostscript Binaries
│   │   ├── gs-x86_64-pc-windows-msvc.exe    (Windows)
│   │   ├── gs-x86_64-apple-darwin           (macOS Intel)
│   │   ├── gs-aarch64-apple-darwin          (macOS ARM)
│   │   └── gs-x86_64-unknown-linux-gnu      (Linux)
│   ├── resources/
│   │   └── icc-profiles/          ← ICC-Profile (optional)
│   │       ├── ISOcoated_v2_eci.icc
│   │       ├── sRGB.icc
│   │       └── ...
│   ├── src/
│   │   └── main.rs                ← Rust Backend
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── hooks/
│   │   └── useGhostscript.ts      ← React Hook
│   └── utils/
│       └── ghostscript/
│           └── ghostscriptApi.ts   ← TypeScript API
└── scripts/
    └── setup-ghostscript.js        ← Auto-Setup
```

---

## 📋 ICC-Profile (Optional)

Du kannst eigene ICC-Profile hinzufügen:

### Wo bekomme ich Profile?

1. **European Color Initiative (ECI)** - https://www.eci.org/downloads
   - ISOcoated_v2_eci.icc (Fogra39)
   - PSO_Coated_v3.icc (Fogra51)

2. **Adobe** - https://www.adobe.com/support/downloads/iccprofiles/
   - sRGB.icc
   - AdobeRGB1998.icc

3. **Dein System**
   - macOS: `/System/Library/ColorSync/Profiles/`
   - Windows: `C:\Windows\System32\spool\drivers\color\`
   - Linux: `/usr/share/color/icc/`

### Installation

```bash
# ICC-Profile nach resources/icc-profiles/ kopieren
cp /path/to/ISOcoated_v2_eci.icc src-tauri/resources/icc-profiles/

# Beim Build werden sie automatisch eingebettet
npm run tauri:build
```

---

## 🚨 Troubleshooting

### ❌ "Ghostscript binary not found"

**macOS/Linux:**
```bash
# Ghostscript installieren
brew install ghostscript       # macOS
sudo apt install ghostscript   # Ubuntu

# Setup neu ausführen
npm run setup
```

**Windows:**
1. Lade Ghostscript herunter: https://ghostscript.com/releases/gsdnld.html
2. Installiere es
3. Kopiere `gswin64c.exe` nach `src-tauri/binaries/gs-x86_64-pc-windows-msvc.exe`

### ❌ "Permission denied" (macOS/Linux)

```bash
# Binary ausführbar machen
chmod +x src-tauri/binaries/gs-*
```

### ❌ Setup-Script läuft nicht

```bash
# Manuell ausführen
npm run setup
```

### ✅ Binary prüfen

```bash
# Prüfe ob Binary existiert
ls -la src-tauri/binaries/

# Sollte zeigen:
# gs-x86_64-apple-darwin (macOS)
# gs-x86_64-pc-windows-msvc.exe (Windows)
# gs-x86_64-unknown-linux-gnu (Linux)
```

---

## 📚 Weitere Infos

- **Ghostscript**: https://www.ghostscript.com/
- **ICC-Profile**: https://www.color.org/
- **Tauri External Binaries**: https://tauri.app/v1/guides/building/sidecar

---

## ✨ Zusammenfassung

**Das Tool ist jetzt komplett!** Es:

1. ✅ Lädt Ghostscript **automatisch** beim `npm install`
2. ✅ Konvertiert PDFs **professionell** zu CMYK
3. ✅ Erhält **Spot Colors** (CutContour)
4. ✅ Unterstützt **ICC-Profile**
5. ✅ Funktioniert auf **Windows/macOS/Linux**

**Du musst nur:**
- `npm install` ausführen (installiert Ghostscript automatisch)
- Deine ICC-Profile hinzufügen (optional)
- Fertig!

Die TypeScript-Funktionen in `ghostscriptApi.ts` sind **keine externe API**, sondern nur **Wrapper-Funktionen**, die das Rust-Backend aufrufen. Das ist Standard in Tauri-Apps.

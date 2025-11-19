# LÖSUNG: Echtes CMYK mit Tauri + Ghostscript

## 3 Optionen gefunden:

### ❌ Option 1: printpdf (Rust Crate)
- **Pro:** Native Rust, CMYK-Farben unterstützt
- **Contra:** CMYK-**Bilder** einbetten unklar dokumentiert
- **Status:** Zu riskant für Production

### ❌ Option 2: PDFKit-CMYK (Node.js)
- **Pro:** `pdfkit-cmyk` npm package verfügbar
- **Contra:** Node.js in Tauri einbinden = komplex
- **Status:** Zu viel Overhead

### ✅ **Option 3: Ghostscript via Tauri Backend (EMPFOHLEN)**
- **Pro:** Bewährt in Druckindustrie, echtes CMYK, ICC-Profile
- **Contra:** Ghostscript muss installiert sein
- **Status:** **BESTE LÖSUNG!**

---

## Implementierung: Tauri + Ghostscript

### Architektur:

```
Frontend (React/TypeScript)
  ↓ (invoke Tauri command)
Tauri Backend (Rust)
  ↓ (execute command)
Ghostscript CLI
  ↓
Echtes CMYK-PDF
```

### Vorteile:
1. ✅ **Echte CMYK-Konvertierung** (nicht simuliert!)
2. ✅ **ICC-Profile werden korrekt angewendet**
3. ✅ **Bewährt in der Druckindustrie**
4. ✅ **Keine WASM-Größenbeschränkungen**
5. ✅ **Funktioniert offline**

### Nachteile:
1. ⚠️ Ghostscript muss mit App gebündelt werden
2. ⚠️ Größerer App-Bundle (~30-50MB)

---

## Implementierung in 3 Schritten:

### Schritt 1: Ghostscript in Tauri Bundle einbinden

**Datei:** `src-tauri/tauri.conf.json`

```json
{
  "tauri": {
    "bundle": {
      "resources": {
        "macos": ["../ghostscript/macos/gs"],
        "windows": ["../ghostscript/windows/gswin64c.exe"]
      }
    }
  }
}
```

### Schritt 2: Rust Backend Command

**Datei:** `src-tauri/src/cmyk_converter.rs`

```rust
use std::process::Command;
use std::path::PathBuf;

#[tauri::command]
pub async fn convert_to_cmyk(
    input_pdf: PathBuf,
    output_pdf: PathBuf,
    icc_profile: Option<PathBuf>,
) -> Result<String, String> {
    // Get Ghostscript path from bundled resources
    let gs_path = get_ghostscript_path()
        .map_err(|e| format!("Ghostscript not found: {}", e))?;

    let mut cmd = Command::new(gs_path);
    cmd.arg("-dNOPAUSE")
        .arg("-dBATCH")
        .arg("-sDEVICE=pdfwrite")
        .arg("-sColorConversionStrategy=CMYK")
        .arg("-dProcessColorModel=/DeviceCMYK");

    // Add ICC profile if provided
    if let Some(icc_path) = icc_profile {
        cmd.arg(format!("-sOutputICCProfile={}", icc_path.display()));
    }

    cmd.arg(format!("-sOutputFile={}", output_pdf.display()))
        .arg(input_pdf);

    let output = cmd.output()
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if output.status.success() {
        Ok(output_pdf.to_string_lossy().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

fn get_ghostscript_path() -> Result<PathBuf, String> {
    // Try bundled Ghostscript first
    let resource_dir = tauri::api::path::resource_dir(&tauri::api::PackageInfo::default())
        .ok_or("Failed to get resource directory")?;

    #[cfg(target_os = "macos")]
    let gs_path = resource_dir.join("gs");

    #[cfg(target_os = "windows")]
    let gs_path = resource_dir.join("gswin64c.exe");

    #[cfg(target_os = "linux")]
    let gs_path = PathBuf::from("gs"); // Use system Ghostscript on Linux

    if gs_path.exists() || cfg!(target_os = "linux") {
        Ok(gs_path)
    } else {
        Err("Ghostscript binary not found".to_string())
    }
}
```

**Registrierung in:** `src-tauri/src/main.rs`

```rust
mod cmyk_converter;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            cmyk_converter::convert_to_cmyk
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Schritt 3: Frontend Integration

**Datei:** `src/utils/cmykConverter.ts`

```typescript
import { invoke } from '@tauri-apps/api/tauri';

export async function convertPDFtoCMYK(
  inputPdfPath: string,
  outputPdfPath: string,
  iccProfilePath?: string
): Promise<string> {
  try {
    const result = await invoke<string>('convert_to_cmyk', {
      inputPdf: inputPdfPath,
      outputPdf: outputPdfPath,
      iccProfile: iccProfilePath || null
    });

    console.log('CMYK conversion successful:', result);
    return result;
  } catch (error) {
    console.error('CMYK conversion failed:', error);
    throw error;
  }
}
```

---

## Workflow:

```
1. User lädt RGB-Bild hoch
   ↓
2. Frontend erstellt RGB-PDF mit pdf-lib (wie bisher)
   ↓
3. Frontend speichert temporär als rgb_temp.pdf
   ↓
4. Frontend ruft convertPDFtoCMYK() auf
   ↓
5. Tauri Backend startet Ghostscript
   ↓
6. Ghostscript konvertiert RGB → CMYK + ICC-Profil
   ↓
7. Echtes CMYK-PDF wird zurückgegeben
   ↓
8. User kann CMYK-PDF herunterladen
```

---

## Ghostscript Bundle:

### Wo Ghostscript bekommen?

**macOS:**
```bash
# Download Ghostscript macOS binary
# https://ghostscript.com/releases/gsdnld.html
# Extrahiere 'gs' binary nach: ghostscript/macos/gs
```

**Windows:**
```bash
# Download Ghostscript Windows
# https://ghostscript.com/releases/gsdnld.html
# Extrahiere 'gswin64c.exe' nach: ghostscript/windows/gswin64c.exe
```

### Lizenz:
- Ghostscript: AGPL oder Commercial License
- Für kommerzielle App: Commercial License kaufen (~$1,000)
- Für Open Source: AGPL OK

---

## Alternative: Ghostscript als System-Dependency

Falls Bundle zu groß:

**Installer überprüft Ghostscript:**
```rust
// Check if system Ghostscript is available
fn check_system_ghostscript() -> bool {
    Command::new("gs")
        .arg("--version")
        .output()
        .is_ok()
}

// Show error if not found
if !check_system_ghostscript() {
    show_error_dialog("Bitte Ghostscript installieren: https://ghostscript.com");
}
```

---

## Geschätzte Implementierungszeit:

- **Setup:** 2-3 Stunden
- **Testing:** 2-3 Stunden
- **Bundle-Packaging:** 1-2 Stunden

**Total:** ~1 Tag Arbeit

---

## Fazit:

**Dies ist die einzige praktische Lösung für echtes CMYK in CutPilot.**

- ✅ Funktioniert garantiert
- ✅ Bewährt in Druckindustrie
- ✅ ICC-Profile werden korrekt angewendet
- ✅ Offline-fähig

**Nächster Schritt:** Ghostscript binaries herunterladen und in Projekt einbinden.

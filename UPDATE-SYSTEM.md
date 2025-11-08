# CutPilot Auto-Update System

## Übersicht

CutPilot verfügt über ein integriertes Auto-Update-System, das es ermöglicht, neue Versionen direkt aus der Anwendung heraus zu installieren, ohne die Software manuell neu herunterzuladen.

## Funktionen

### Für Benutzer

1. **Update-Prüfung**:
   - Öffne **Einstellungen** → **Software-Updates**
   - Klicke auf **"Auf Updates prüfen"**
   - Die App prüft automatisch, ob eine neue Version verfügbar ist

2. **Update-Installation**:
   - Wenn ein Update verfügbar ist, wird eine Benachrichtigung angezeigt
   - Klicke auf **"Update installieren"**
   - Die App lädt das Update herunter und installiert es
   - Nach der Installation startet die App automatisch neu

3. **Version anzeigen**:
   - Die aktuelle Version wird in den Settings angezeigt
   - Format: `1.0.0`

### Für Entwickler

## Update-Prozess

1. **Build erstellen**:
   ```bash
   npm run tauri build
   ```

2. **GitHub Release erstellen**:
   - Gehe zu GitHub → Releases → "New Release"
   - Tag: `v1.0.1` (Versionsnummer aus `package.json`)
   - Titel: `Version 1.0.1`
   - Beschreibung: Changelog mit den Änderungen

3. **Binaries hochladen**:
   - macOS: `src-tauri/target/release/bundle/dmg/CutPilot_1.0.1_x64.dmg`
   - macOS ARM: `src-tauri/target/release/bundle/dmg/CutPilot_1.0.1_aarch64.dmg`
   - Windows: `src-tauri/target/release/bundle/msi/CutPilot_1.0.1_x64_en-US.msi`

4. **Update-Manifest erstellen**:

   Erstelle eine Datei `latest.json` mit folgendem Inhalt:

   ```json
   {
     "version": "1.0.1",
     "notes": "Neue Features:\n- Feature 1\n- Feature 2\n\nBugfixes:\n- Fix 1\n- Fix 2",
     "pub_date": "2024-11-08T12:00:00Z",
     "platforms": {
       "darwin-x86_64": {
         "signature": "",
         "url": "https://github.com/kobot24/cutpilot-98343/releases/download/v1.0.1/CutPilot_1.0.1_x64.dmg"
       },
       "darwin-aarch64": {
         "signature": "",
         "url": "https://github.com/kobot24/cutpilot-98343/releases/download/v1.0.1/CutPilot_1.0.1_aarch64.dmg"
       },
       "windows-x86_64": {
         "signature": "",
         "url": "https://github.com/kobot24/cutpilot-98343/releases/download/v1.0.1/CutPilot_1.0.1_x64_en-US.msi"
       }
     }
   }
   ```

5. **Manifest hochladen**:
   - Lade `latest.json` zum Release hoch
   - Der Updater prüft automatisch: `https://github.com/kobot24/cutpilot-98343/releases/latest/download/latest.json`

## Konfiguration

### Updater aktivieren/deaktivieren

In `src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/kobot24/cutpilot-98343/releases/latest/download/latest.json"
      ],
      "dialog": false
    }
  }
}
```

### Permissions

Stelle sicher, dass die Updater-Permissions aktiviert sind:

```json
{
  "tauri": {
    "allowlist": {
      "updater": {
        "all": true
      }
    }
  }
}
```

## Signierte Updates (Optional)

Für mehr Sicherheit können Updates signiert werden:

1. **Schlüssel generieren**:
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/myapp.key
   ```

2. **Public Key in Config eintragen**:
   ```json
   {
     "updater": {
       "pubkey": "DEIN_PUBLIC_KEY_HIER"
     }
   }
   ```

3. **Builds signieren**:
   Die Signatur wird automatisch beim Build erstellt und in die `latest.json` eingetragen.

## Fehlerbehandlung

- **Update-Prüfung fehlgeschlagen**: Überprüfe die Internetverbindung
- **Download fehlgeschlagen**: Stelle sicher, dass die URLs in `latest.json` korrekt sind
- **Installation fehlgeschlagen**: App-Berechtigungen überprüfen

## Testen

1. **Lokales Testen**:
   - Erstelle ein Test-Release mit höherer Versionsnummer
   - Baue die App mit niedrigerer Version
   - Teste den Update-Prozess

2. **Automatische Updates deaktivieren** (für Tests):
   ```json
   {
     "updater": {
       "active": false
     }
   }
   ```

## Wichtige Hinweise

- Updates sind nur in der **Desktop-Version** verfügbar (nicht im Browser)
- Die App muss **online** sein, um Updates zu prüfen
- Nach der Installation startet die App **automatisch neu**
- Der Update-Button ist nur in den **Einstellungen** sichtbar

## Weitere Informationen

- [Tauri Updater Dokumentation](https://tauri.app/v1/guides/distribution/updater)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

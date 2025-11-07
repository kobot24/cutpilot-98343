#!/bin/bash

# CutPilot Mac Build Script
# Automatischer Build für macOS Desktop App

set -e  # Stop bei Fehlern

echo "🎨 CutPilot Mac Build Script"
echo "============================"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion für Status-Messages
print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Schritt 1: Prüfe Voraussetzungen
echo "📋 Prüfe Voraussetzungen..."
echo ""

# Node.js prüfen
if ! command -v node &> /dev/null; then
    print_error "Node.js ist nicht installiert!"
    echo "Installiere mit: brew install node"
    exit 1
else
    NODE_VERSION=$(node -v)
    print_step "Node.js gefunden: $NODE_VERSION"
fi

# npm prüfen
if ! command -v npm &> /dev/null; then
    print_error "npm ist nicht installiert!"
    exit 1
else
    NPM_VERSION=$(npm -v)
    print_step "npm gefunden: $NPM_VERSION"
fi

# Rust prüfen
if ! command -v rustc &> /dev/null; then
    print_warning "Rust ist nicht installiert!"
    echo ""
    echo "Installiere Rust jetzt? (j/n)"
    read -r answer
    if [ "$answer" = "j" ] || [ "$answer" = "J" ]; then
        echo "Installiere Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        print_step "Rust installiert!"
    else
        print_error "Rust wird benötigt. Abbruch."
        exit 1
    fi
else
    RUST_VERSION=$(rustc --version)
    print_step "Rust gefunden: $RUST_VERSION"
fi

# Cargo prüfen
if ! command -v cargo &> /dev/null; then
    print_error "Cargo ist nicht installiert!"
    exit 1
else
    CARGO_VERSION=$(cargo --version)
    print_step "Cargo gefunden: $CARGO_VERSION"
fi

echo ""
echo "✅ Alle Voraussetzungen erfüllt!"
echo ""

# Schritt 2: Dependencies installieren
echo "📦 Installiere Dependencies..."
echo ""

if [ ! -d "node_modules" ]; then
    print_step "Installiere npm packages..."
    npm install
else
    print_step "node_modules bereits vorhanden, überspringe npm install"
fi

echo ""

# Schritt 3: Build starten
echo "🔨 Starte Tauri Build..."
echo "⏱️  Das kann 5-10 Minuten dauern..."
echo ""

# Build mit Progress-Anzeige
npm run tauri:build

echo ""

# Schritt 4: Prüfe Build-Ergebnis
echo "🔍 Prüfe Build-Ergebnis..."
echo ""

DMG_PATH="src-tauri/target/release/bundle/dmg"
APP_PATH="src-tauri/target/release/bundle/macos"

if [ -d "$DMG_PATH" ]; then
    DMG_FILE=$(find "$DMG_PATH" -name "*.dmg" | head -n 1)
    if [ -n "$DMG_FILE" ]; then
        FILE_SIZE=$(du -h "$DMG_FILE" | cut -f1)
        print_step "DMG-Datei erstellt: $FILE_SIZE"
        echo ""
        echo "📍 Speicherort:"
        echo "   $DMG_FILE"
        echo ""

        # DMG im Finder anzeigen
        echo "Möchten Sie die DMG-Datei im Finder anzeigen? (j/n)"
        read -r show_finder
        if [ "$show_finder" = "j" ] || [ "$show_finder" = "J" ]; then
            open -R "$DMG_FILE"
        fi
    else
        print_warning "DMG-Datei nicht gefunden in $DMG_PATH"
    fi
else
    print_warning "DMG-Verzeichnis nicht gefunden"
fi

if [ -d "$APP_PATH" ]; then
    APP_FILE=$(find "$APP_PATH" -name "*.app" | head -n 1)
    if [ -n "$APP_FILE" ]; then
        print_step "App-Bundle erstellt"
        echo "   $APP_FILE"
        echo ""

        # App direkt starten?
        echo "Möchten Sie die App jetzt starten? (j/n)"
        read -r start_app
        if [ "$start_app" = "j" ] || [ "$start_app" = "J" ]; then
            # Gatekeeper umgehen für lokale Entwicklung
            xattr -cr "$APP_FILE"
            open "$APP_FILE"
        fi
    fi
fi

echo ""
echo "🎉 Build erfolgreich abgeschlossen!"
echo ""
echo "Die DMG-Datei kann nun verteilt werden."
echo ""

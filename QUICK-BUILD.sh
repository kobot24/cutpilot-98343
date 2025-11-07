#!/bin/bash
# Ultra-Schnell-Build für eilige Entwickler
# Installiert ALLES und baut die DMG automatisch

set -e

echo "🚀 CutPilot Express-Build"
echo "========================"
echo ""

# Rust installieren falls nötig
if ! command -v cargo &> /dev/null; then
    echo "📥 Installiere Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Node Dependencies
echo "📦 Installiere Dependencies..."
npm install --silent

# Build
echo "🔨 Baue Desktop-App..."
echo "⏱️  Dauert 5-10 Minuten..."
npm run tauri:build

# Ergebnis anzeigen
echo ""
echo "✅ FERTIG!"
echo ""
DMG=$(find src-tauri/target/release/bundle/dmg -name "*.dmg" 2>/dev/null | head -n 1)
if [ -n "$DMG" ]; then
    echo "📍 DMG-Datei:"
    echo "   $DMG"
    echo ""
    open -R "$DMG"
else
    echo "⚠️  DMG nicht gefunden. Prüfen Sie: src-tauri/target/release/bundle/"
fi

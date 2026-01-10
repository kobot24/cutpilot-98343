# Ghostscript Binaries

This directory contains platform-specific Ghostscript binaries that are bundled with the application.

## Required Files

### Windows
- `gs-x86_64-pc-windows-msvc.exe` - Ghostscript for Windows x64
- Required DLLs should be placed alongside the executable

### macOS
- `gs-x86_64-apple-darwin` - Ghostscript for macOS Intel
- `gs-aarch64-apple-darwin` - Ghostscript for macOS Apple Silicon (M1/M2)

### Linux (Optional)
- `gs-x86_64-unknown-linux-gnu` - Ghostscript for Linux x64

## How to Obtain Ghostscript Binaries

### Option A: Official Releases (Easiest)
Download from: https://ghostscript.com/releases/gsdnld.html

- **Windows**: Download `gswin64c.exe` from the Windows installer
- **macOS**: Build universal binary or download from Homebrew
- **Linux**: Use system package manager or build from source

### Option B: Build from Source (Smaller Size)
```bash
# Clone Ghostscript repository
git clone https://github.com/ArtifexSoftware/ghostpdl.git
cd ghostpdl

# Configure with only required features
./configure --disable-cups --disable-gtk --with-drivers=pdfwrite,ps2write

# Build
make

# The binary will be in ./bin/gs
```

### Option C: Extract from Homebrew (macOS)
```bash
# Install via Homebrew
brew install ghostscript

# Find binary location
which gs  # Usually /opt/homebrew/bin/gs or /usr/local/bin/gs

# Copy to project
cp $(which gs) ./src-tauri/binaries/gs-$(rustc -vV | grep host | cut -d' ' -f2)
```

## Naming Convention

The binary names follow Rust's target triple format:
- `gs-{arch}-{vendor}-{os}-{abi}`

Examples:
- `gs-x86_64-pc-windows-msvc` (Windows 64-bit)
- `gs-x86_64-apple-darwin` (macOS Intel)
- `gs-aarch64-apple-darwin` (macOS ARM64)
- `gs-x86_64-unknown-linux-gnu` (Linux)

## File Size Expectations

- **Full Ghostscript**: 25-35 MB
- **Minimal build**: 15-20 MB
- **With compression**: 8-12 MB

## Testing Binaries

After adding binaries, test them:

```bash
# Windows
./binaries/gs-x86_64-pc-windows-msvc.exe --version

# macOS/Linux
./binaries/gs-x86_64-apple-darwin --version
chmod +x ./binaries/gs-x86_64-apple-darwin
```

## Important Notes

1. **Permissions**: macOS/Linux binaries need execute permissions (`chmod +x`)
2. **Code Signing**: macOS binaries should be signed to avoid Gatekeeper issues
3. **Dependencies**: Ensure all required DLLs (Windows) are included
4. **License**: Ghostscript is AGPL licensed - ensure compliance

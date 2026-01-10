use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    // Run Tauri build
    tauri_build::build();

    // Get the target platform
    let target = env::var("TARGET").unwrap();
    let out_dir = env::var("OUT_DIR").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:warning=Building for target: {}", target);

    // Create binaries directory if it doesn't exist
    let binaries_dir = PathBuf::from(&manifest_dir).join("binaries");
    if !binaries_dir.exists() {
        fs::create_dir_all(&binaries_dir).unwrap();
    }

    // Determine binary name based on platform
    let (binary_name, download_needed) = if target.contains("windows") {
        ("gs-x86_64-pc-windows-msvc.exe", true)
    } else if target.contains("darwin") {
        if target.contains("aarch64") {
            ("gs-aarch64-apple-darwin", true)
        } else {
            ("gs-x86_64-apple-darwin", true)
        }
    } else if target.contains("linux") {
        ("gs-x86_64-unknown-linux-gnu", true)
    } else {
        println!("cargo:warning=Unknown target platform: {}", target);
        ("gs", false)
    };

    let binary_path = binaries_dir.join(binary_name);

    // Check if binary already exists
    if binary_path.exists() {
        println!("cargo:warning=Ghostscript binary already exists at {:?}", binary_path);
        return;
    }

    if !download_needed {
        return;
    }

    // Create a README file explaining how to add Ghostscript
    let readme_path = binaries_dir.join("DOWNLOAD_GHOSTSCRIPT.txt");
    let readme_content = format!(
        r#"========================================
GHOSTSCRIPT BINARY REQUIRED
========================================

The Ghostscript binary is missing for your platform: {}

To add Ghostscript:

OPTION 1: Download pre-compiled binary
---------------------------------------
Windows:
  1. Download from: https://github.com/ArtifexSoftware/ghostpdl-downloads/releases
  2. Install Ghostscript
  3. Copy from: C:\Program Files\gs\gs10.XX.X\bin\gswin64c.exe
  4. To: {}
  5. Run build again

macOS:
  1. Install via Homebrew: brew install ghostscript
  2. Copy binary: cp $(which gs) {}
  3. Make executable: chmod +x {}
  4. Run build again

Linux:
  1. Install: sudo apt install ghostscript  (or sudo dnf install ghostscript)
  2. Copy binary: cp $(which gs) {}
  3. Make executable: chmod +x {}
  4. Run build again

OPTION 2: Use system Ghostscript (development only)
----------------------------------------------------
For development, you can create a symlink to system Ghostscript:

macOS/Linux:
  ln -s $(which gs) {}

Windows (Admin PowerShell):
  cmd /c mklink {} "C:\Program Files\gs\gs10.XX.X\bin\gswin64c.exe"

OPTION 3: Download portable version
------------------------------------
Visit: https://www.ghostscript.com/releases/gsdnld.html

The build will continue, but the application WILL NOT WORK
without Ghostscript binary!

========================================
"#,
        target,
        binary_path.display(),
        binary_path.display(),
        binary_path.display(),
        binary_path.display(),
        binary_path.display(),
        binary_path.display(),
        binary_path.display()
    );

    fs::write(&readme_path, readme_content).unwrap();

    println!("cargo:warning=");
    println!("cargo:warning=╔════════════════════════════════════════════════════════════╗");
    println!("cargo:warning=║  GHOSTSCRIPT BINARY MISSING                                ║");
    println!("cargo:warning=╟────────────────────────────────────────────────────────────╢");
    println!("cargo:warning=║  Required: {}  ║", binary_name);
    println!("cargo:warning=║                                                            ║");
    println!("cargo:warning=║  See: src-tauri/binaries/DOWNLOAD_GHOSTSCRIPT.txt          ║");
    println!("cargo:warning=║                                                            ║");
    println!("cargo:warning=║  Quick install:                                            ║");
    if target.contains("darwin") {
        println!("cargo:warning=║    brew install ghostscript                                ║");
        println!("cargo:warning=║    cp $(which gs) src-tauri/binaries/{}  ║", binary_name);
    } else if target.contains("linux") {
        println!("cargo:warning=║    sudo apt install ghostscript                            ║");
        println!("cargo:warning=║    cp $(which gs) src-tauri/binaries/{}  ║", binary_name);
    } else if target.contains("windows") {
        println!("cargo:warning=║    Download from ghostscript.com/releases                  ║");
        println!("cargo:warning=║    Copy gswin64c.exe to src-tauri/binaries/                ║");
    }
    println!("cargo:warning=║                                                            ║");
    println!("cargo:warning=║  Build continues, but app won't work without binary!       ║");
    println!("cargo:warning=╚════════════════════════════════════════════════════════════╝");
    println!("cargo:warning=");
}

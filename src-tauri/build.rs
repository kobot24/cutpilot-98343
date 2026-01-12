use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn main() {
    // Run Tauri build
    tauri_build::build();

    let target = env::var("TARGET").unwrap();
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let profile = env::var("PROFILE").unwrap(); // "debug" or "release"

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:warning=Building for target: {}", target);

    // Create binaries directory if it doesn't exist
    let binaries_dir = PathBuf::from(&manifest_dir).join("binaries");
    if !binaries_dir.exists() {
        fs::create_dir_all(&binaries_dir).unwrap();
    }

    // Determine binary name based on platform
    let binary_name = get_binary_name(&target);
    let binary_path = binaries_dir.join(&binary_name);

    // Check if binary already exists (committed to repo or from previous build)
    if binary_path.exists() {
        println!(
            "cargo:warning=✓ Ghostscript binary found: {}",
            binary_name
        );
        return;
    }

    println!("cargo:warning=");
    println!("cargo:warning=╔═══════════════════════════════════════════════════════════╗");
    println!("cargo:warning=║  GHOSTSCRIPT BINARY NOT FOUND - AUTO-SETUP STARTING...   ║");
    println!("cargo:warning=╚═══════════════════════════════════════════════════════════╝");
    println!("cargo:warning=");

    // Try to find and copy from system
    if let Some(system_gs) = find_system_ghostscript() {
        if copy_system_ghostscript(&system_gs, &binary_path) {
            println!("cargo:warning=✓ Successfully copied Ghostscript from system!");
            println!("cargo:warning=  From: {}", system_gs.display());
            println!("cargo:warning=  To:   {}", binary_path.display());
            println!("cargo:warning=");
            return;
        }
    }

    // Warn if binary is still missing (but don't panic - let it fail at runtime if needed)
    println!("cargo:warning=");
    println!("cargo:warning=╔═══════════════════════════════════════════════════════════╗");
    println!("cargo:warning=║  ⚠ WARNING: GHOSTSCRIPT BINARY NOT FOUND                ║");
    println!("cargo:warning=╚═══════════════════════════════════════════════════════════╝");
    println!("cargo:warning=");
    println!("cargo:warning=Build will continue, but CMYK conversion won't work!");
    println!("cargo:warning=");
    println!("cargo:warning=To fix:");
    print_install_instructions(&target);
    println!("cargo:warning=Then rebuild: cargo build");
    println!("cargo:warning=");
}

fn get_binary_name(target: &str) -> String {
    if target.contains("windows") {
        "gs-x86_64-pc-windows-msvc.exe".to_string()
    } else if target.contains("darwin") {
        if target.contains("aarch64") {
            "gs-aarch64-apple-darwin".to_string()
        } else {
            "gs-x86_64-apple-darwin".to_string()
        }
    } else if target.contains("linux") {
        "gs-x86_64-unknown-linux-gnu".to_string()
    } else {
        "gs".to_string()
    }
}

fn find_system_ghostscript() -> Option<PathBuf> {
    // Try 'which gs' / 'where gs' command
    let result = if cfg!(windows) {
        Command::new("where").arg("gswin64c").output()
    } else {
        Command::new("which").arg("gs").output()
    };

    if let Ok(output) = result {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout);
            let path = path_str.trim().lines().next()?;
            let gs_path = PathBuf::from(path);
            if gs_path.exists() {
                return Some(gs_path);
            }
        }
    }

    // Try common installation paths
    if cfg!(windows) {
        let common_paths = vec![
            r"C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe",
            r"C:\Program Files\gs\gs10.03.0\bin\gswin64c.exe",
            r"C:\Program Files\gs\gs10.02.1\bin\gswin64c.exe",
            r"C:\Program Files (x86)\gs\gs10.03.1\bin\gswin64c.exe",
        ];
        for path_str in common_paths {
            let path = PathBuf::from(path_str);
            if path.exists() {
                return Some(path);
            }
        }
    } else {
        let common_paths = vec![
            "/usr/bin/gs",
            "/usr/local/bin/gs",
            "/opt/homebrew/bin/gs",
            "/opt/local/bin/gs",
        ];
        for path_str in common_paths {
            let path = PathBuf::from(path_str);
            if path.exists() {
                return Some(path);
            }
        }
    }

    None
}

fn copy_system_ghostscript(source: &Path, dest: &Path) -> bool {
    match fs::copy(source, dest) {
        Ok(_) => {
            // Make executable on Unix
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                if let Ok(metadata) = fs::metadata(dest) {
                    let mut perms = metadata.permissions();
                    perms.set_mode(0o755);
                    let _ = fs::set_permissions(dest, perms);
                }
            }
            true
        }
        Err(e) => {
            println!("cargo:warning=✗ Failed to copy: {}", e);
            false
        }
    }
}

fn print_install_instructions(target: &str) {
    if target.contains("darwin") {
        println!("cargo:warning=   macOS:  brew install ghostscript");
    } else if target.contains("linux") {
        println!("cargo:warning=   Ubuntu: sudo apt install ghostscript");
        println!("cargo:warning=   Fedora: sudo dnf install ghostscript");
    } else if target.contains("windows") {
        println!("cargo:warning=   Windows:");
        println!("cargo:warning=   1. Download: https://ghostscript.com/releases/gsdnld.html");
        println!("cargo:warning=   2. Install Ghostscript");
    }
}

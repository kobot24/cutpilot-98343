/**
 * CMYK Converter Module
 *
 * Converts PDF files to CMYK color space using Ghostscript.
 * This module provides true CMYK conversion with ICC profile support.
 *
 * Requirements:
 * - Ghostscript must be bundled with the app or installed on system
 * - ICC profiles must be accessible on filesystem
 */

use std::process::Command;
use std::path::{Path, PathBuf};
use tauri::api::path::{resource_dir, BaseDirectory};

#[derive(Debug, serde::Serialize)]
pub struct ConversionResult {
    success: bool,
    output_path: String,
    message: String,
}

/**
 * Convert PDF to CMYK using Ghostscript
 *
 * @param input_pdf - Path to input RGB PDF
 * @param output_pdf - Path where CMYK PDF should be saved
 * @param icc_profile - Optional path to ICC profile
 * @returns ConversionResult with status and output path
 */
#[tauri::command]
pub async fn convert_pdf_to_cmyk(
    input_pdf: String,
    output_pdf: String,
    icc_profile: Option<String>,
) -> Result<ConversionResult, String> {
    println!("[convert_pdf_to_cmyk] Starting CMYK conversion");
    println!("[convert_pdf_to_cmyk] Input: {}", input_pdf);
    println!("[convert_pdf_to_cmyk] Output: {}", output_pdf);

    // Validate input file exists
    let input_path = Path::new(&input_pdf);
    if !input_path.exists() {
        return Err(format!("Input PDF not found: {}", input_pdf));
    }

    // Get Ghostscript executable path
    let gs_path = match get_ghostscript_path() {
        Ok(path) => {
            println!("[convert_pdf_to_cmyk] Ghostscript found: {:?}", path);
            path
        },
        Err(e) => {
            println!("[convert_pdf_to_cmyk] ERROR: {}", e);
            return Err(format!("Ghostscript nicht gefunden: {}. Bitte Ghostscript installieren: https://ghostscript.com", e));
        }
    };

    // Build Ghostscript command
    let mut cmd = Command::new(&gs_path);

    // Basic Ghostscript arguments for CMYK conversion
    cmd.arg("-dNOPAUSE")                          // No pause after each page
        .arg("-dBATCH")                           // Exit after processing
        .arg("-dSAFER")                           // Safer execution mode
        .arg("-sDEVICE=pdfwrite")                 // Output device: PDF
        .arg("-sColorConversionStrategy=CMYK")    // Convert all colors to CMYK
        .arg("-dProcessColorModel=/DeviceCMYK")   // Process in CMYK mode
        .arg("-dPDFSETTINGS=/prepress")          // High-quality prepress settings
        .arg("-dAutoRotatePages=/None")          // Don't auto-rotate
        .arg("-dCompatibilityLevel=1.4");        // PDF 1.4 compatibility

    // Add ICC profile if provided
    if let Some(icc_path) = icc_profile {
        println!("[convert_pdf_to_cmyk] Using ICC profile: {}", icc_path);

        // Validate ICC profile exists
        if !Path::new(&icc_path).exists() {
            return Err(format!("ICC-Profil nicht gefunden: {}", icc_path));
        }

        cmd.arg(format!("-sOutputICCProfile={}", icc_path))
            .arg("-dOverrideICC=true");
    } else {
        println!("[convert_pdf_to_cmyk] No ICC profile specified, using default CMYK conversion");
    }

    // Set output file and input file
    cmd.arg(format!("-sOutputFile={}", output_pdf))
        .arg(&input_pdf);

    println!("[convert_pdf_to_cmyk] Executing: {:?}", cmd);

    // Execute Ghostscript
    let output = cmd.output()
        .map_err(|e| format!("Fehler beim Ausführen von Ghostscript: {}", e))?;

    // Check if conversion was successful
    if output.status.success() {
        println!("[convert_pdf_to_cmyk] SUCCESS! CMYK PDF created at: {}", output_pdf);

        Ok(ConversionResult {
            success: true,
            output_path: output_pdf.clone(),
            message: format!("PDF erfolgreich in CMYK konvertiert: {}", output_pdf),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!("[convert_pdf_to_cmyk] ERROR: {}", stderr);

        Err(format!("Ghostscript-Fehler: {}", stderr))
    }
}

/**
 * Get Ghostscript executable path
 *
 * Priority:
 * 1. Bundled Ghostscript (in app resources)
 * 2. System Ghostscript (installed globally)
 *
 * @returns PathBuf to Ghostscript executable
 */
fn get_ghostscript_path() -> Result<PathBuf, String> {
    // Try to find bundled Ghostscript first
    if let Some(resource_path) = find_bundled_ghostscript() {
        println!("[get_ghostscript_path] Using bundled Ghostscript: {:?}", resource_path);
        return Ok(resource_path);
    }

    // Fallback to system Ghostscript
    println!("[get_ghostscript_path] Trying system Ghostscript...");

    #[cfg(target_os = "macos")]
    let gs_name = "gs";

    #[cfg(target_os = "windows")]
    let gs_name = "gswin64c.exe";

    #[cfg(target_os = "linux")]
    let gs_name = "gs";

    // Check if system Ghostscript is available
    let test_output = Command::new(gs_name)
        .arg("--version")
        .output();

    match test_output {
        Ok(output) if output.status.success() => {
            let version = String::from_utf8_lossy(&output.stdout);
            println!("[get_ghostscript_path] System Ghostscript found: {}", version.trim());
            Ok(PathBuf::from(gs_name))
        },
        _ => {
            Err("Ghostscript nicht gefunden (weder gebündelt noch im System installiert)".to_string())
        }
    }
}

/**
 * Find bundled Ghostscript in app resources
 *
 * @returns Option<PathBuf> to bundled Ghostscript or None
 */
fn find_bundled_ghostscript() -> Option<PathBuf> {
    // Try to get resource directory (only works in built app)
    // In dev mode, this will fail - that's OK, we'll use system Ghostscript

    #[cfg(target_os = "macos")]
    let gs_relative_path = "ghostscript/gs";

    #[cfg(target_os = "windows")]
    let gs_relative_path = "ghostscript/gswin64c.exe";

    #[cfg(target_os = "linux")]
    let gs_relative_path = "ghostscript/gs";

    // Try to find in resource directory
    // Note: This is a placeholder - actual implementation depends on Tauri version
    // For now, we'll just check common locations

    let possible_paths = vec![
        PathBuf::from(format!("resources/{}", gs_relative_path)),
        PathBuf::from(format!("../resources/{}", gs_relative_path)),
        PathBuf::from(format!("../../resources/{}", gs_relative_path)),
    ];

    for path in possible_paths {
        if path.exists() {
            return Some(path);
        }
    }

    None
}

/**
 * Check if Ghostscript is available
 *
 * @returns true if Ghostscript is available (bundled or system)
 */
#[tauri::command]
pub fn check_ghostscript_available() -> Result<bool, String> {
    match get_ghostscript_path() {
        Ok(path) => {
            println!("[check_ghostscript_available] Ghostscript available at: {:?}", path);
            Ok(true)
        },
        Err(e) => {
            println!("[check_ghostscript_available] Ghostscript not available: {}", e);
            Ok(false)
        }
    }
}

/**
 * Get Ghostscript version
 *
 * @returns Ghostscript version string or error
 */
#[tauri::command]
pub fn get_ghostscript_version() -> Result<String, String> {
    let gs_path = get_ghostscript_path()
        .map_err(|e| format!("Ghostscript nicht gefunden: {}", e))?;

    let output = Command::new(&gs_path)
        .arg("--version")
        .output()
        .map_err(|e| format!("Fehler beim Abfragen der Ghostscript-Version: {}", e))?;

    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout);
        Ok(version.trim().to_string())
    } else {
        Err("Konnte Ghostscript-Version nicht ermitteln".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ghostscript_detection() {
        let result = get_ghostscript_path();
        println!("Ghostscript detection result: {:?}", result);
        // Note: This test will fail if Ghostscript is not installed
        // That's expected - it's just for manual testing
    }

    #[test]
    fn test_check_available() {
        let result = check_ghostscript_available();
        println!("Ghostscript available: {:?}", result);
    }
}

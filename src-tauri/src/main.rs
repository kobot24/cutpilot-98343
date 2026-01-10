// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::Command as StdCommand;
use tauri::Manager;
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};

#[derive(Debug, Serialize, Deserialize)]
struct ConversionOptions {
    input_path: String,
    output_path: String,
    icc_profile_name: Option<String>,
    preserve_spot_colors: bool,
    render_intent: i32, // 0=Perceptual, 1=RelativeColorimetric, 2=Saturation, 3=AbsoluteColorimetric
}

#[derive(Debug, Serialize)]
struct ConversionResult {
    success: bool,
    output_path: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

/// Converts PDF to CMYK color space using embedded Ghostscript binary
#[tauri::command]
async fn convert_to_cmyk(
    app_handle: tauri::AppHandle,
    options: ConversionOptions,
) -> Result<ConversionResult, String> {
    // Resolve path to bundled Ghostscript binary
    let gs_binary = app_handle
        .path_resolver()
        .resolve_resource("binaries/gs")
        .ok_or_else(|| "Ghostscript binary not found. Please ensure it's placed in src-tauri/binaries/".to_string())?;

    // Make binary executable on Unix systems
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&gs_binary)
            .map_err(|e| format!("Failed to get binary permissions: {}", e))?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&gs_binary, perms)
            .map_err(|e| format!("Failed to set executable permissions: {}", e))?;
    }

    // Resolve ICC profile path if specified
    let icc_path = if let Some(ref profile_name) = options.icc_profile_name {
        let path = app_handle
            .path_resolver()
            .resolve_resource(format!("resources/icc-profiles/{}", profile_name))
            .ok_or_else(|| format!("ICC profile '{}' not found in resources", profile_name))?;

        Some(path)
    } else {
        None
    };

    // Build Ghostscript command arguments
    let mut args = vec![
        "-dSAFER".to_string(),
        "-dBATCH".to_string(),
        "-dNOPAUSE".to_string(),
        "-sDEVICE=pdfwrite".to_string(),
        "-dPDFSETTINGS=/prepress".to_string(),
        "-sProcessColorModel=DeviceCMYK".to_string(),
        "-sColorConversionStrategy=CMYK".to_string(),
        "-sColorConversionStrategyForImages=CMYK".to_string(),
        "-dOverrideICC=true".to_string(),
    ];

    // Preserve spot colors (like CutContour) if requested
    if options.preserve_spot_colors {
        args.push("-dPreserveSeparation=true".to_string());
        args.push("-dPreserveDeviceN=true".to_string());
    }

    // Add ICC profile if provided
    if let Some(icc_path_buf) = icc_path {
        args.push(format!("-sOutputICCProfile={}", icc_path_buf.display()));
        args.push(format!("-dRenderIntent={}", options.render_intent));
    }

    // Add input and output paths
    args.push(format!("-sOutputFile={}", options.output_path));
    args.push(options.input_path.clone());

    // Execute Ghostscript command
    let output = StdCommand::new(&gs_binary)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute Ghostscript: {}", e))?;

    if output.status.success() {
        Ok(ConversionResult {
            success: true,
            output_path: options.output_path,
            message: "PDF successfully converted to CMYK".to_string(),
            error: None,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(ConversionResult {
            success: false,
            output_path: options.output_path,
            message: "Conversion failed".to_string(),
            error: Some(stderr.to_string()),
        })
    }
}

/// Lists available ICC profiles from bundled resources
#[tauri::command]
async fn list_icc_profiles(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let resources_dir = app_handle
        .path_resolver()
        .resolve_resource("resources/icc-profiles")
        .ok_or_else(|| "ICC profiles directory not found".to_string())?;

    let mut profiles = Vec::new();

    if let Ok(entries) = std::fs::read_dir(&resources_dir) {
        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.ends_with(".icc") || filename.ends_with(".icm") {
                    profiles.push(filename.to_string());
                }
            }
        }
    }

    profiles.sort();
    Ok(profiles)
}

/// Checks if a PDF contains spot colors by analyzing color spaces
#[tauri::command]
async fn check_spot_colors(pdf_path: String) -> Result<Vec<String>, String> {
    let doc = lopdf::Document::load(&pdf_path)
        .map_err(|e| format!("Failed to load PDF: {}", e))?;

    let mut spot_colors = Vec::new();

    // Iterate through all pages
    for page_id in doc.page_iter() {
        if let Ok(page) = doc.get_page(page_id) {
            // Check Resources dictionary for ColorSpace entries
            if let Ok(resources) = page.resources() {
                if let Ok(colorspaces) = resources.get(b"ColorSpace") {
                    if let Ok(cs_dict) = colorspaces.as_dict() {
                        for (name, _value) in cs_dict.iter() {
                            if let Ok(name_str) = String::from_utf8(name.to_vec()) {
                                // Spot colors are typically named (not DeviceCMYK, DeviceRGB, etc.)
                                if !name_str.starts_with("Device")
                                    && !name_str.starts_with("Indexed")
                                    && !name_str.starts_with("Pattern") {
                                    spot_colors.push(name_str);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    spot_colors.sort();
    spot_colors.dedup();
    Ok(spot_colors)
}

/// Gets ICC profile metadata
#[tauri::command]
async fn get_icc_profile_info(
    app_handle: tauri::AppHandle,
    profile_name: String,
) -> Result<serde_json::Value, String> {
    let icc_path = app_handle
        .path_resolver()
        .resolve_resource(format!("resources/icc-profiles/{}", profile_name))
        .ok_or_else(|| format!("ICC profile '{}' not found", profile_name))?;

    let data = std::fs::read(&icc_path)
        .map_err(|e| format!("Failed to read ICC profile: {}", e))?;

    // Basic ICC profile header parsing (first 128 bytes)
    if data.len() < 128 {
        return Err("Invalid ICC profile: too small".to_string());
    }

    // Extract basic info from ICC header
    let profile_size = u32::from_be_bytes([data[0], data[1], data[2], data[3]]);
    let color_space = String::from_utf8_lossy(&data[16..20]).to_string();
    let pcs = String::from_utf8_lossy(&data[20..24]).to_string();

    Ok(serde_json::json!({
        "filename": profile_name,
        "size": profile_size,
        "colorSpace": color_space.trim(),
        "pcs": pcs.trim(),
        "version": format!("{}.{}", data[8], data[9]),
    }))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            convert_to_cmyk,
            list_icc_profiles,
            check_spot_colors,
            get_icc_profile_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

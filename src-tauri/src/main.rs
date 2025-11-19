// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Import CMYK converter module
mod cmyk_converter;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      cmyk_converter::convert_pdf_to_cmyk,
      cmyk_converter::check_ghostscript_available,
      cmyk_converter::get_ghostscript_version,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

mod commands;
mod storage;

use tauri::Manager;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                let window = app.get_webview_window("main").unwrap();
                apply_vibrancy(
                    &window,
                    NSVisualEffectMaterial::UnderWindowBackground,
                    None,
                    None,
                )
                .expect("Failed to apply vibrancy");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::drawings::list_drawings,
            commands::drawings::save_drawing,
            commands::drawings::load_drawing,
            commands::drawings::delete_drawing,
            commands::drawings::rename_drawing,
            commands::drawings::archive_drawing,
            commands::drawings::unarchive_drawing,
            commands::drawings::toggle_star_drawing,
            commands::drawings::import_drawing,
            commands::drawings::import_into_drawing,
            commands::drawings::import_json_into_drawing,
            commands::drawings::restore_version,
            commands::versions::list_versions,
            commands::versions::load_version,
            commands::versions::create_version,
            commands::export::export_png,
            commands::export::export_svg,
            commands::export::export_excalidraw,
            commands::export::copy_png_to_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use std::path::PathBuf;
use tauri::Manager;

/// Returns the path to the drawings directory:
/// ~/Library/Application Support/com.sidpremkumar.betterdraw/drawings/
pub fn drawings_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(base.join("drawings"))
}

/// Returns the path to the metadata index file
pub fn index_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(drawings_dir(app)?.join("index.json"))
}

/// Ensures the drawings directory exists; creates it if not.
pub fn ensure_drawings_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = drawings_dir(app)?;
    if !dir.exists() {
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir)
}

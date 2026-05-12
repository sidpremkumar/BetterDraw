use crate::storage;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DrawingMetadata {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub file_name: String,
    #[serde(default)]
    pub archived: bool,
}

fn read_index(app: &AppHandle) -> Result<Vec<DrawingMetadata>, String> {
    let path = storage::index_path(app)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn write_index(app: &AppHandle, index: &[DrawingMetadata]) -> Result<(), String> {
    let path = storage::index_path(app)?;
    let data = serde_json::to_string_pretty(index).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_drawings(app: AppHandle) -> Result<Vec<DrawingMetadata>, String> {
    storage::ensure_drawings_dir(&app)?;
    read_index(&app)
}

#[tauri::command]
pub fn save_drawing(
    app: AppHandle,
    id: String,
    name: String,
    data: String,
) -> Result<DrawingMetadata, String> {
    let dir = storage::ensure_drawings_dir(&app)?;
    let file_name = format!("{}.excalidraw", &id);
    let file_path = dir.join(&file_name);

    fs::write(&file_path, &data).map_err(|e| e.to_string())?;

    let mut index = read_index(&app)?;
    let now = chrono::Utc::now().to_rfc3339();

    let meta = if let Some(existing) = index.iter_mut().find(|m| m.id == id) {
        existing.name = name;
        existing.updated_at = now;
        existing.clone()
    } else {
        let new_meta = DrawingMetadata {
            id,
            name,
            created_at: now.clone(),
            updated_at: now,
            file_name,
            archived: false,
        };
        index.push(new_meta.clone());
        new_meta
    };

    write_index(&app, &index)?;
    Ok(meta)
}

#[tauri::command]
pub fn load_drawing(app: AppHandle, id: String) -> Result<String, String> {
    let dir = storage::drawings_dir(&app)?;
    let file_path = dir.join(format!("{}.excalidraw", &id));
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_drawing(app: AppHandle, id: String) -> Result<(), String> {
    let dir = storage::drawings_dir(&app)?;
    let file_path = dir.join(format!("{}.excalidraw", &id));

    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }

    let mut index = read_index(&app)?;
    index.retain(|m| m.id != id);
    write_index(&app, &index)?;
    Ok(())
}

#[tauri::command]
pub fn rename_drawing(
    app: AppHandle,
    id: String,
    new_name: String,
) -> Result<DrawingMetadata, String> {
    let mut index = read_index(&app)?;
    let meta = index
        .iter_mut()
        .find(|m| m.id == id)
        .ok_or("Drawing not found")?;

    meta.name = new_name;
    meta.updated_at = chrono::Utc::now().to_rfc3339();
    let result = meta.clone();

    write_index(&app, &index)?;
    Ok(result)
}

#[tauri::command]
pub fn archive_drawing(app: AppHandle, id: String) -> Result<DrawingMetadata, String> {
    let mut index = read_index(&app)?;
    let meta = index
        .iter_mut()
        .find(|m| m.id == id)
        .ok_or("Drawing not found")?;

    meta.archived = true;
    meta.updated_at = chrono::Utc::now().to_rfc3339();
    let result = meta.clone();

    write_index(&app, &index)?;
    Ok(result)
}

#[tauri::command]
pub fn unarchive_drawing(app: AppHandle, id: String) -> Result<DrawingMetadata, String> {
    let mut index = read_index(&app)?;
    let meta = index
        .iter_mut()
        .find(|m| m.id == id)
        .ok_or("Drawing not found")?;

    meta.archived = false;
    meta.updated_at = chrono::Utc::now().to_rfc3339();
    let result = meta.clone();

    write_index(&app, &index)?;
    Ok(result)
}

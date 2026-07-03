use crate::commands::versions;
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
    #[serde(default)]
    pub starred: bool,
}

/// A drawing's metadata bundled with its full serialized content.
#[derive(Debug, Clone, Serialize)]
pub struct DrawingWithData {
    pub meta: DrawingMetadata,
    pub data: String,
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

    // Record a throttled version snapshot so edits can be reverted later.
    versions::snapshot(&app, &id, &data, "Edited", false)?;

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
            starred: false,
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

    versions::delete_all(&app, &id)?;

    let mut index = read_index(&app)?;
    index.retain(|m| m.id != id);
    write_index(&app, &index)?;
    Ok(())
}

/// Imports an external .excalidraw file at `path` as a new drawing.
#[tauri::command]
pub fn import_drawing(app: AppHandle, path: String) -> Result<DrawingWithData, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

    // Validate that this is an Excalidraw scene file.
    let parsed: serde_json::Value =
        serde_json::from_str(&content).map_err(|_| "File is not valid JSON".to_string())?;
    if parsed.get("type").and_then(|t| t.as_str()) != Some("excalidraw") {
        return Err("Not a valid .excalidraw file".to_string());
    }

    let name = std::path::Path::new(&path)
        .file_stem()
        .and_then(|s| s.to_str())
        .filter(|s| !s.trim().is_empty())
        .unwrap_or("Imported Drawing")
        .to_string();

    let dir = storage::ensure_drawings_dir(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    let file_name = format!("{}.excalidraw", &id);
    fs::write(dir.join(&file_name), &content).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();
    let meta = DrawingMetadata {
        id: id.clone(),
        name,
        created_at: now.clone(),
        updated_at: now,
        file_name,
        archived: false,
        starred: false,
    };

    let mut index = read_index(&app)?;
    index.push(meta.clone());
    write_index(&app, &index)?;

    // Seed the version history with the imported state.
    versions::snapshot(&app, &id, &content, "Imported", true)?;

    Ok(DrawingWithData { meta, data: content })
}

/// Validates that `content` is an Excalidraw scene and replaces an existing
/// drawing's content with it, snapshotting the current state first ("Before
/// import") so the import can be reverted.
fn override_drawing_content(
    app: &AppHandle,
    id: &str,
    content: &str,
) -> Result<DrawingWithData, String> {
    let parsed: serde_json::Value = serde_json::from_str(content)
        .map_err(|_| "Content is not valid JSON".to_string())?;
    if parsed.get("type").and_then(|t| t.as_str()) != Some("excalidraw") {
        return Err("Not a valid Excalidraw scene (expected \"type\": \"excalidraw\")".to_string());
    }

    let dir = storage::drawings_dir(app)?;
    let file_path = dir.join(format!("{}.excalidraw", id));

    if let Ok(current) = fs::read_to_string(&file_path) {
        versions::snapshot(app, id, &current, "Before import", true)?;
    }

    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    versions::snapshot(app, id, content, "Imported", true)?;

    let mut index = read_index(app)?;
    let meta = index
        .iter_mut()
        .find(|m| m.id == id)
        .ok_or("Drawing not found")?;
    meta.updated_at = chrono::Utc::now().to_rfc3339();
    let result = meta.clone();
    write_index(app, &index)?;

    Ok(DrawingWithData {
        meta: result,
        data: content.to_string(),
    })
}

/// Overrides the current drawing with an external .excalidraw file.
#[tauri::command]
pub fn import_into_drawing(
    app: AppHandle,
    id: String,
    path: String,
) -> Result<DrawingWithData, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    override_drawing_content(&app, &id, &content)
}

/// Overrides the current drawing with pasted Excalidraw JSON.
#[tauri::command]
pub fn import_json_into_drawing(
    app: AppHandle,
    id: String,
    content: String,
) -> Result<DrawingWithData, String> {
    override_drawing_content(&app, &id, &content)
}

/// Restores a prior version, snapshotting the current state first so the
/// restore itself can be undone.
#[tauri::command]
pub fn restore_version(
    app: AppHandle,
    id: String,
    version_id: String,
) -> Result<DrawingWithData, String> {
    let content = versions::read_version_content(&app, &id, &version_id)?;
    let dir = storage::drawings_dir(&app)?;
    let file_path = dir.join(format!("{}.excalidraw", &id));

    if let Ok(current) = fs::read_to_string(&file_path) {
        versions::snapshot(&app, &id, &current, "Before restore", true)?;
    }

    fs::write(&file_path, &content).map_err(|e| e.to_string())?;

    let mut index = read_index(&app)?;
    let meta = index
        .iter_mut()
        .find(|m| m.id == id)
        .ok_or("Drawing not found")?;
    meta.updated_at = chrono::Utc::now().to_rfc3339();
    let result = meta.clone();
    write_index(&app, &index)?;

    Ok(DrawingWithData {
        meta: result,
        data: content,
    })
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

#[tauri::command]
pub fn toggle_star_drawing(app: AppHandle, id: String) -> Result<DrawingMetadata, String> {
    let mut index = read_index(&app)?;
    let meta = index
        .iter_mut()
        .find(|m| m.id == id)
        .ok_or("Drawing not found")?;

    meta.starred = !meta.starred;
    let result = meta.clone();

    write_index(&app, &index)?;
    Ok(result)
}

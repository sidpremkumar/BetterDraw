use crate::storage;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

/// Maximum number of versions retained per drawing (oldest are pruned).
const MAX_VERSIONS: usize = 50;
/// Minimum seconds between automatic snapshots (throttles auto-save spam).
const SNAPSHOT_THROTTLE_SECS: i64 = 60;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionMeta {
    pub id: String,
    pub created_at: String,
    pub label: String,
    pub element_count: usize,
    pub size: u64,
}

fn versions_dir(app: &AppHandle, id: &str) -> Result<PathBuf, String> {
    Ok(storage::drawings_dir(app)?.join("versions").join(id))
}

fn manifest_path(app: &AppHandle, id: &str) -> Result<PathBuf, String> {
    Ok(versions_dir(app, id)?.join("manifest.json"))
}

fn read_manifest(app: &AppHandle, id: &str) -> Result<Vec<VersionMeta>, String> {
    let path = manifest_path(app, id)?;
    if !path.exists() {
        return Ok(vec![]);
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

fn write_manifest(app: &AppHandle, id: &str, manifest: &[VersionMeta]) -> Result<(), String> {
    let path = manifest_path(app, id)?;
    let data = serde_json::to_string_pretty(manifest).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

/// Counts non-deleted elements in an .excalidraw JSON string. Returns 0 on parse failure.
fn count_elements(content: &str) -> usize {
    serde_json::from_str::<serde_json::Value>(content)
        .ok()
        .and_then(|v| {
            v.get("elements").and_then(|e| e.as_array()).map(|arr| {
                arr.iter()
                    .filter(|el| el.get("isDeleted").and_then(|d| d.as_bool()) != Some(true))
                    .count()
            })
        })
        .unwrap_or(0)
}

/// Reads the raw content of a single stored version.
pub fn read_version_content(app: &AppHandle, id: &str, version_id: &str) -> Result<String, String> {
    let path = versions_dir(app, id)?.join(format!("{}.excalidraw", version_id));
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Appends a snapshot of `content` for drawing `id`.
///
/// When `force` is false the snapshot is throttled: it is skipped if the most
/// recent version was created less than `SNAPSHOT_THROTTLE_SECS` ago. In all
/// cases a snapshot identical to the latest one is skipped (dedup by content).
pub fn snapshot(
    app: &AppHandle,
    id: &str,
    content: &str,
    label: &str,
    force: bool,
) -> Result<(), String> {
    let dir = versions_dir(app, id)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut manifest = read_manifest(app, id)?;

    if let Some(last) = manifest.last() {
        // Dedup: never store two identical consecutive versions.
        if let Ok(last_content) = read_version_content(app, id, &last.id) {
            if last_content == content {
                return Ok(());
            }
        }
        // Throttle automatic snapshots.
        if !force {
            if let Ok(last_time) = chrono::DateTime::parse_from_rfc3339(&last.created_at) {
                let age = chrono::Utc::now()
                    .signed_duration_since(last_time.with_timezone(&chrono::Utc));
                if age.num_seconds() < SNAPSHOT_THROTTLE_SECS {
                    return Ok(());
                }
            }
        }
    }

    let version_id = uuid::Uuid::new_v4().to_string();
    let file_path = dir.join(format!("{}.excalidraw", version_id));
    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    manifest.push(VersionMeta {
        id: version_id,
        created_at: chrono::Utc::now().to_rfc3339(),
        label: label.to_string(),
        element_count: count_elements(content),
        size: content.len() as u64,
    });

    // Prune oldest versions beyond the cap.
    while manifest.len() > MAX_VERSIONS {
        let removed = manifest.remove(0);
        let _ = fs::remove_file(dir.join(format!("{}.excalidraw", removed.id)));
    }

    write_manifest(app, id, &manifest)
}

/// Removes all stored versions for a drawing (used when the drawing is deleted).
pub fn delete_all(app: &AppHandle, id: &str) -> Result<(), String> {
    let dir = versions_dir(app, id)?;
    if dir.exists() {
        fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_versions(app: AppHandle, id: String) -> Result<Vec<VersionMeta>, String> {
    let mut manifest = read_manifest(&app, &id)?;
    manifest.reverse(); // newest first for display
    Ok(manifest)
}

#[tauri::command]
pub fn load_version(app: AppHandle, id: String, version_id: String) -> Result<String, String> {
    read_version_content(&app, &id, &version_id)
}

/// Reads the current drawing file and stores it as a labelled version (forced).
#[tauri::command]
pub fn create_version(
    app: AppHandle,
    id: String,
    label: String,
) -> Result<Vec<VersionMeta>, String> {
    let file_path = storage::drawings_dir(&app)?.join(format!("{}.excalidraw", &id));
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let label = if label.trim().is_empty() {
        "Manual".to_string()
    } else {
        label
    };
    snapshot(&app, &id, &content, &label, true)?;
    list_versions(app, id)
}

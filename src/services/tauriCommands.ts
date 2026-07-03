import { invoke } from "@tauri-apps/api/core";
import type { DrawingMetadata, DrawingVersion, DrawingWithData } from "../types";

export async function listDrawings(): Promise<DrawingMetadata[]> {
  return invoke<DrawingMetadata[]>("list_drawings");
}

export async function saveDrawing(
  id: string,
  name: string,
  data: string
): Promise<DrawingMetadata> {
  return invoke<DrawingMetadata>("save_drawing", { id, name, data });
}

export async function loadDrawing(id: string): Promise<string> {
  return invoke<string>("load_drawing", { id });
}

export async function deleteDrawing(id: string): Promise<void> {
  return invoke("delete_drawing", { id });
}

export async function renameDrawing(
  id: string,
  newName: string
): Promise<DrawingMetadata> {
  return invoke<DrawingMetadata>("rename_drawing", { id, newName });
}

export async function archiveDrawing(id: string): Promise<DrawingMetadata> {
  return invoke<DrawingMetadata>("archive_drawing", { id });
}

export async function unarchiveDrawing(id: string): Promise<DrawingMetadata> {
  return invoke<DrawingMetadata>("unarchive_drawing", { id });
}

export async function toggleStarDrawing(id: string): Promise<DrawingMetadata> {
  return invoke<DrawingMetadata>("toggle_star_drawing", { id });
}

export async function importDrawing(path: string): Promise<DrawingWithData> {
  return invoke<DrawingWithData>("import_drawing", { path });
}

export async function importIntoDrawing(
  id: string,
  path: string
): Promise<DrawingWithData> {
  return invoke<DrawingWithData>("import_into_drawing", { id, path });
}

export async function importJsonIntoDrawing(
  id: string,
  content: string
): Promise<DrawingWithData> {
  return invoke<DrawingWithData>("import_json_into_drawing", { id, content });
}

export async function listVersions(id: string): Promise<DrawingVersion[]> {
  return invoke<DrawingVersion[]>("list_versions", { id });
}

export async function loadVersion(
  id: string,
  versionId: string
): Promise<string> {
  return invoke<string>("load_version", { id, versionId });
}

export async function restoreVersion(
  id: string,
  versionId: string
): Promise<DrawingWithData> {
  return invoke<DrawingWithData>("restore_version", { id, versionId });
}

export async function createVersion(
  id: string,
  label: string
): Promise<DrawingVersion[]> {
  return invoke<DrawingVersion[]>("create_version", { id, label });
}

export async function exportPng(path: string, data: number[]): Promise<void> {
  return invoke("export_png", { path, data });
}

export async function exportSvg(path: string, data: string): Promise<void> {
  return invoke("export_svg", { path, data });
}

export async function exportExcalidraw(
  path: string,
  data: string
): Promise<void> {
  return invoke("export_excalidraw", { path, data });
}

export async function copyPngToClipboard(data: number[]): Promise<void> {
  return invoke("copy_png_to_clipboard", { data });
}

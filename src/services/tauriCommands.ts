import { invoke } from "@tauri-apps/api/core";
import type { DrawingMetadata } from "../types";

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

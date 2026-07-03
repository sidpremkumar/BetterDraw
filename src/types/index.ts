export interface DrawingMetadata {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  archived: boolean;
  starred: boolean;
}

export interface DrawingVersion {
  id: string;
  created_at: string;
  label: string;
  element_count: number;
  size: number;
}

export interface DrawingWithData {
  meta: DrawingMetadata;
  data: string;
}

export interface DrawingData {
  type: "excalidraw";
  version: number;
  source: string;
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
}

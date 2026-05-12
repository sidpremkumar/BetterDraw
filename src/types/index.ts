export interface DrawingMetadata {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  archived: boolean;
}

export interface DrawingData {
  type: "excalidraw";
  version: number;
  source: string;
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
}

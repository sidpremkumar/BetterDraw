import { useMemo, useRef } from "react";
import { Excalidraw, serializeAsJSON } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./Canvas.css";

interface CanvasProps {
  drawingData: string | null;
  onApiReady: (api: any) => void;
  onAutoSave: (data: string) => void;
}

export function Canvas({ drawingData, onApiReady, onAutoSave }: CanvasProps) {
  const baselineFingerprintRef = useRef<string | null>(null);

  const initialData = useMemo(() => {
    if (!drawingData) return undefined;
    try {
      const parsed = JSON.parse(drawingData);
      return {
        elements: parsed.elements || [],
        appState: {
          ...(parsed.appState || {}),
          collaborators: new Map(),
        },
        files: parsed.files || {},
      };
    } catch {
      return undefined;
    }
  }, [drawingData]);

  const handleChange = (elements: any, appState: any, files: any) => {
    const fingerprint = elements
      .map((e: any) => `${e.id}:${e.version}`)
      .sort()
      .join(",");

    // Capture baseline on first onChange (Excalidraw initialization)
    if (baselineFingerprintRef.current === null) {
      baselineFingerprintRef.current = fingerprint;
      return;
    }

    // Skip if elements haven't actually changed
    if (fingerprint === baselineFingerprintRef.current) {
      return;
    }

    baselineFingerprintRef.current = fingerprint;
    const json = serializeAsJSON(elements, appState, files, "local");
    onAutoSave(json);
  };

  if (!drawingData) {
    return (
      <div className="canvas-empty">
        <div className="canvas-empty__content">
          <div className="canvas-empty__icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <p className="canvas-empty__text">
            Create or select a drawing to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="canvas-container">
      <Excalidraw
        initialData={initialData}
        excalidrawAPI={onApiReady}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: false,
            saveToActiveFile: false,
          },
        }}
      />
    </div>
  );
}

import { save } from "@tauri-apps/plugin-dialog";
import { exportToBlob, exportToSvg, serializeAsJSON } from "@excalidraw/excalidraw";
import * as cmds from "../../services/tauriCommands";
import "./Toolbar.css";

interface ToolbarProps {
  api: any;
  activeDrawingId: string | null;
  onScreenshot?: () => void;
}

export function Toolbar({ api, activeDrawingId, onScreenshot }: ToolbarProps) {
  if (!api || !activeDrawingId) return <div className="toolbar" />;

  const getSceneData = () => {
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();
    return { elements, appState, files };
  };

  const handleExportPng = async () => {
    const { elements, appState, files } = getSceneData();
    const filePath = await save({
      defaultPath: "drawing.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    if (!filePath) return;

    const blob = await exportToBlob({
      elements,
      appState: { ...appState, exportBackground: true, exportScale: 2 },
      files,
      mimeType: "image/png",
    });
    const arrayBuffer = await blob.arrayBuffer();
    const data = Array.from(new Uint8Array(arrayBuffer));
    await cmds.exportPng(filePath, data);
  };

  const handleExportSvg = async () => {
    const { elements, appState, files } = getSceneData();
    const filePath = await save({
      defaultPath: "drawing.svg",
      filters: [{ name: "SVG Image", extensions: ["svg"] }],
    });
    if (!filePath) return;

    const svgElement = await exportToSvg({
      elements,
      appState: { ...appState, exportBackground: true },
      files,
    });
    const svgString = new XMLSerializer().serializeToString(svgElement);
    await cmds.exportSvg(filePath, svgString);
  };

  const handleExportExcalidraw = async () => {
    const { elements, appState, files } = getSceneData();
    const filePath = await save({
      defaultPath: "drawing.excalidraw",
      filters: [{ name: "Excalidraw", extensions: ["excalidraw"] }],
    });
    if (!filePath) return;

    const json = serializeAsJSON(elements, appState, files, "local");
    await cmds.exportExcalidraw(filePath, json);
  };

  return (
    <div className="toolbar">
      <div className="toolbar__actions">
        <button className="toolbar__btn toolbar__btn--screenshot" onClick={onScreenshot} title="Screenshot region (copies to clipboard)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 2" />
            <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
          </svg>
          Screenshot
        </button>
        <div className="toolbar__separator" />
        <button className="toolbar__btn" onClick={handleExportPng} title="Export as PNG">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          PNG
        </button>
        <button className="toolbar__btn" onClick={handleExportSvg} title="Export as SVG">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          SVG
        </button>
        <button className="toolbar__btn" onClick={handleExportExcalidraw} title="Export as .excalidraw">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          .excalidraw
        </button>
      </div>
    </div>
  );
}

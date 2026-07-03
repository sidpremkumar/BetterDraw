import { useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { downloadDir } from "@tauri-apps/api/path";
import { save, open } from "@tauri-apps/plugin-dialog";
import { exportToBlob } from "@excalidraw/excalidraw";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Canvas } from "./components/Canvas/Canvas";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { HistoryPanel } from "./components/HistoryPanel/HistoryPanel";
import { ImportDialog } from "./components/ImportDialog/ImportDialog";
import { ScreenshotOverlay, type CaptureAction } from "./components/ScreenshotOverlay/ScreenshotOverlay";
import { useDrawings } from "./hooks/useDrawings";
import { useAutoSave } from "./hooks/useAutoSave";
import { useExcalidrawApi } from "./hooks/useExcalidrawApi";
import * as cmds from "./services/tauriCommands";
import "./App.css";

function App() {
  const {
    drawings,
    activeDrawingId,
    activeDrawingData,
    dataNonce,
    isLoading,
    selectDrawing,
    createDrawing,
    saveCurrentDrawing,
    deleteDrawingById,
    archiveDrawingById,
    unarchiveDrawingById,
    renameDrawingById,
    toggleStarById,
    importDrawingFile,
    importIntoActiveDrawing,
    importJsonIntoActiveDrawing,
    restoreVersionById,
  } = useDrawings();

  const { api, onApiReady } = useExcalidrawApi();
  const { scheduleAutoSave, flushSave } = useAutoSave(saveCurrentDrawing);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleScreenshotCapture = useCallback(
    async (rect: { x: number; y: number; width: number; height: number }, action: CaptureAction) => {
      setScreenshotMode(false);
      if (!api) return;
      try {
        const appState = api.getAppState();
        const elements = api.getSceneElements();
        const files = api.getFiles();

        // Convert screen selection (relative to .main-area) to Excalidraw scene coordinates
        const mainAreaEl = document.querySelector(".main-area");
        const canvasContainer = document.querySelector(".canvas-container");
        if (!mainAreaEl || !canvasContainer) return;

        const mainAreaRect = mainAreaEl.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();

        // Offset of canvas-container within main-area (toolbar height)
        const containerOffsetX = containerRect.left - mainAreaRect.left;
        const containerOffsetY = containerRect.top - mainAreaRect.top;

        // Selection in canvas-container CSS coordinates
        const selX = rect.x - containerOffsetX;
        const selY = rect.y - containerOffsetY;

        // Convert screen pixels to scene coordinates using Excalidraw's zoom & scroll
        const zoom = appState.zoom?.value ?? appState.zoom ?? 1;
        const scrollX = appState.scrollX || 0;
        const scrollY = appState.scrollY || 0;

        const sceneX1 = selX / zoom - scrollX;
        const sceneY1 = selY / zoom - scrollY;
        const sceneX2 = (selX + rect.width) / zoom - scrollX;
        const sceneY2 = (selY + rect.height) / zoom - scrollY;

        // Filter elements that overlap with the selection region
        const selectedElements = elements.filter((el: any) => {
          const elRight = el.x + el.width;
          const elBottom = el.y + el.height;
          return elRight > sceneX1 && el.x < sceneX2 && elBottom > sceneY1 && el.y < sceneY2;
        });

        if (selectedElements.length === 0) return;

        // Calculate export scale to ensure output is at least 2K
        const sceneWidth = sceneX2 - sceneX1;
        const sceneHeight = sceneY2 - sceneY1;
        const minOutputSize = 2560;
        const longestSide = Math.max(sceneWidth, sceneHeight);
        const exportScale = Math.max(2, minOutputSize / longestSide);

        // Use Excalidraw's vector renderer for crisp output
        const blob = await exportToBlob({
          elements: selectedElements,
          appState: {
            ...appState,
            exportBackground: true,
            viewBackgroundColor: "#ffffff",
            exportScale,
            exportPadding: 10,
          },
          files,
          mimeType: "image/png",
        });

        if (action === "clipboard") {
          const arrayBuffer = await blob.arrayBuffer();
          const data = Array.from(new Uint8Array(arrayBuffer));
          await cmds.copyPngToClipboard(data);
        } else {
          const activeDrawing = drawings.find((d) => d.id === activeDrawingId);
          const drawingName = (activeDrawing?.name || "screenshot").replace(/[^a-zA-Z0-9_-]/g, "_");
          const now = new Date();
          const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
          const defaultFileName = `${drawingName}-${timestamp}.png`;

          let defaultPath = defaultFileName;
          try {
            const dl = await downloadDir();
            defaultPath = `${dl}/${defaultFileName}`;
          } catch {}

          const filePath = await save({
            defaultPath,
            filters: [{ name: "PNG Image", extensions: ["png"] }],
          });
          if (!filePath) return;

          const arrayBuffer = await blob.arrayBuffer();
          const data = Array.from(new Uint8Array(arrayBuffer));
          await cmds.exportPng(filePath, data);
        }
      } catch (err) {
        console.error("Screenshot capture failed:", err);
      }
    },
    [api, drawings, activeDrawingId]
  );

  const handleSelectDrawing = async (id: string) => {
    await flushSave();
    selectDrawing(id);
  };

  const handleCreateDrawing = async (name?: string) => {
    await flushSave();
    createDrawing(name);
  };

  const handleImport = async () => {
    await flushSave();
    const selected = await open({
      multiple: false,
      filters: [{ name: "Excalidraw", extensions: ["excalidraw", "json"] }],
    });
    if (!selected || typeof selected !== "string") return;
    try {
      await importDrawingFile(selected);
    } catch (err) {
      console.error("Import failed:", err);
      alert(`Could not import file: ${err}`);
    }
  };

  const handleImportOverrideFile = async () => {
    if (!activeDrawingId) return;
    await flushSave();
    const selected = await open({
      multiple: false,
      filters: [{ name: "Excalidraw", extensions: ["excalidraw", "json"] }],
    });
    if (!selected || typeof selected !== "string") return;
    await importIntoActiveDrawing(selected);
  };

  const handleImportOverrideJson = async (content: string) => {
    if (!activeDrawingId) return;
    await flushSave();
    await importJsonIntoActiveDrawing(content);
  };

  const handleRestoreVersion = async (versionId: string) => {
    // Persist the live scene first so "Before restore" captures pending edits.
    await flushSave();
    await restoreVersionById(versionId);
  };

  const handleSaveVersion = async () => {
    await flushSave();
    if (!activeDrawingId) return [];
    return cmds.createVersion(activeDrawingId, "Manual");
  };

  const activeDrawing = drawings.find((d) => d.id === activeDrawingId);
  const currentElementCount = api
    ? api.getSceneElements().filter((e: any) => !e.isDeleted).length
    : 0;

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div
        className="titlebar"
        data-tauri-drag-region
        onMouseDown={() => getCurrentWindow().startDragging()}
      />
      <Sidebar
        drawings={drawings}
        activeDrawingId={activeDrawingId}
        onSelect={handleSelectDrawing}
        onCreate={handleCreateDrawing}
        onImport={handleImport}
        onDelete={deleteDrawingById}
        onArchive={archiveDrawingById}
        onUnarchive={unarchiveDrawingById}
        onRename={renameDrawingById}
        onToggleStar={toggleStarById}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="main-area">
        <Toolbar
          api={api}
          activeDrawingId={activeDrawingId}
          onScreenshot={() => setScreenshotMode(true)}
          onHistory={() => setHistoryOpen(true)}
          onImport={() => setImportOpen(true)}
        />
        <Canvas
          key={`${activeDrawingId}-${dataNonce}`}
          drawingData={activeDrawingData}
          onApiReady={onApiReady}
          onAutoSave={scheduleAutoSave}
        />
        {screenshotMode && (
          <ScreenshotOverlay
            onCapture={handleScreenshotCapture}
            onCancel={() => setScreenshotMode(false)}
          />
        )}
      </div>
      {importOpen && activeDrawingId && (
        <ImportDialog
          onImportJson={handleImportOverrideJson}
          onChooseFile={handleImportOverrideFile}
          onClose={() => setImportOpen(false)}
        />
      )}
      {historyOpen && activeDrawingId && (
        <HistoryPanel
          drawingId={activeDrawingId}
          drawingName={activeDrawing?.name || "Untitled"}
          currentElementCount={currentElementCount}
          onRestore={handleRestoreVersion}
          onSaveVersion={handleSaveVersion}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}

export default App;

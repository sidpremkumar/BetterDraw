import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { DrawingMetadata } from "../types";
import * as cmds from "../services/tauriCommands";

export function useDrawings() {
  const [drawings, setDrawings] = useState<DrawingMetadata[]>([]);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const [activeDrawingData, setActiveDrawingData] = useState<string | null>(
    null
  );
  // Bumped whenever the active drawing's content is replaced in place (import /
  // restore) so the Canvas remounts even though activeDrawingId is unchanged.
  const [dataNonce, setDataNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const selectDrawing = useCallback(async (id: string) => {
    const data = await cmds.loadDrawing(id);
    setActiveDrawingId(id);
    setActiveDrawingData(data);
  }, []);

  useEffect(() => {
    cmds.listDrawings().then((list) => {
      setDrawings(list);
      const active = list.filter((d) => !d.archived);
      if (active.length > 0) {
        const sorted = [...active].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
        );
        selectDrawing(sorted[0].id);
      }
      setIsLoading(false);
    });
  }, [selectDrawing]);

  const createDrawing = useCallback(async (name?: string) => {
    const id = uuidv4();
    const drawingName = name || "Untitled Drawing";
    const emptyData = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "BetterDraw",
      elements: [],
      appState: { viewBackgroundColor: "transparent" },
      files: {},
    });
    const meta = await cmds.saveDrawing(id, drawingName, emptyData);
    setDrawings((prev) => [meta, ...prev]);
    setActiveDrawingId(id);
    setActiveDrawingData(emptyData);
    return meta;
  }, []);

  const saveCurrentDrawing = useCallback(
    async (data: string) => {
      if (!activeDrawingId) return;
      const current = drawings.find((d) => d.id === activeDrawingId);
      if (!current) return;
      const updated = await cmds.saveDrawing(
        activeDrawingId,
        current.name,
        data
      );
      setDrawings((prev) =>
        prev.map((d) => (d.id === activeDrawingId ? updated : d))
      );
    },
    [activeDrawingId, drawings]
  );

  const deleteDrawingById = useCallback(
    async (id: string) => {
      await cmds.deleteDrawing(id);
      setDrawings((prev) => prev.filter((d) => d.id !== id));
      if (activeDrawingId === id) {
        setActiveDrawingId(null);
        setActiveDrawingData(null);
      }
    },
    [activeDrawingId]
  );

  const archiveDrawingById = useCallback(
    async (id: string) => {
      const updated = await cmds.archiveDrawing(id);
      setDrawings((prev) => prev.map((d) => (d.id === id ? updated : d)));
      if (activeDrawingId === id) {
        // Switch to next active drawing
        const remaining = drawings.filter((d) => d.id !== id && !d.archived);
        if (remaining.length > 0) {
          const sorted = [...remaining].sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          );
          selectDrawing(sorted[0].id);
        } else {
          setActiveDrawingId(null);
          setActiveDrawingData(null);
        }
      }
    },
    [activeDrawingId, drawings, selectDrawing]
  );

  const unarchiveDrawingById = useCallback(
    async (id: string) => {
      const updated = await cmds.unarchiveDrawing(id);
      setDrawings((prev) => prev.map((d) => (d.id === id ? updated : d)));
    },
    []
  );

  const renameDrawingById = useCallback(
    async (id: string, newName: string) => {
      const updated = await cmds.renameDrawing(id, newName);
      setDrawings((prev) => prev.map((d) => (d.id === id ? updated : d)));
    },
    []
  );

  const toggleStarById = useCallback(async (id: string) => {
    const updated = await cmds.toggleStarDrawing(id);
    setDrawings((prev) => prev.map((d) => (d.id === id ? updated : d)));
  }, []);

  const importDrawingFile = useCallback(async (path: string) => {
    const { meta, data } = await cmds.importDrawing(path);
    setDrawings((prev) => [meta, ...prev]);
    setActiveDrawingId(meta.id);
    setActiveDrawingData(data);
    setDataNonce((n) => n + 1);
    return meta;
  }, []);

  const importIntoActiveDrawing = useCallback(
    async (path: string) => {
      if (!activeDrawingId) return;
      const { meta, data } = await cmds.importIntoDrawing(activeDrawingId, path);
      setDrawings((prev) => prev.map((d) => (d.id === meta.id ? meta : d)));
      setActiveDrawingData(data);
      setDataNonce((n) => n + 1);
    },
    [activeDrawingId]
  );

  const importJsonIntoActiveDrawing = useCallback(
    async (content: string) => {
      if (!activeDrawingId) return;
      const { meta, data } = await cmds.importJsonIntoDrawing(
        activeDrawingId,
        content
      );
      setDrawings((prev) => prev.map((d) => (d.id === meta.id ? meta : d)));
      setActiveDrawingData(data);
      setDataNonce((n) => n + 1);
    },
    [activeDrawingId]
  );

  const restoreVersionById = useCallback(
    async (versionId: string) => {
      if (!activeDrawingId) return;
      const { meta, data } = await cmds.restoreVersion(
        activeDrawingId,
        versionId
      );
      setDrawings((prev) => prev.map((d) => (d.id === meta.id ? meta : d)));
      setActiveDrawingData(data);
      setDataNonce((n) => n + 1);
    },
    [activeDrawingId]
  );

  return {
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
  };
}

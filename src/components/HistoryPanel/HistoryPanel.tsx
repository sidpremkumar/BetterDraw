import { useEffect, useState, useCallback } from "react";
import type { DrawingVersion } from "../../types";
import * as cmds from "../../services/tauriCommands";
import "./HistoryPanel.css";

interface HistoryPanelProps {
  drawingId: string;
  drawingName: string;
  /** Live element count of the current scene, for computing the diff badge. */
  currentElementCount: number;
  onRestore: (versionId: string) => Promise<void>;
  /** Flushes pending edits to disk, then snapshots the current scene. */
  onSaveVersion: () => Promise<DrawingVersion[]>;
  onClose: () => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  let relative: string;
  if (minutes < 1) relative = "just now";
  else if (minutes < 60) relative = `${minutes}m ago`;
  else if (minutes < 1440) relative = `${Math.floor(minutes / 60)}h ago`;
  else relative = `${Math.floor(minutes / 1440)}d ago`;

  const absolute = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${relative} · ${absolute}`;
}

function DiffBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="history-badge history-badge--same">no change</span>;
  }
  const positive = delta > 0;
  return (
    <span
      className={`history-badge ${positive ? "history-badge--add" : "history-badge--remove"}`}
      title="Difference in element count vs. the current drawing"
    >
      {positive ? `+${delta}` : delta} vs now
    </span>
  );
}

export function HistoryPanel({
  drawingId,
  drawingName,
  currentElementCount,
  onRestore,
  onSaveVersion,
  onClose,
}: HistoryPanelProps) {
  const [versions, setVersions] = useState<DrawingVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await cmds.listVersions(drawingId);
      setVersions(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [drawingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleRestore = async (versionId: string) => {
    setBusyId(versionId);
    setError(null);
    try {
      await onRestore(versionId);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveVersion = async () => {
    setBusyId("__save__");
    setError(null);
    try {
      const list = await onSaveVersion();
      setVersions(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-panel__header">
          <div>
            <h2 className="history-panel__title">Version History</h2>
            <p className="history-panel__subtitle">{drawingName}</p>
          </div>
          <button
            className="history-panel__close"
            onClick={onClose}
            aria-label="Close history"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="history-panel__toolbar">
          <button
            className="history-panel__save-btn"
            onClick={handleSaveVersion}
            disabled={busyId !== null}
          >
            {busyId === "__save__" ? "Saving…" : "Save current as version"}
          </button>
          <span className="history-panel__count">
            {versions.length} version{versions.length === 1 ? "" : "s"}
          </span>
        </div>

        {error && <div className="history-panel__error">{error}</div>}

        <div className="history-panel__list">
          {isLoading ? (
            <div className="history-panel__empty">Loading…</div>
          ) : versions.length === 0 ? (
            <div className="history-panel__empty">
              No versions yet. Versions are captured automatically as you edit.
            </div>
          ) : (
            versions.map((v, i) => (
              <div key={v.id} className="history-item">
                <div className="history-item__main">
                  <div className="history-item__top">
                    <span className="history-item__label">{v.label}</span>
                    {i === 0 && (
                      <span className="history-badge history-badge--latest">
                        latest
                      </span>
                    )}
                    <DiffBadge delta={v.element_count - currentElementCount} />
                  </div>
                  <div className="history-item__meta">
                    {formatTimestamp(v.created_at)} · {v.element_count} element
                    {v.element_count === 1 ? "" : "s"}
                  </div>
                </div>
                <button
                  className="history-item__restore"
                  onClick={() => handleRestore(v.id)}
                  disabled={busyId !== null}
                >
                  {busyId === v.id ? "Restoring…" : "Restore"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { DrawingItem } from "./DrawingItem";
import type { DrawingMetadata } from "../../types";
import "./Sidebar.css";

interface SidebarProps {
  drawings: DrawingMetadata[];
  activeDrawingId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name?: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  drawings,
  activeDrawingId,
  onSelect,
  onCreate,
  onDelete,
  onArchive,
  onUnarchive,
  onRename,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [archiveOpen, setArchiveOpen] = useState(false);

  const activeDrawings = drawings
    .filter((d) => !d.archived)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  const archivedDrawings = drawings
    .filter((d) => d.archived)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <button
          className="sidebar__toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>
      {!collapsed && (
        <>
          <button className="sidebar__new-btn" onClick={() => onCreate()}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Drawing
          </button>
          <div className="sidebar__list">
            {activeDrawings.map((drawing) => (
              <DrawingItem
                key={drawing.id}
                drawing={drawing}
                isActive={drawing.id === activeDrawingId}
                onSelect={() => onSelect(drawing.id)}
                onArchive={() => onArchive(drawing.id)}
                onRename={(name) => onRename(drawing.id, name)}
              />
            ))}
            {activeDrawings.length === 0 && (
              <div className="sidebar__empty">
                <p>No drawings yet</p>
              </div>
            )}
          </div>

          {archivedDrawings.length > 0 && (
            <div className="sidebar__archive-section">
              <button
                className="sidebar__archive-toggle"
                onClick={() => setArchiveOpen(!archiveOpen)}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`sidebar__archive-chevron ${archiveOpen ? "sidebar__archive-chevron--open" : ""}`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <span>Archived</span>
                <span className="sidebar__archive-count">
                  {archivedDrawings.length}
                </span>
              </button>
              {archiveOpen && (
                <div className="sidebar__archive-list">
                  {archivedDrawings.map((drawing) => (
                    <DrawingItem
                      key={drawing.id}
                      drawing={drawing}
                      isActive={drawing.id === activeDrawingId}
                      onSelect={() => onSelect(drawing.id)}
                      onUnarchive={() => onUnarchive(drawing.id)}
                      onDelete={() => onDelete(drawing.id)}
                      onRename={(name) => onRename(drawing.id, name)}
                      isArchived
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  );
}

import { useState } from "react";
import { DrawingItem } from "./DrawingItem";
import type { DrawingMetadata } from "../../types";
import "./Sidebar.css";

interface SidebarProps {
  drawings: DrawingMetadata[];
  activeDrawingId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name?: string) => void;
  onImport: () => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onToggleStar: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function sortByUpdatedDesc(a: DrawingMetadata, b: DrawingMetadata) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

export function Sidebar({
  drawings,
  activeDrawingId,
  onSelect,
  onCreate,
  onImport,
  onDelete,
  onArchive,
  onUnarchive,
  onRename,
  onToggleStar,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [starredOpen, setStarredOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;
  const matchesQuery = (d: DrawingMetadata) =>
    !isSearching || d.name.toLowerCase().includes(trimmedQuery);

  const starredDrawings = drawings
    .filter((d) => d.starred && !d.archived && matchesQuery(d))
    .sort(sortByUpdatedDesc);

  const activeDrawings = drawings
    .filter((d) => !d.starred && !d.archived && matchesQuery(d))
    .sort(sortByUpdatedDesc);

  const archivedDrawings = drawings
    .filter((d) => d.archived && matchesQuery(d))
    .sort(sortByUpdatedDesc);

  const archivedTotal = drawings.filter((d) => d.archived).length;
  const noResults =
    isSearching &&
    starredDrawings.length === 0 &&
    activeDrawings.length === 0 &&
    archivedDrawings.length === 0;

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
          <div className="sidebar__search">
            <svg
              className="sidebar__search-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="sidebar__search-input"
              placeholder="Search drawings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="sidebar__search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg
                  width="12"
                  height="12"
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
            )}
          </div>

          <div className="sidebar__actions">
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
            <button
              className="sidebar__import-btn"
              onClick={onImport}
              title="Import a .excalidraw file"
            >
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
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
            </button>
          </div>

          {starredDrawings.length > 0 && (
            <div className="sidebar__starred-section">
              <button
                className="sidebar__section-toggle"
                onClick={() => setStarredOpen(!starredOpen)}
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
                  className={`sidebar__section-chevron ${starredOpen ? "sidebar__section-chevron--open" : ""}`}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <span>Starred</span>
                <span className="sidebar__section-count">
                  {starredDrawings.length}
                </span>
              </button>
              {starredOpen && (
                <div className="sidebar__section-list">
                  {starredDrawings.map((drawing) => (
                    <DrawingItem
                      key={drawing.id}
                      drawing={drawing}
                      isActive={drawing.id === activeDrawingId}
                      onSelect={() => onSelect(drawing.id)}
                      onArchive={() => onArchive(drawing.id)}
                      onRename={(name) => onRename(drawing.id, name)}
                      onToggleStar={() => onToggleStar(drawing.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="sidebar__list">
            {activeDrawings.map((drawing) => (
              <DrawingItem
                key={drawing.id}
                drawing={drawing}
                isActive={drawing.id === activeDrawingId}
                onSelect={() => onSelect(drawing.id)}
                onArchive={() => onArchive(drawing.id)}
                onRename={(name) => onRename(drawing.id, name)}
                onToggleStar={() => onToggleStar(drawing.id)}
              />
            ))}
            {activeDrawings.length === 0 &&
              starredDrawings.length === 0 &&
              !isSearching && (
                <div className="sidebar__empty">
                  <p>No drawings yet</p>
                </div>
              )}
          </div>

          {noResults && (
            <div className="sidebar__search-empty">
              <p>No drawings match "{searchQuery}"</p>
            </div>
          )}

          {archivedTotal > 0 && (
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
                  {isSearching
                    ? `${archivedDrawings.length}/${archivedTotal}`
                    : archivedTotal}
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
                      onToggleStar={() => onToggleStar(drawing.id)}
                      isArchived
                    />
                  ))}
                  {isSearching && archivedDrawings.length === 0 && (
                    <div className="sidebar__archive-empty">
                      <p>No archived matches</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  );
}

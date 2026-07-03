import { useState, useRef } from "react";
import type { DrawingMetadata } from "../../types";
import "./DrawingItem.css";

interface DrawingItemProps {
  drawing: DrawingMetadata;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
  isArchived?: boolean;
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DrawingItem({
  drawing,
  isActive,
  onSelect,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
  onToggleStar,
  isArchived,
}: DrawingItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(drawing.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(drawing.name);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleRenameSubmit = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== drawing.name) {
      onRename(editName.trim());
    }
  };

  const timeAgo = formatRelativeTime(drawing.updated_at);

  return (
    <div
      className={`drawing-item ${isActive ? "drawing-item--active" : ""} ${isArchived ? "drawing-item--archived" : ""} ${drawing.starred ? "drawing-item--starred" : ""}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="drawing-item__input"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setIsEditing(false);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="drawing-item__name">{drawing.name}</span>
          <span className="drawing-item__time">{timeAgo}</span>
          <div className="drawing-item__actions">
            {onToggleStar && (
              <button
                className="drawing-item__action-btn drawing-item__star"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar();
                }}
                aria-label={drawing.starred ? "Unstar drawing" : "Star drawing"}
                aria-pressed={drawing.starred}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill={drawing.starred ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )}
            <button
              className="drawing-item__action-btn drawing-item__rename"
              onClick={(e) => {
                e.stopPropagation();
                handleDoubleClick();
              }}
              aria-label="Rename drawing"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </button>
            {isArchived ? (
              <>
                {onUnarchive && (
                  <button
                    className="drawing-item__action-btn drawing-item__unarchive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnarchive();
                    }}
                    aria-label="Unarchive drawing"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    className="drawing-item__action-btn drawing-item__delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    aria-label="Delete drawing permanently"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              onArchive && (
                <button
                  className="drawing-item__action-btn drawing-item__archive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  aria-label="Archive drawing"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
                  </svg>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

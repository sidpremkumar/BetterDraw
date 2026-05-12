import { useState, useCallback, useRef } from "react";
import "./ScreenshotOverlay.css";

export type CaptureAction = "save" | "clipboard";

interface ScreenshotOverlayProps {
  onCapture: (rect: { x: number; y: number; width: number; height: number }, action: CaptureAction) => void;
  onCancel: () => void;
}

export function ScreenshotOverlay({ onCapture, onCancel }: ScreenshotOverlayProps) {
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [end, setEnd] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const getRect = () => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    return { x, y, width, height };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If we already have a selection and user clicks outside the action buttons, reset
    if (selection) {
      setSelection(null);
    }
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStart({ x, y });
    setEnd({ x, y });
    setDragging(true);
  }, [selection]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;
      setEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [dragging]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const rect = getRect();
    if (rect.width < 10 || rect.height < 10) return;
    setSelection(rect);
  }, [dragging, start, end]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel]
  );

  const handleAction = (action: CaptureAction) => {
    if (selection) onCapture(selection, action);
  };

  const activeRect = dragging ? getRect() : selection;

  return (
    <div
      ref={overlayRef}
      className="screenshot-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
    >
      <div className="screenshot-overlay__hint">
        {selection ? "Choose an action" : "Drag to select area"} &middot; Esc to cancel
      </div>
      {activeRect && (
        <div
          className="screenshot-overlay__selection"
          style={{
            left: activeRect.x,
            top: activeRect.y,
            width: activeRect.width,
            height: activeRect.height,
          }}
        >
          <span className="screenshot-overlay__dimensions">
            {Math.round(activeRect.width)} &times; {Math.round(activeRect.height)}
          </span>
          {selection && (
            <div className="screenshot-overlay__actions" onMouseDown={(e) => e.stopPropagation()}>
              <button className="screenshot-overlay__action-btn" onClick={() => handleAction("save")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Save
              </button>
              <button className="screenshot-overlay__action-btn" onClick={() => handleAction("clipboard")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import "./ImportDialog.css";

interface ImportDialogProps {
  /** Imports pasted JSON, replacing the current drawing. */
  onImportJson: (content: string) => Promise<void>;
  /** Opens the native file picker to import a file instead. */
  onChooseFile: () => Promise<void>;
  onClose: () => void;
}

/** Lightweight client-side validation before hitting the backend. */
function validate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "Paste some Excalidraw JSON first.";
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return "That doesn't look like valid JSON.";
  }
  if (parsed?.type !== "excalidraw") {
    return 'Not an Excalidraw scene (expected "type": "excalidraw").';
  }
  return null;
}

export function ImportDialog({
  onImportJson,
  onChooseFile,
  onClose,
}: ImportDialogProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePasteClipboard = useCallback(async () => {
    setError(null);
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setText(clip);
      else setError("Clipboard is empty.");
    } catch {
      setError("Couldn't read the clipboard — paste into the box with ⌘V.");
    }
  }, []);

  const handleImport = async () => {
    const validationError = validate(text);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onImportJson(text.trim());
      onClose();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  const handleChooseFile = async () => {
    setBusy(true);
    try {
      await onChooseFile();
      onClose();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  return (
    <div className="import-overlay" onClick={onClose}>
      <div className="import-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="import-dialog__header">
          <h2 className="import-dialog__title">Import Excalidraw</h2>
          <button
            className="import-dialog__close"
            onClick={onClose}
            aria-label="Close"
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

        <p className="import-dialog__hint">
          Paste Excalidraw JSON below to replace the current drawing. The
          current version is saved to history first, so you can revert.
        </p>

        <textarea
          className="import-dialog__textarea"
          placeholder='{"type":"excalidraw","version":2,"elements":[...]}'
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoFocus
        />

        {error && <div className="import-dialog__error">{error}</div>}

        <div className="import-dialog__actions">
          <button
            className="import-dialog__btn import-dialog__btn--ghost"
            onClick={handlePasteClipboard}
            disabled={busy}
          >
            Paste from clipboard
          </button>
          <button
            className="import-dialog__btn import-dialog__btn--ghost"
            onClick={handleChooseFile}
            disabled={busy}
          >
            Choose file…
          </button>
          <div className="import-dialog__spacer" />
          <button
            className="import-dialog__btn"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="import-dialog__btn import-dialog__btn--primary"
            onClick={handleImport}
            disabled={busy}
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}

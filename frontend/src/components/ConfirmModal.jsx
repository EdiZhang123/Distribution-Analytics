import React, { useEffect, useCallback } from "react";

/**
 * Generic confirmation modal.
 *
 * Renders a fixed backdrop with a centered card. Escape key and backdrop
 * click both dismiss the modal (call `onCancel`).
 *
 * @param {boolean}  open          - Whether to show the modal
 * @param {string}   title         - Heading text
 * @param {string}   message       - Body text
 * @param {string}   confirmLabel  - Label for the confirm button (default "Yes")
 * @param {string}   cancelLabel   - Label for the cancel button (default "No")
 * @param {Function} onConfirm     - Called when the user confirms
 * @param {Function} onCancel      - Called when the user cancels
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  onCancel,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

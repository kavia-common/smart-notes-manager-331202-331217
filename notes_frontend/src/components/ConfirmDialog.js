import React, { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

/**
 * ConfirmDialog component
 * A small modal dialog that asks the user to confirm a destructive action.
 *
 * Props:
 *  isOpen    {boolean}   - whether the dialog is visible
 *  title     {string}    - dialog heading
 *  message   {string}    - explanatory text
 *  onConfirm {function}  - called when user clicks the confirm button
 *  onCancel  {function}  - called when user dismisses the dialog
 *  confirmLabel {string} - label for confirm button (default "Delete")
 *  isLoading {boolean}   - disables buttons while a request is in flight
 */

// PUBLIC_INTERFACE
function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  isLoading = false,
}) {
  const cancelRef = useRef(null);

  // Focus the cancel button when dialog opens
  useEffect(() => {
    if (isOpen && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="confirm-box">
        <h2 id="confirm-title" className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button
            ref={cancelRef}
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

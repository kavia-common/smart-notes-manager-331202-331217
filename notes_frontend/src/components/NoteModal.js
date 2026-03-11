import React, { useState, useEffect, useCallback, useRef } from 'react';
import './NoteModal.css';

/**
 * NoteModal component
 * A full-featured modal for viewing, creating, and editing notes.
 *
 * Props:
 *  isOpen       {boolean}          - whether the modal is visible
 *  mode         {'view'|'create'|'edit'}
 *  note         {NoteResponse|null} - existing note (edit/view); null for create
 *  onClose      {function}         - called when user closes the modal
 *  onSave       {function}         - called with (data, noteId?) when saving
 *  isSaving     {boolean}          - disables save button while request is in flight
 *  error        {string|null}      - server-side error message to display
 */

// PUBLIC_INTERFACE
function NoteModal({ isOpen, mode, note, onClose, onSave, isSaving, error }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const titleRef = useRef(null);
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit' || mode === 'create';

  // Populate fields when the modal opens or note changes
  useEffect(() => {
    if (!isOpen) return;
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsMarkdown(note.is_markdown || false);
      setTagsInput((note.tags || []).join(', '));
    } else {
      setTitle('');
      setContent('');
      setIsMarkdown(false);
      setTagsInput('');
    }
    setShowPreview(false);
  }, [isOpen, note, mode]);

  // Auto-focus title input when creating/editing
  useEffect(() => {
    if (isOpen && isEditMode && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, isEditMode]);

  // Close on Escape
  const handleEscape = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  // Parse tags from comma-separated string
  const parseTags = (str) =>
    str
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

  const handleSave = () => {
    if (isSaving) return;
    const data = {
      title: title.trim(),
      content,
      is_markdown: isMarkdown,
      tags: parseTags(tagsInput),
    };
    onSave(data, note?.id);
  };

  // Simple markdown renderer using basic patterns
  const renderMarkdown = (text) => {
    if (!text) return '';
    let html = text
      // Escape HTML entities
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold & italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Blockquote
      .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      // Horizontal rule
      .replace(/^[-*_]{3,}$/gm, '<hr />')
      // Unordered list items
      .replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>')
      // Ordered list items
      .replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>')
      // Paragraphs / line breaks
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br />');
    return `<p>${html}</p>`;
  };

  if (!isOpen) return null;

  const modalTitle =
    mode === 'create' ? 'New Note' :
    mode === 'edit'   ? 'Edit Note' :
    note?.title || 'Untitled';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal-box ${isViewMode ? 'modal-view' : ''}`}>
        {/* ── Modal Header ── */}
        <div className="modal-header">
          <h2 id="modal-heading" className="modal-heading">
            {isViewMode ? (
              <span>{note?.title || <span className="modal-untitled">Untitled</span>}</span>
            ) : (
              modalTitle
            )}
          </h2>
          <div className="modal-header-actions">
            {isViewMode && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onSave(null, note?.id, 'switch-to-edit')}
                aria-label="Edit this note"
              >
                ✏️ Edit
              </button>
            )}
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="modal-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* ── View Mode ── */}
        {isViewMode && note && (
          <div className="modal-view-content">
            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="modal-tags">
                {note.tags.map((tag) => (
                  <span key={tag} className="note-tag">{tag}</span>
                ))}
              </div>
            )}
            {/* Markdown badge + dates */}
            <div className="modal-meta">
              {note.is_markdown && (
                <span className="note-card-md-badge">Markdown</span>
              )}
              <span className="modal-date">
                Created: {new Date(note.created_at).toLocaleString()}
              </span>
              <span className="modal-date">
                Updated: {new Date(note.updated_at).toLocaleString()}
              </span>
            </div>
            {/* Content */}
            {note.is_markdown ? (
              <div
                className="modal-markdown-render"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
              />
            ) : (
              <pre className="modal-plain-text">{note.content}</pre>
            )}
          </div>
        )}

        {/* ── Edit / Create Mode ── */}
        {isEditMode && (
          <div className="modal-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="note-title" className="form-label">Title</label>
              <input
                id="note-title"
                ref={titleRef}
                type="text"
                className="form-input"
                placeholder="Note title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                aria-label="Note title"
              />
            </div>

            {/* Content + Markdown toggle / preview */}
            <div className="form-group form-group-grow">
              <div className="form-label-row">
                <label htmlFor="note-content" className="form-label">Content</label>
                <div className="md-controls">
                  <label className="md-toggle" title="Enable Markdown">
                    <input
                      type="checkbox"
                      checked={isMarkdown}
                      onChange={(e) => setIsMarkdown(e.target.checked)}
                      aria-label="Markdown mode"
                    />
                    <span>Markdown</span>
                  </label>
                  {isMarkdown && (
                    <button
                      type="button"
                      className={`btn btn-xs ${showPreview ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setShowPreview((v) => !v)}
                      aria-pressed={showPreview}
                    >
                      {showPreview ? 'Edit' : 'Preview'}
                    </button>
                  )}
                </div>
              </div>

              {isMarkdown && showPreview ? (
                <div
                  className="form-markdown-preview"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                  aria-label="Markdown preview"
                />
              ) : (
                <textarea
                  id="note-content"
                  className="form-textarea"
                  placeholder={isMarkdown ? '# Heading\n\nWrite **Markdown** here…' : 'Write your note here…'}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  aria-label="Note content"
                />
              )}
            </div>

            {/* Tags */}
            <div className="form-group">
              <label htmlFor="note-tags" className="form-label">
                Tags
                <span className="form-label-hint"> (comma-separated)</span>
              </label>
              <input
                id="note-tags"
                type="text"
                className="form-input"
                placeholder="work, ideas, todo…"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                aria-label="Tags (comma-separated)"
              />
            </div>
          </div>
        )}

        {/* ── Footer (edit/create only) ── */}
        {isEditMode && (
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : mode === 'create' ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteModal;

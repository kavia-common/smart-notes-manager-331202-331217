import React from 'react';
import './NoteCard.css';

/**
 * NoteCard component
 * Renders a single note as a card in the notes grid.
 *
 * Props:
 *  note         {NoteResponse}   - the note data
 *  onView       {function}       - called when the card is clicked (view mode)
 *  onEdit       {function}       - called when Edit button is clicked
 *  onDelete     {function}       - called when Delete button is clicked
 */

// PUBLIC_INTERFACE
function NoteCard({ note, onView, onEdit, onDelete }) {
  // Format date as "Jan 5, 2025"
  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Truncate preview to ~150 chars, stripping markdown syntax roughly
  const getPreview = (content) => {
    if (!content) return '';
    // Strip common markdown patterns for preview
    const plain = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();
    return plain.length > 150 ? plain.slice(0, 150) + '…' : plain;
  };

  const handleCardClick = (e) => {
    // Don't trigger view if a button was clicked
    if (e.target.closest('button')) return;
    onView(note);
  };

  return (
    <article
      className="note-card"
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`View note: ${note.title || 'Untitled'}`}
      onKeyDown={(e) => e.key === 'Enter' && onView(note)}
    >
      {/* Card header */}
      <div className="note-card-header">
        <h3 className="note-card-title">
          {note.title || <span className="note-card-untitled">Untitled</span>}
        </h3>
        {note.is_markdown && (
          <span className="note-card-md-badge" title="Markdown note" aria-label="Markdown">
            MD
          </span>
        )}
      </div>

      {/* Content preview */}
      <p className="note-card-preview">
        {getPreview(note.content) || <span className="note-card-no-content">No content</span>}
      </p>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="note-card-tags" aria-label="Tags">
          {note.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="note-tag">{tag}</span>
          ))}
          {note.tags.length > 4 && (
            <span className="note-tag note-tag-more">+{note.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer: date + actions */}
      <div className="note-card-footer">
        <time className="note-card-date" dateTime={note.updated_at}>
          {formatDate(note.updated_at)}
        </time>
        <div className="note-card-actions">
          <button
            className="note-action-btn edit"
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            aria-label={`Edit note: ${note.title || 'Untitled'}`}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className="note-action-btn delete"
            onClick={(e) => { e.stopPropagation(); onDelete(note); }}
            aria-label={`Delete note: ${note.title || 'Untitled'}`}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </article>
  );
}

export default NoteCard;

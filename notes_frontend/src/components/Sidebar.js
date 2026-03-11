import React from 'react';
import './Sidebar.css';

/**
 * Sidebar component
 * Shows "All Notes" and the list of tags as filter options.
 * Also allows deleting individual tags.
 *
 * Props:
 *  tags         {TagResponse[]}  - all available tags
 *  activeTag    {string|null}    - currently selected tag filter (name)
 *  onSelectTag  {function}       - called with tag name (or null for "all")
 *  onDeleteTag  {function}       - called with tag id to delete
 *  totalNotes   {number}         - total note count for "All Notes" badge
 */

// PUBLIC_INTERFACE
function Sidebar({ tags, activeTag, onSelectTag, onDeleteTag, totalNotes }) {
  return (
    <aside className="sidebar" aria-label="Tag filters">
      <nav>
        {/* All notes */}
        <button
          className={`sidebar-item ${!activeTag ? 'active' : ''}`}
          onClick={() => onSelectTag(null)}
          aria-current={!activeTag ? 'true' : undefined}
        >
          <span className="sidebar-item-icon" aria-hidden="true">📋</span>
          <span className="sidebar-item-label">All Notes</span>
          <span className="sidebar-item-count">{totalNotes}</span>
        </button>

        {/* Tags header */}
        {tags.length > 0 && (
          <div className="sidebar-section-header">Tags</div>
        )}

        {/* Individual tags */}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={`sidebar-item sidebar-tag-row ${activeTag === tag.name ? 'active' : ''}`}
          >
            <button
              className="sidebar-tag-btn"
              onClick={() => onSelectTag(tag.name === activeTag ? null : tag.name)}
              aria-current={activeTag === tag.name ? 'true' : undefined}
              aria-label={`Filter by tag: ${tag.name}`}
            >
              <span className="sidebar-item-icon tag-dot" aria-hidden="true">🏷️</span>
              <span className="sidebar-item-label">{tag.name}</span>
            </button>
            <button
              className="tag-delete-btn"
              onClick={() => onDeleteTag(tag.id, tag.name)}
              aria-label={`Delete tag ${tag.name}`}
              title={`Delete tag "${tag.name}"`}
            >
              ✕
            </button>
          </div>
        ))}

        {tags.length === 0 && (
          <p className="sidebar-empty">No tags yet.</p>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;

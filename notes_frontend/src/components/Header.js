import React from 'react';
import './Header.css';

/**
 * Header component
 * Displays the app name, an optional search bar (mobile), and the "New Note" CTA.
 *
 * Props:
 *  onNewNote  {function}  - called when the user clicks "New Note"
 *  searchQuery {string}   - current search value
 *  onSearchChange {function} - called with the new search string
 */

// PUBLIC_INTERFACE
function Header({ onNewNote, searchQuery, onSearchChange }) {
  return (
    <header className="app-header">
      {/* Brand */}
      <div className="header-brand">
        <span className="header-icon" aria-hidden="true">📝</span>
        <span className="header-title">Smart Notes</span>
      </div>

      {/* Search input */}
      <div className="header-search">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          className="header-search-input"
          placeholder="Search notes…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search notes"
        />
      </div>

      {/* New note button */}
      <button
        className="btn btn-primary header-new-btn"
        onClick={onNewNote}
        aria-label="Create new note"
      >
        <span aria-hidden="true">＋</span> New Note
      </button>
    </header>
  );
}

export default Header;

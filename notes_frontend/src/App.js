import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import ConfirmDialog from './components/ConfirmDialog';
import {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  listTags,
  deleteTag,
  searchNotes,
} from './api/notesApi';

// Debounce delay for search input (ms)
const SEARCH_DEBOUNCE_MS = 400;

// PUBLIC_INTERFACE
/**
 * Root application component.
 * Manages global state: notes list, tags, modals, search, pagination.
 */
function App() {
  // ── Notes state ──────────────────────────────────────────────────────────
  const [notes, setNotes] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState(null);

  // ── Tags state ───────────────────────────────────────────────────────────
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  // ── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const LIMIT = 20;

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [activeNote, setActiveNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── Confirm Delete state ─────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch notes from the backend
  // ─────────────────────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setIsLoadingNotes(true);
    setNotesError(null);
    try {
      const skip = currentPage * LIMIT;
      let result;
      if (debouncedSearch.trim()) {
        result = await searchNotes({
          q: debouncedSearch.trim(),
          tag: activeTag || undefined,
          skip,
          limit: LIMIT,
        });
      } else {
        result = await listNotes({
          tag: activeTag || undefined,
          skip,
          limit: LIMIT,
        });
      }
      setNotes(result.items);
      setTotalNotes(result.total);
    } catch (err) {
      setNotesError(err.message || 'Failed to load notes.');
    } finally {
      setIsLoadingNotes(false);
    }
  }, [debouncedSearch, activeTag, currentPage]);

  // Fetch tags from the backend
  const fetchTags = useCallback(async () => {
    try {
      const data = await listTags();
      setTags(data || []);
    } catch (_) {
      // Non-critical; silently fail
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Reset to page 0 whenever search or tag filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearch, activeTag]);

  // ─────────────────────────────────────────────────────────────────────────
  // Search debouncing
  // ─────────────────────────────────────────────────────────────────────────
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Modal helpers
  // ─────────────────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setActiveNote(null);
    setModalMode('create');
    setSaveError(null);
    setModalOpen(true);
  };

  const openViewModal = (note) => {
    setActiveNote(note);
    setModalMode('view');
    setSaveError(null);
    setModalOpen(true);
  };

  const openEditModal = (note) => {
    setActiveNote(note);
    setModalMode('edit');
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSaveError(null);
    setActiveNote(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Handle save from NoteModal.
   * If called with action='switch-to-edit', simply switch modal mode.
   */
  const handleSave = async (data, noteId, action) => {
    // Handle "Edit" button click from view mode
    if (action === 'switch-to-edit') {
      setModalMode('edit');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      if (noteId) {
        await updateNote(noteId, data);
      } else {
        await createNote(data);
      }
      closeModal();
      await fetchNotes();
      await fetchTags();
    } catch (err) {
      setSaveError(err.message || 'Failed to save note.');
    } finally {
      setIsSaving(false);
    }
  };

  /** Open the confirm delete dialog. */
  const handleDeleteRequest = (note) => {
    setNoteToDelete(note);
    setConfirmOpen(true);
  };

  /** Actually delete after confirmation. */
  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteNote(noteToDelete.id);
      setConfirmOpen(false);
      setNoteToDelete(null);
      await fetchNotes();
      await fetchTags();
    } catch (err) {
      // Could show an inline error here; for now just close
      setConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  /** Delete a tag globally. */
  const handleDeleteTag = async (tagId, tagName) => {
    if (!window.confirm(`Delete tag "${tagName}" from all notes?`)) return;
    try {
      await deleteTag(tagId);
      if (activeTag === tagName) setActiveTag(null);
      await fetchTags();
      await fetchNotes();
    } catch (_) {
      // silent
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(totalNotes / LIMIT);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* ── Top header ── */}
      <Header
        onNewNote={openCreateModal}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <div className="app-body">
        {/* ── Left sidebar ── */}
        <Sidebar
          tags={tags}
          activeTag={activeTag}
          onSelectTag={setActiveTag}
          onDeleteTag={handleDeleteTag}
          totalNotes={totalNotes}
        />

        {/* ── Main content ── */}
        <main className="main-content" aria-label="Notes list">
          {/* Sub-header: title + count */}
          <div className="content-header">
            <h1 className="content-title">
              {debouncedSearch
                ? `Search: "${debouncedSearch}"`
                : activeTag
                ? `#${activeTag}`
                : 'All Notes'}
            </h1>
            <span className="content-count">{totalNotes} note{totalNotes !== 1 ? 's' : ''}</span>
          </div>

          {/* Tag filter pill (mobile) */}
          {activeTag && (
            <div className="active-tag-pill">
              <span>🏷️ {activeTag}</span>
              <button
                className="active-tag-clear"
                onClick={() => setActiveTag(null)}
                aria-label="Clear tag filter"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoadingNotes && (
            <div className="notes-loading" aria-live="polite" aria-label="Loading notes">
              <div className="spinner" aria-hidden="true"></div>
              <span>Loading notes…</span>
            </div>
          )}

          {/* Error */}
          {notesError && !isLoadingNotes && (
            <div className="notes-error" role="alert">
              <span>⚠️ {notesError}</span>
              <button className="btn btn-secondary btn-sm" onClick={fetchNotes}>
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingNotes && !notesError && notes.length === 0 && (
            <div className="notes-empty" aria-live="polite">
              <span className="notes-empty-icon" aria-hidden="true">📭</span>
              <h2 className="notes-empty-title">
                {debouncedSearch ? 'No results found' : 'No notes yet'}
              </h2>
              <p className="notes-empty-sub">
                {debouncedSearch
                  ? 'Try a different search term or clear the filter.'
                  : 'Create your first note to get started!'}
              </p>
              {!debouncedSearch && (
                <button className="btn btn-primary" onClick={openCreateModal}>
                  ＋ New Note
                </button>
              )}
            </div>
          )}

          {/* Notes grid */}
          {!isLoadingNotes && !notesError && notes.length > 0 && (
            <div className="notes-grid" aria-label="Notes">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          )}
        </main>
      </div>

      {/* ── Note Modal (create / edit / view) ── */}
      <NoteModal
        isOpen={modalOpen}
        mode={modalMode}
        note={activeNote}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={isSaving}
        error={saveError}
      />

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title || 'this note'}"? This cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setNoteToDelete(null); }}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default App;

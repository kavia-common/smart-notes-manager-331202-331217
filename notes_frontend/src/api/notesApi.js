/**
 * notesApi.js
 * -----------
 * Central API service that wraps every backend endpoint.
 * All functions return Promises that resolve with the parsed JSON body,
 * or reject with an Error containing a human-readable message.
 *
 * Base URL is read from REACT_APP_API_URL (or defaults to port 3001
 * on the same host for local development).
 */

const BASE_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Shared fetch wrapper.  Throws on non-2xx responses.
 * @param {string} path     - URL path (must start with /)
 * @param {RequestInit} [options] - fetch options
 * @returns {Promise<any>}  Parsed JSON (or null for 204 No Content)
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const defaultHeaders = { 'Content-Type': 'application/json' };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  });

  if (response.status === 204) return null; // No Content

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch (_) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

// PUBLIC_INTERFACE
/**
 * List notes with optional tag filter and pagination.
 * @param {{ tag?: string, skip?: number, limit?: number }} params
 * @returns {Promise<{total: number, items: NoteResponse[]}>}
 */
export async function listNotes({ tag, skip = 0, limit = 20 } = {}) {
  const params = new URLSearchParams({ skip, limit });
  if (tag) params.append('tag', tag);
  return request(`/notes?${params}`);
}

// PUBLIC_INTERFACE
/**
 * Get a single note by ID.
 * @param {number} id
 * @returns {Promise<NoteResponse>}
 */
export async function getNote(id) {
  return request(`/notes/${id}`);
}

// PUBLIC_INTERFACE
/**
 * Create a new note.
 * @param {{ title: string, content: string, is_markdown: boolean, tags: string[] }} data
 * @returns {Promise<NoteResponse>}
 */
export async function createNote(data) {
  return request('/notes', { method: 'POST', body: JSON.stringify(data) });
}

// PUBLIC_INTERFACE
/**
 * Update an existing note (partial update — only provided fields are changed).
 * @param {number} id
 * @param {{ title?: string, content?: string, is_markdown?: boolean, tags?: string[] }} data
 * @returns {Promise<NoteResponse>}
 */
export async function updateNote(id, data) {
  return request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// PUBLIC_INTERFACE
/**
 * Delete a note permanently.
 * @param {number} id
 * @returns {Promise<null>}
 */
export async function deleteNote(id) {
  return request(`/notes/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

// PUBLIC_INTERFACE
/**
 * List all tags sorted alphabetically.
 * @returns {Promise<TagResponse[]>}
 */
export async function listTags() {
  return request('/tags');
}

// PUBLIC_INTERFACE
/**
 * Delete a tag and remove it from all associated notes.
 * @param {number} tagId
 * @returns {Promise<null>}
 */
export async function deleteTag(tagId) {
  return request(`/tags/${tagId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// PUBLIC_INTERFACE
/**
 * Full-text search across note titles and content.
 * @param {{ q: string, tag?: string, skip?: number, limit?: number }} params
 * @returns {Promise<{total: number, items: NoteResponse[]}>}
 */
export async function searchNotes({ q, tag, skip = 0, limit = 20 } = {}) {
  const params = new URLSearchParams({ q, skip, limit });
  if (tag) params.append('tag', tag);
  return request(`/search?${params}`);
}

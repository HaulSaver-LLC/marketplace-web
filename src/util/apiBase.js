// src/util/apiBase.js
const RAW_BASE = process.env.REACT_APP_API_BASE_URL?.trim();

// Normalize to an absolute base or empty (=> same-origin)
function normalizeBase(b) {
  if (!b) return '';
  // If someone sets ":3500" or "localhost:3500", force a scheme.
  if (!/^https?:\/\//i.test(b)) {
    // ":3500" -> "http://localhost:3500"
    if (/^:\d{2,5}$/.test(b)) return `http://localhost${b}`;
    // "localhost:3500" -> "http://localhost:3500"
    if (/^[\w.-]+:\d{2,5}$/.test(b)) return `http://${b}`;
    return `http://${b}`;
  }
  return b;
}

export const API_BASE = normalizeBase(RAW_BASE);

// Always resolves correctly (no more ":3500/..." paths)
export const apiUrl = path => new URL(path, API_BASE || window.location.origin).toString();

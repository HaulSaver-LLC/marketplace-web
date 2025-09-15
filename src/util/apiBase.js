// src/util/apiBase.js (create if you don’t have one)
export function apiBase() {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.REACT_APP_DEV_API_SERVER_PORT || 3500;
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  // In prod, same-origin (SSR server on Render serves /api too)
  return '';
}

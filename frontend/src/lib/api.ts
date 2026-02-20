/**
 * Centralized API configuration for PaperCast.
 * 
 * In development, the Vite proxy handles /api → localhost:3000.
 * In production, VITE_API_URL points to the Railway backend URL.
 */

// In dev mode, VITE_API_URL is empty string so relative URLs hit the Vite proxy.
// In production, it's the full backend URL (e.g. https://papercast-backend.up.railway.app).
export const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '') // strip trailing slash
    : '';

/**
 * Build a full API endpoint URL.
 * Usage: apiUrl('/api/generate') → 'https://backend.railway.app/api/generate'
 */
export function apiUrl(path: string): string {
    return `${API_URL}${path}`;
}

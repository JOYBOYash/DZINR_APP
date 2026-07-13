/**
 * API Utility for resolving the backend API server URL dynamically.
 * Helps route /api/* requests correctly in PWA, Vercel deployments, custom domains, and local environments.
 */

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // 1. Static environment variables from Vite build configuration
  const envUrl = (import.meta as any).env.VITE_API_BASE_URL || (import.meta as any).env.VITE_BACKEND_URL;
  if (envUrl && envUrl.trim() !== "") {
    const base = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
    return `${base}${cleanEndpoint}`;
  }

  // 2. Auto-detected and stored backend URL in localStorage
  const savedUrl = localStorage.getItem("dzinr_backend_url");
  if (savedUrl && savedUrl.trim() !== "") {
    const base = savedUrl.endsWith("/") ? savedUrl.slice(0, -1) : savedUrl;
    return `${base}${cleanEndpoint}`;
  }

  // 3. Fallback to relative path (assumes same host)
  return cleanEndpoint;
}

/**
 * Auto-detect and persist the backend URL if running on the host that serves the APIs.
 */
export function initApiDetection(): void {
  if (typeof window === "undefined") return;

  const origin = window.location.origin;
  const isCloudRun = origin.includes("run.app") || origin.includes("web.app") || origin.includes("firebaseapp.com");
  const isLocalHost = origin.includes("localhost") || origin.includes("127.0.0.1");

  if (isCloudRun || isLocalHost) {
    localStorage.setItem("dzinr_backend_url", origin);
  }
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Backend API origin. Set `VITE_API_BASE_URL` on Vercel to your Render service URL
 * (e.g. https://your-api.onrender.com). Omit trailing slash.
 */
export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "https://salon-management-system-pehs.onrender.com"
);

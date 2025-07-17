/**
 * Utility functions for URL normalization
 * This ensures all API URLs work correctly in both development and production
 */

/**
 * Normalizes URLs by removing any duplicate API_BASE_URL references
 * and ensuring proper formatting for both localhost and production
 * @param url The URL to normalize
 * @returns The normalized URL
 */
export const normalizeUrl = (url: string): string => {
  // If URL already contains a full domain, extract just the path
  if (url.includes("://")) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }
  
  // Remove any manually added base URL prefixes
  url = url.replace(/^.*127\.0\.0\.1:8000/, "");
  url = url.replace(/^.*docentes\.facet\.unt\.edu\.ar/, "");
  url = url.replace(/^.*localhost:8000/, "");
  
  // Remove duplicate /api/ patterns
  url = url.replace(/\/api\/api\//, "/api/");
  url = url.replace(/\/api\/facet\//, "/facet/");
  url = url.replace(/\/api\/login\//, "/login/");
  
  // Ensure URL starts with / if it's a relative path
  if (!url.startsWith("/") && !url.startsWith("http")) {
    url = "/" + url;
  }
  
  return url;
};

/**
 * Builds a complete URL for API requests
 * @param endpoint The API endpoint (e.g., "/facet/area/", "/login/token/")
 * @returns The normalized URL ready for API calls
 */
export const buildApiUrl = (endpoint: string): string => {
  return normalizeUrl(endpoint);
};
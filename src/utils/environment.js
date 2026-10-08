/**
 * Determines if the application is running in a production environment
 * @returns {boolean} True if in production, false if in development
 */
export const isProduction = () => {
  // Browser-side check
  if (typeof window !== 'undefined') {
    // Always treat non-localhost as production
    return !window.location.hostname.includes('localhost');
  }
  
  return import.meta.env.PROD;
};

/**
 * Gets the API server URL based on the environment
 * @returns {string} The base API URL
 */
export const getBaseUrl = () => {
  // Check for explicit API URL from environment
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Use same-origin by default so Vercel dev, production, and Vite proxying all
  // share the same request path. Set VITE_API_URL when the API is on another origin.
  return '';
};

/**
 * Gets the full URL for an API endpoint
 * @param {string} path - The API endpoint path (e.g., '/api/checkWord')
 * @returns {string} The full URL to the API endpoint
 */
export const getApiUrl = (path) => {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

// Export for convenience
export default {
  isProduction,
  getBaseUrl,
  getApiUrl
}; 

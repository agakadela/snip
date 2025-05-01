/**
 * Helper functions for interacting with localStorage
 * Handles storing and retrieving user API key and cached summaries
 */

const STORAGE_KEYS = {
  API_KEY: 'snip-openrouter-api-key',
  SUMMARIES: 'snip-summaries',
};

type SummaryCache = {
  [videoId: string]: {
    summary: string;
    timestamp: number;
  };
};

/**
 * Get the user's OpenRouter API key from localStorage
 */
export const getUserApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
};

/**
 * Save the user's OpenRouter API key to localStorage
 */
export const saveUserApiKey = (apiKey: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
};

/**
 * Get a cached summary for a specific video ID
 */
export const getCachedSummary = (videoId: string): string | null => {
  if (typeof window === 'undefined') return null;
  
  const cachedData = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  if (!cachedData) return null;
  
  try {
    const summaries = JSON.parse(cachedData) as SummaryCache;
    const cached = summaries[videoId];
    
    if (!cached) return null;
    
    // Optional: Check if cache is too old (e.g., 7 days)
    const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      return null;
    }
    
    return cached.summary;
  } catch (error) {
    console.error('Error parsing cached summaries:', error);
    return null;
  }
};

/**
 * Save a summary to the cache for a specific video ID
 */
export const cacheSummary = (videoId: string, summary: string): void => {
  if (typeof window === 'undefined') return;
  
  let summaries: SummaryCache = {};
  
  const cachedData = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  if (cachedData) {
    try {
      summaries = JSON.parse(cachedData) as SummaryCache;
    } catch (error) {
      console.error('Error parsing cached summaries:', error);
    }
  }
  
  summaries[videoId] = {
    summary,
    timestamp: Date.now(),
  };
  
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
};

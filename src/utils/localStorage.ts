/**
 * Helper functions for interacting with localStorage
 * Handles storing and retrieving user API key and cached summaries
 * Supports storing different versions of summaries based on length
 */

const STORAGE_KEYS = {
  API_KEY: 'snip-openrouter-api-key',
  SUMMARIES: 'snip-summaries',
};

import { SummaryLength } from "@/lib/summarize";

type CachedSummary = {
  summary: string;
  timestamp: number;
  length: SummaryLength;
};

type SummaryCache = {
  [videoId: string]: {
    [length in SummaryLength]?: CachedSummary;
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
 * Get a cached summary for a specific video ID and length
 * @param videoId The YouTube video ID
 * @param length The requested summary length
 * @returns The cached summary text, or null if not found
 */
export const getCachedSummary = (videoId: string, length: SummaryLength): string | null => {
  if (typeof window === 'undefined') return null;
  
  const cachedData = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  if (!cachedData) return null;
  
  try {
    const summaries = JSON.parse(cachedData) as SummaryCache;
    const cachedVideoSummaries = summaries[videoId];
    
    if (!cachedVideoSummaries || !cachedVideoSummaries[length]) return null;
    
    const cached = cachedVideoSummaries[length];
    
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
 * Save a summary to the cache for a specific video ID and length
 * @param videoId The YouTube video ID
 * @param summary The summary text to cache
 * @param length The length of the summary
 */
export const cacheSummary = (videoId: string, summary: string, length: SummaryLength): void => {
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
  
  // Initialize the video's summary cache if it doesn't exist
  if (!summaries[videoId]) {
    summaries[videoId] = {};
  }
  
  // Store the summary with its length
  summaries[videoId][length] = {
    summary,
    timestamp: Date.now(),
    length,
  };
  
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
};

/**
 * Check if any summary exists for a video ID (regardless of length)
 * @param videoId The YouTube video ID
 * @returns True if any summary exists for this video
 */
export const hasCachedSummaries = (videoId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const cachedData = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  if (!cachedData) return false;
  
  try {
    const summaries = JSON.parse(cachedData) as SummaryCache;
    return !!summaries[videoId] && Object.keys(summaries[videoId]).length > 0;
  } catch (error) {
    console.error('Error parsing cached summaries:', error);
    return false;
  }
};

/**
 * Get all available summary lengths for a video ID
 * @param videoId The YouTube video ID
 * @returns Array of available summary lengths, or empty array if none
 */
export const getAvailableSummaryLengths = (videoId: string): SummaryLength[] => {
  if (typeof window === 'undefined') return [];
  
  const cachedData = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  if (!cachedData) return [];
  
  try {
    const summaries = JSON.parse(cachedData) as SummaryCache;
    if (!summaries[videoId]) return [];
    
    return Object.keys(summaries[videoId]) as SummaryLength[];
  } catch (error) {
    console.error('Error parsing cached summaries:', error);
    return [];
  }
};

/**
 * Function to extract transcript from a YouTube video
 */

import {
  fetchTranscriptClientSide,
  fetchTranscriptDirect,
} from '@/utils/transcriptUtils';

/**
 * Extract the YouTube video ID from a URL
 */
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    // Full URL (various formats)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    // Short URL
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    // Embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Fetch the transcript for a YouTube video by ID using client-side methods
 * with server-side fallback as a last resort
 */
export const getTranscript = async (videoId: string): Promise<string> => {
  try {
    // Try the primary client-side method first (with CORS proxy)
    try {
      console.log(
        'Attempting to fetch transcript using primary client-side method...'
      );
      return await fetchTranscriptClientSide(videoId);
    } catch (primaryError) {
      console.log('Primary client-side method failed:', primaryError);

      // Try the alternative direct method
      try {
        console.log(
          'Attempting to fetch transcript using direct API method...'
        );
        return await fetchTranscriptDirect(videoId);
      } catch (directError) {
        console.log('Direct API method also failed:', directError);

        // As a last resort, fallback to server API
        console.log(
          'All client-side methods failed, falling back to server API...'
        );
        const response = await fetch(`/api/transcript?videoId=${videoId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.transcript) {
          throw new Error('No transcript available for this video');
        }

        return data.transcript;
      }
    }
  } catch (error) {
    console.error('All transcript fetch methods failed:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch transcript. Make sure the video exists and has captions available.'
    );
  }
};

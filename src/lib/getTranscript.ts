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
 * Fetch the transcript for a YouTube video by ID directly from the client side
 */
export const getTranscript = async (videoId: string): Promise<string> => {
  try {
    // Try the primary client-side method
    try {
      return await fetchTranscriptClientSide(videoId);
    } catch (primaryError) {
      console.log(
        'Primary transcript method failed, trying direct method...',
        primaryError
      );

      // Try the alternative direct method
      try {
        return await fetchTranscriptDirect(videoId);
      } catch (directError) {
        console.log('Direct method also failed', directError);

        // Fallback to server API if all client-side methods fail
        console.log(
          'All client-side methods failed, falling back to server API'
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
    console.error('Error fetching transcript:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to fetch transcript. Make sure the video exists and has captions available.'
    );
  }
};

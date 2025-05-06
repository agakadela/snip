/**
 * Client-side utility functions for extracting transcripts from YouTube videos
 */

interface CaptionTrack {
  languageCode: string;
  baseUrl: string;
  name?: string;
  kind?: string;
  isTranslatable?: boolean;
}

/**
 * Fetches a YouTube transcript directly from the client side
 * @param videoId YouTube video ID
 * @returns Extracted transcript text
 */
export async function fetchTranscriptClientSide(
  videoId: string
): Promise<string> {
  try {
    // CORS proxy setup
    const proxy = 'https://corsproxy.io/?';

    // Step 1: Fetch the YouTube video page HTML using a CORS proxy
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const proxyUrl = proxy + encodeURIComponent(youtubeUrl);
    const videoPageResponse = await fetch(proxyUrl);
    const html = await videoPageResponse.text();

    // Step 2: Extract captionTracks from the HTML
    const captionTracks = extractCaptionTracks(html);

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks found');
    }

    // Step 3: Find an English track or use the first available track
    const englishTrack =
      captionTracks.find((track) => track.languageCode === 'en') ||
      captionTracks[0];

    if (!englishTrack || !englishTrack.baseUrl) {
      throw new Error('No suitable caption track found');
    }

    // Step 4: Fetch the transcript XML (also using CORS proxy)
    const transcriptProxyUrl = proxy + encodeURIComponent(englishTrack.baseUrl);
    const transcriptResponse = await fetch(transcriptProxyUrl);

    if (!transcriptResponse.ok) {
      throw new Error(
        `Failed to fetch transcript: ${transcriptResponse.status}`
      );
    }

    const transcriptXml = await transcriptResponse.text();

    // Step 5: Extract text from XML
    return extractTextFromXml(transcriptXml);
  } catch (error) {
    console.error('Error fetching transcript client-side:', error);
    throw error;
  }
}

/**
 * Extract caption tracks from YouTube page HTML
 */
function extractCaptionTracks(html: string): CaptionTrack[] {
  try {
    // Try multiple potential patterns to extract the captions data
    let match = null;
    const captionPatterns = [
      /"captionTracks":(\[.*?\])/,
      /captionTracks'?:(\[.*?\])/,
      /'captionTracks':(\[.*?\])/,
    ];

    for (const pattern of captionPatterns) {
      match = html.match(pattern);
      if (match && match[1]) {
        break;
      }
    }

    if (!match || !match[1]) {
      throw new Error('No caption tracks found in HTML');
    }

    return JSON.parse(match[1]);
  } catch (error) {
    console.error('Failed to extract caption tracks:', error);
    throw error;
  }
}

/**
 * Extract text from transcript XML
 */
function extractTextFromXml(transcriptXml: string): string {
  const textRegex = /<text[^>]*>(.*?)<\/text>/g;
  let transcript = '';
  let match;

  while ((match = textRegex.exec(transcriptXml)) !== null) {
    // Decode HTML entities in the text
    const text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    transcript += text + ' ';
  }

  return transcript.trim();
}

/**
 * Alternative method trying direct URL patterns
 * Can be used as a fallback
 */
export async function fetchTranscriptDirect(videoId: string): Promise<string> {
  // CORS proxy setup
  const proxy = 'https://corsproxy.io/?';

  // Try direct URL patterns for English captions
  const directUrls = [
    `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}`,
    `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`, // auto-generated
  ];

  let transcriptXml = '';

  // Try each URL pattern with proxy
  for (const url of directUrls) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl);

      if (response.ok) {
        transcriptXml = await response.text();
        if (transcriptXml && transcriptXml.length > 100) {
          // Simple check to ensure we got something
          break;
        }
      }
    } catch (err) {
      // Continue trying with other URLs
      console.log(`Failed with URL ${url}:`, err);
    }
  }

  if (!transcriptXml || transcriptXml.length < 100) {
    throw new Error('No transcript found with direct method');
  }

  return extractTextFromXml(transcriptXml);
}

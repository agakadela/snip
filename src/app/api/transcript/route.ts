import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';

// Add a fallback method to fetch transcripts
async function fetchTranscriptFallback(videoId: string): Promise<string> {
  try {
    // First try to fetch video info to get available caption tracks
    const infoResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          Referer: 'https://www.youtube.com/',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'max-age=0',
        },
      }
    );
    const html = await infoResponse.text();

    // Log success from the first request
    console.log(
      `[Transcript Fallback] Fetched HTML for video: ${videoId}, length: ${html.length}`
    );

    // Extract captionTracks from the response - improved patterns
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
        console.log(
          `[Transcript Fallback] Found caption tracks with pattern: ${pattern}`
        );
        break;
      }
    }

    if (!match || !match[1]) {
      console.error(
        `[Transcript Fallback] No caption tracks found in HTML response. HTML snippet:`,
        html.substring(0, 500) + '...'
      );
      throw new Error('No caption tracks found');
    }

    // Try to parse the caption tracks with safety checks
    let captionTracks;
    try {
      captionTracks = JSON.parse(match[1]);
      console.log(
        `[Transcript Fallback] Successfully parsed ${captionTracks.length} caption tracks`
      );
    } catch (parseError) {
      console.error(
        `[Transcript Fallback] Failed to parse caption tracks:`,
        parseError
      );
      throw new Error('Failed to parse caption data');
    }

    // Find an English track (or the first available track)
    const englishTrack =
      captionTracks.find(
        (track: { languageCode: string; baseUrl?: string }) =>
          track.languageCode === 'en'
      ) || captionTracks[0];

    if (!englishTrack || !englishTrack.baseUrl) {
      throw new Error('No suitable caption track found');
    }

    // Fetch the actual transcript XML
    const transcriptResponse = await fetch(englishTrack.baseUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Referer: `https://www.youtube.com/watch?v=${videoId}`,
      },
    });
    const transcriptXml = await transcriptResponse.text();

    // Extract text from XML
    const textRegex = /<text[^>]*>(.*?)<\/text>/g;
    let transcript = '';
    let match2;

    while ((match2 = textRegex.exec(transcriptXml)) !== null) {
      // Decode HTML entities in the text
      const text = match2[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      transcript += text + ' ';
    }

    return transcript.trim();
  } catch (fallbackError) {
    console.error('Fallback method failed:', fallbackError);
    throw fallbackError;
  }
}

/**
 * Last resort method to fetch transcript directly from YouTube's timedtext API
 * This works for some videos when other methods fail
 */
async function fetchTranscriptDirectMethod(videoId: string): Promise<string> {
  try {
    console.log(
      `[Transcript Direct] Attempting direct method for video: ${videoId}`
    );

    // Try direct URL patterns for English auto-generated captions
    const directUrls = [
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`, // auto-generated
    ];

    let transcriptXml = '';

    // Try each URL pattern
    for (const url of directUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          },
        });

        if (response.ok) {
          transcriptXml = await response.text();
          if (transcriptXml && transcriptXml.length > 100) {
            // Simple check to ensure we got something
            console.log(`[Transcript Direct] Found transcript via: ${url}`);
            break;
          }
        }
      } catch (err) {
        // Continue trying with other URLs
        console.log(`[Transcript Direct] Failed with URL ${url}:`, err);
      }
    }

    if (!transcriptXml || transcriptXml.length < 100) {
      throw new Error('No transcript found with direct method');
    }

    // Extract text from XML
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
  } catch (error) {
    console.error(`[Transcript Direct] Direct method failed:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  // Get videoId from URL params
  const videoId = request.nextUrl.searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing videoId parameter' },
      { status: 400 }
    );
  }

  try {
    console.log(`[Transcript API] Fetching transcript for videoId: ${videoId}`);

    // Fetch subtitles using the server environment where CORS is not an issue
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: 'en',
    });

    if (!subtitles || subtitles.length === 0) {
      console.log(
        `[Transcript API] No subtitles found with primary method for video: ${videoId}, trying fallback...`
      );
      try {
        // Try the fallback method
        const fallbackTranscript = await fetchTranscriptFallback(videoId);
        console.log(
          `[Transcript API] Fallback successful, got transcript length: ${fallbackTranscript.length}`
        );
        return NextResponse.json({ transcript: fallbackTranscript });
      } catch (fallbackError) {
        console.error(
          `[Transcript API] Fallback method failed for video: ${videoId}`,
          fallbackError
        );
        if (fallbackError instanceof Error) {
          console.error(
            `[Transcript API] Fallback error details: ${fallbackError.message}`
          );
        }

        // Try the direct method as a last resort
        try {
          console.log(
            `[Transcript API] Trying direct method as last resort for video: ${videoId}`
          );
          const directTranscript = await fetchTranscriptDirectMethod(videoId);
          console.log(
            `[Transcript API] Direct method successful, got transcript length: ${directTranscript.length}`
          );
          return NextResponse.json({ transcript: directTranscript });
        } catch (directError) {
          console.error(
            `[Transcript API] All methods failed for video: ${videoId}`
          );
          console.error(`[Transcript API] Direct method error:`, directError);
          return NextResponse.json(
            { error: 'No transcript available for this video' },
            { status: 404 }
          );
        }
      }
    }

    // Process the subtitles into a single text
    const transcript = subtitles
      .map((subtitle) => subtitle.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(
      `[Transcript API] Successfully fetched transcript with length: ${transcript.length}`
    );
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error(
      `[Transcript API] Error fetching transcript for video: ${videoId}`,
      error
    );
    console.error(
      `[Transcript API] Detailed error:`,
      error instanceof Error ? error.message : JSON.stringify(error)
    );

    // Try fallback method if primary method fails
    try {
      console.log(
        `[Transcript API] Primary method failed for video: ${videoId}, trying fallback...`
      );
      const fallbackTranscript = await fetchTranscriptFallback(videoId);
      console.log(
        `[Transcript API] Fallback successful, got transcript length: ${fallbackTranscript.length}`
      );
      return NextResponse.json({ transcript: fallbackTranscript });
    } catch (fallbackError) {
      console.error(
        `[Transcript API] Fallback method also failed for video: ${videoId}`,
        fallbackError
      );

      // Try the direct method as a last resort
      try {
        console.log(
          `[Transcript API] Trying direct method as last resort for video: ${videoId}`
        );
        const directTranscript = await fetchTranscriptDirectMethod(videoId);
        console.log(
          `[Transcript API] Direct method successful, got transcript length: ${directTranscript.length}`
        );
        return NextResponse.json({ transcript: directTranscript });
      } catch (directError) {
        console.error(
          `[Transcript API] All methods failed for video: ${videoId}`
        );
        console.error(`[Transcript API] Direct method error:`, directError);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : 'Failed to fetch transcript',
          },
          { status: 500 }
        );
      }
    }
  }
}

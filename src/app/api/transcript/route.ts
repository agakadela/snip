import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';

// Add a fallback method to fetch transcripts
async function fetchTranscriptFallback(videoId: string): Promise<string> {
  try {
    // First try to fetch video info to get available caption tracks
    const infoResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    const html = await infoResponse.text();

    // Extract captionTracks from the response
    const captionRegex = /"captionTracks":(\[.*?\])/;
    const match = html.match(captionRegex);

    if (!match || !match[1]) {
      throw new Error('No caption tracks found');
    }

    // Parse the caption tracks
    const captionTracks = JSON.parse(match[1]);

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
    const transcriptResponse = await fetch(englishTrack.baseUrl);
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
    // Fetch subtitles using the server environment where CORS is not an issue
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: 'en',
    });

    if (!subtitles || subtitles.length === 0) {
      console.log('No subtitles found with primary method, trying fallback...');
      try {
        // Try the fallback method
        const fallbackTranscript = await fetchTranscriptFallback(videoId);
        return NextResponse.json({ transcript: fallbackTranscript });
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return NextResponse.json(
          { error: 'No transcript available for this video' },
          { status: 404 }
        );
      }
    }

    // Process the subtitles into a single text
    const transcript = subtitles
      .map((subtitle) => subtitle.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    console.error(
      'Detailed error:',
      error instanceof Error ? error.message : JSON.stringify(error)
    );

    // Try fallback method if primary method fails
    try {
      console.log('Primary method failed, trying fallback...');
      const fallbackTranscript = await fetchTranscriptFallback(videoId);
      return NextResponse.json({ transcript: fallbackTranscript });
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
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

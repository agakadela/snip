import { NextRequest, NextResponse } from 'next/server';
import { getSubtitles } from 'youtube-caption-extractor';

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
      return NextResponse.json(
        { error: 'No transcript available for this video' },
        { status: 404 }
      );
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
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch transcript' 
      },
      { status: 500 }
    );
  }
}

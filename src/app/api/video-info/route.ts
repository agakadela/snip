import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side API route to fetch YouTube video info
 * This bypasses Content Security Policy restrictions by proxying the request through your own domain
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "Missing videoId parameter" },
      { status: 400 }
    );
  }

  try {
    // Use noembed.com to fetch video metadata
    const response = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video info: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      title: data.title || "",
      author_name: data.author_name || "",
      thumbnail_url: data.thumbnail_url || ""
    });
  } catch (error) {
    console.error("Error fetching video info:", error);
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}

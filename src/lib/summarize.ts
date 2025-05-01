/**
 * Function to summarize text using OpenRouter API (llama-4-maverick:free)
 */
import { getUserApiKey } from "@/utils/localStorage";

// Define the summary length type
export type SummaryLength = "short" | "medium" | "long";

// Default OpenRouter API key to use
// Next.js requires using `NEXT_PUBLIC_` prefix for client-side accessible env vars
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Model to use
const MODEL = "meta-llama/llama-4-maverick:free";

// Prompts for different summary lengths
const SUMMARY_PROMPTS = {
  short: `Extract the essential content from this YouTube transcript as if you're creating a substitute for watching the video. Use this structure:

MAIN TOPIC: A brief description of what someone would learn from this video (max 12 words).

KEY POINTS: 1-2 bullet points containing the MOST important specific information from the video. Include exact facts, figures, methods, tools, or recommendations that were shared. Use dash marks (-) at the start.

SUMMARY: A concise extraction (40-50 words) of the core information presented. Focus on concrete knowledge, steps, tips, or insights that the viewer would take away after watching. Act as if you're giving someone everything they'd remember after watching.

Do not merely describe what the video is about - extract the actual valuable content. If there are specific instructions, numbers, products, or methodologies mentioned, include those exact details. Use only plain text with the exact section headers shown above.`,

  medium: `Extract all important information from this YouTube transcript as if you're creating notes for someone who missed the video. Use this structure:

MAIN TOPIC: What specific knowledge or skills someone would gain from this video (max 15 words).

KEY POINTS: 2-3 bullet points containing the SPECIFIC information, insights or methods presented. Include exact data, techniques, recommendations, or step-by-step instructions if given. Use dash marks (-) at the start of each point.

SUMMARY: A thorough extraction (around 75-90 words) of the actual content presented. Include specific terminology, exact steps, concrete examples, product names, resources mentioned, etc. Focus on all the information someone would have if they'd watched the video themselves.

Don't just overview the video - capture the actual content itself. Your goal is to make watching unnecessary by including all valuable specific information. Use only plain text with the exact section headers shown above.`,

  long: `Create a comprehensive information extraction from this YouTube transcript that could fully replace watching the video. Use this structure:

MAIN TOPIC: What specific knowledge, skills or information someone would gain from this video (max 20 words).

KEY POINTS: 3-5 bullet points containing the SPECIFIC and DETAILED information presented. Include ALL important facts, figures, methods, exact steps, tools mentioned, resources recommended, examples given, or actionable insights. Use dash marks (-) at the start of each point.

SUMMARY: A thorough extraction (150-200 words) that captures ALL the valuable information from the video. Include:
- Exact numbers, percentages or statistics mentioned
- Complete step-by-step instructions if given
- Specific product names, websites, or resources referenced
- Actual examples or case studies presented
- Detailed methodologies or techniques explained
- Specific recommendations or advice given

Your goal is to make watching the video completely unnecessary by capturing ALL of the actual educational content. Someone reading your extraction should have the SAME knowledge they would have after watching the entire video. Use only plain text with the exact section headers shown above.`,
};

/**
 * Returns the appropriate max_tokens value based on summary length
 * @param length The desired summary length
 * @returns Number of tokens to allocate
 */
const getMaxTokensForLength = (length: SummaryLength): number => {
  // Allocate tokens based on summary length
  const tokenLimits = {
    short: 250, // For shorter, focused summaries
    medium: 400, // For medium-length summaries
    long: 1000, // For comprehensive information extraction
  };

  return tokenLimits[length];
};

/**
 * Summarize the given transcript using OpenRouter API
 * @param transcript The video transcript to summarize
 * @param length The desired length of the summary
 */
export const summarizeTranscript = async (
  transcript: string,
  length: SummaryLength = "medium"
): Promise<string> => {
  // Get user's API key if available, otherwise use default
  const apiKey = getUserApiKey() || DEFAULT_API_KEY;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          typeof window !== "undefined"
            ? window.location.origin
            : "https://snip.vercel.app",
        "X-Title": "Snip - YouTube Video Summarizer",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: SUMMARY_PROMPTS[length],
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.85, // Higher temperature for more creative, natural language
        max_tokens: getMaxTokensForLength(length), // Dynamic token allocation based on summary length
        top_p: 0.9, // Nucleus sampling for more diverse outputs
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Check if error is related to rate limiting or authentication
      if (response.status === 429 || response.status === 401) {
        throw new Error("API_KEY_ERROR");
      }

      throw new Error(
        errorData.error?.message ||
          `OpenRouter API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return (
      data.choices[0]?.message.content.trim() ||
      "Sorry, I couldn't generate a summary for this video."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "API_KEY_ERROR") {
      throw error; // Re-throw API key errors to be handled specifically
    }

    console.error("Error summarizing transcript:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate summary. Please try again later."
    );
  }
};

/**
 * Check if the given API key is valid by making a minimal API call
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          typeof window !== "undefined"
            ? window.location.origin
            : "https://snip.vercel.app",
        "X-Title": "Snip - YouTube Video Summarizer",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1, // Minimal tokens to validate key
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
};

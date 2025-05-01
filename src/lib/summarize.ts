/**
 * Function to summarize text using OpenRouter API (llama-4-maverick:free)
 */
import { getUserApiKey } from "@/utils/localStorage";

// Default OpenRouter API key to use
// Next.js requires using `NEXT_PUBLIC_` prefix for client-side accessible env vars
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Model to use
const MODEL = "meta-llama/llama-4-maverick:free";

// The prompt to use for summarization
const SUMMARY_PROMPT = `Analyze and summarize the following YouTube transcript as if you're a friendly person sharing it with a friend. Use the following structure:

MAIN TOPIC: A conversational one-sentence description of what the video covers (max 15 words). Make it sound like something a friend would say, not a formal title.

KEY POINTS: 2-4 bullet points highlighting what's interesting or valuable. Use dash marks (-) at the start of each point. Write these in a casual, engaging way - like you're texting a highlight to a friend.

SUMMARY: A natural, warm summary that feels like a friend telling you what they learned (around 75-90 words). Use contractions (I'm, you'll, here's), casual transitions ("So basically...", "The cool thing is..."), and an enthusiastic tone. Include phrases like "basically," "you know," "pretty much," or "kind of" where natural.

IMPORTANT: Avoid formal language completely. Sound like a real person having a conversation. Don't use academic language, jargon, or robotic transitions. Imagine explaining this to a friend over coffee in a relaxed setting. Do NOT use markdown formatting or hash symbols (#). Use only plain text with the exact section headers shown above.`;

/**
 * Summarize the given transcript using OpenRouter API
 */
export const summarizeTranscript = async (
  transcript: string
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
            content: SUMMARY_PROMPT,
          },
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.85, // Higher temperature for more creative, natural language
        max_tokens: 350, // Slightly more tokens for more natural phrasing
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

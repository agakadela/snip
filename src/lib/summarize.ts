/**
 * Function to summarize text using OpenRouter API (llama-4-maverick:free)
 */
import { getUserApiKey } from '@/utils/localStorage';

// Define the summary length type
export type SummaryLength = 'short' | 'medium' | 'long';

// Default OpenRouter API key to use
// Next.js requires using `NEXT_PUBLIC_` prefix for client-side accessible env vars
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model to use
const MODEL = 'meta-llama/llama-4-maverick:free';

// Prompts for different summary lengths
const SUMMARY_PROMPTS = {
  short: `Create a SCANNABLE summary of this YouTube transcript. Focus on FAST readability.

START with a one-sentence TL;DR (max 15 words).

Then provide 3-5 KEY POINTS in bullet format, each point should be:
- Concise (5-10 words each)
- Start with a bold heading or action verb
- Contain the most critical information only

If there are specific numbers, product names, or technical details, include ONLY the most essential ones.

Keep the total summary under 200 words and structure it for someone who will only spend 30 seconds reading.`,

  medium: `Create a HIGHLY SCANNABLE summary of this YouTube transcript for someone who is impatient.

FORMAT:
1. Start with "TL;DR:" followed by a one-sentence core takeaway (max 20 words)
2. List "KEY TAKEAWAYS:" as 3-5 bullet points (each 1-2 sentences maximum)
3. If relevant, add a "TECHNICAL DETAILS:" section with only critical specifications
4. End with "BOTTOM LINE:" that states the main conclusion/recommendation in one sentence

Make the summary extremely easy to scan in 60 seconds:
- Use bold text or colons to highlight important terms
- Keep paragraphs to 2-3 sentences maximum
- Include specific product names, numbers, or techniques only if essential
- Favor bullets and short sentences over lengthy explanation

Total summary: 250-350 words maximum.`,

  long: `Create a detailed but SCANNABLE summary of this YouTube transcript for someone who wants all the important information but doesn't want to watch the video.

STRUCTURE:
1. "TL;DR:" - One paragraph (2-3 sentences) bottom-line summary
2. "MAIN POINTS:" - 5-7 bullet points covering the core information
3. "DETAILS:" - Organized into clearly labeled sections by topic
4. "ACTIONABLE TAKEAWAYS:" - Practical steps or conclusions

FORMATTING RULES:
- Use bold headers for each section
- Keep paragraphs short (3-4 sentences maximum)
- Use bullet points liberally
- Include specific numbers, settings, products, recommendations
- Organize technical details in tables or bullet hierarchies if appropriate
- Break complex explanations into steps or numbered lists

Make this easy to scan for someone who is impatient but wants comprehensive information. Prioritize quick understanding over lengthy explanations.

Total length: 500-700 words.`,
};

/**
 * Returns the appropriate max_tokens value based on summary length
 * @param length The desired summary length
 * @returns Number of tokens to allocate
 */
const getMaxTokensForLength = (length: SummaryLength): number => {
  // Allocate tokens based on summary length
  const tokenLimits = {
    short: 300, // For 150-200 word summaries
    medium: 500, // For 250-350 word summaries
    long: 1200, // For 500-800 word summaries
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
  length: SummaryLength = 'medium'
): Promise<string> => {
  // Get user's API key if available, otherwise use default
  const apiKey = getUserApiKey() || DEFAULT_API_KEY;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer':
          typeof window !== 'undefined'
            ? window.location.origin
            : 'https://snip.vercel.app',
        'X-Title': 'Snip - YouTube Video Summarizer',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: SUMMARY_PROMPTS[length],
          },
          {
            role: 'user',
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
        throw new Error('API_KEY_ERROR');
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
    if (error instanceof Error && error.message === 'API_KEY_ERROR') {
      throw error; // Re-throw API key errors to be handled specifically
    }

    console.error('Error summarizing transcript:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to generate summary. Please try again later.'
    );
  }
};

/**
 * Check if the given API key is valid by making a minimal API call
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer':
          typeof window !== 'undefined'
            ? window.location.origin
            : 'https://snip.vercel.app',
        'X-Title': 'Snip - YouTube Video Summarizer',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1, // Minimal tokens to validate key
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
};

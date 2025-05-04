/**
 * Function to summarize text using OpenRouter API (llama-4-maverick:free)
 */
import { getUserApiKey, getCachedSummary } from '@/utils/localStorage';

// Define the summary length type
export type SummaryLength = 'short' | 'medium' | 'long';

// Default OpenRouter API key to use
// Next.js requires using `NEXT_PUBLIC_` prefix for client-side accessible env vars
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model to use
const MODEL = 'meta-llama/llama-4-maverick:free';

// Define length parameters for each summary type
export const SUMMARY_PARAMETERS = {
  short: {
    wordCount: { min: 100, target: 175, max: 225 },
    tokens: 350,
  },
  medium: {
    wordCount: { min: 250, target: 300, max: 375 },
    tokens: 550,
  },
  long: {
    wordCount: { min: 500, target: 600, max: 800 },
    tokens: 1000,
  },
};

// Prompts for different summary lengths
const SUMMARY_PROMPTS = {
  short: `Create a SCANNABLE summary of this YouTube transcript. Focus on FAST readability.

START with a one-sentence TL;DR (max 15 words).

Then provide 3-5 KEY POINTS in bullet format, each point should be:
- Concise (5-10 words each)
- Start with a bold heading or action verb
- Contain the most critical information only

If there are specific numbers, product names, or technical details, include ONLY the most essential ones.

IMPORTANT: Your summary MUST be between ${SUMMARY_PARAMETERS.short.wordCount.min}-${SUMMARY_PARAMETERS.short.wordCount.max} words total. Aim for ${SUMMARY_PARAMETERS.short.wordCount.target} words.
Structure it for someone who will only spend 30 seconds reading.

FORMATTING RULES:
- DO NOT include phrases like "Here's a summary of the video" or "In this video"
- DO NOT include timestamps like [0:45] or (12:30)
- DO NOT start with "Summary:" or "Video summary:"
- Jump directly into the content with the TL;DR`,

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

IMPORTANT: Your summary MUST be between ${SUMMARY_PARAMETERS.medium.wordCount.min}-${SUMMARY_PARAMETERS.medium.wordCount.max} words total. Aim for ${SUMMARY_PARAMETERS.medium.wordCount.target} words.
The medium summary should provide significantly more detail than a short summary.

FORMATTING RULES:
- DO NOT include phrases like "Here's a summary of the video" or "In this video"
- DO NOT include timestamps like [0:45] or (12:30)
- DO NOT start with "Summary:" or "Video summary:"
- Jump directly into the content with the TL;DR section`,

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
- DO NOT include phrases like "Here's a summary of the video" or "In this video"
- DO NOT include timestamps like [0:45] or (12:30)
- DO NOT start with "Summary:" or "Video summary:"
- Jump directly into the content with the TL;DR section

Make this easy to scan for someone who is impatient but wants comprehensive information. Prioritize quick understanding over lengthy explanations.

IMPORTANT: Your summary MUST be between ${SUMMARY_PARAMETERS.long.wordCount.min}-${SUMMARY_PARAMETERS.long.wordCount.max} words total. Aim for ${SUMMARY_PARAMETERS.long.wordCount.target} words.
The long summary must provide significantly more detail than a medium summary.`,
};

/**
 * Returns the appropriate max_tokens value based on summary length
 */
const getMaxTokensForLength = (length: SummaryLength): number => {
  return SUMMARY_PARAMETERS[length].tokens;
};

/**
 * Count words in a text string
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

/**
 * Validate that a summary meets the word count requirements for its length
 * @returns an object with validation result and any issues found
 */
export const validateSummaryLength = (
  summary: string,
  length: SummaryLength
): { valid: boolean; issue?: string; wordCount: number } => {
  const wordCount = countWords(summary);
  const { min, max } = SUMMARY_PARAMETERS[length].wordCount;

  if (wordCount < min) {
    return {
      valid: false,
      issue: `Summary is too short (${wordCount} words) for ${length} length (min: ${min})`,
      wordCount,
    };
  }

  // Allow a bit of flexibility on the max (270 words instead of 225 for short, etc.)
  if (wordCount > max + 45) {
    return {
      valid: false,
      issue: `Summary is too long (${wordCount} words) for ${length} length (max: ${max})`,
      wordCount,
    };
  }

  return { valid: true, wordCount };
};

/**
 * Helper function to make API calls to OpenRouter
 */
const callOpenRouterApi = async (
  prompt: string,
  transcript: string,
  length: SummaryLength,
  temperature: number = 0.75
): Promise<string> => {
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
          { role: 'system', content: prompt },
          { role: 'user', content: transcript },
        ],
        temperature,
        max_tokens: getMaxTokensForLength(length),
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific rate limit and authorization errors
      if (response.status === 429 || response.status === 401) {
        const errorMessage = errorData.error?.message || '';
        const isRateLimitError =
          errorMessage.includes('Rate limit exceeded') ||
          errorMessage.includes('free-models-per-day');

        throw new Error(
          `API_KEY_ERROR:${
            isRateLimitError ? 'RATE_LIMIT' : 'INVALID'
          }:${errorMessage}`
        );
      }

      throw new Error(
        errorData.error?.message ||
          `OpenRouter API returned ${response.status}: ${response.statusText}`
      );
    }

    // Parse the response data
    const data = await response.json();

    // Check if the response contains an error (even with a 200 status code)
    if (data.error) {
      console.error('API returned an error with 200 status:', data);

      // Extract error message
      const errorMessage = data.error.message || JSON.stringify(data.error);

      // Check if it's a rate limit error
      const isRateLimitError =
        errorMessage.includes('Rate limit') ||
        errorMessage.includes('free-models') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('credits');

      // Handle as an API key error
      throw new Error(
        `API_KEY_ERROR:${
          isRateLimitError ? 'RATE_LIMIT' : 'ERROR'
        }:${errorMessage}`
      );
    }

    // Validate the response structure with robust checks
    if (!data) {
      throw new Error('Empty response received from API');
    }

    if (
      !data.choices ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0
    ) {
      // This might be a rate limit error with a different format
      if (data.user_id) {
        // API returned user ID but no choices, which often happens with rate limits
        throw new Error(
          `API_KEY_ERROR:RATE_LIMIT:Your account (${data.user_id}) has reached its usage limit`
        );
      }

      console.error('Unexpected API response format:', data);
      throw new Error('Invalid response format: missing choices array');
    }

    const firstChoice = data.choices[0];
    if (!firstChoice || !firstChoice.message) {
      console.error('Unexpected API response format:', data);
      throw new Error(
        'Invalid response format: missing message in first choice'
      );
    }

    // Now we can safely access the content
    return (
      firstChoice.message.content?.trim() ||
      "Sorry, I couldn't generate a summary for this video."
    );
  } catch (error) {
    // Rethrow API_KEY_ERROR but provide better error messages for other errors
    if (error instanceof Error && error.message.startsWith('API_KEY_ERROR')) {
      throw error;
    }

    console.error('OpenRouter API error:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to communicate with the OpenRouter API');
  }
};

/**
 * Summarize the given transcript using OpenRouter API
 * @param transcript The video transcript to summarize
 * @param length The desired length of the summary
 * @param videoId Optional video ID for length comparison with other cached summaries
 * @param attemptCount Used internally to track regeneration attempts and prevent infinite loops
 */
export const summarizeTranscript = async (
  transcript: string,
  length: SummaryLength = 'medium',
  videoId?: string,
  attemptCount: number = 1
): Promise<string> => {
  // Limit regeneration attempts
  const MAX_ATTEMPTS = 2;
  if (attemptCount > MAX_ATTEMPTS) {
    console.warn(
      `Reached maximum attempts for summarization. Using best result.`
    );
    try {
      return await callOpenRouterApi(
        SUMMARY_PROMPTS[length],
        transcript,
        length,
        0.5
      );
    } catch (error) {
      console.error('Error in fallback summarization:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to generate summary after multiple attempts.');
    }
  }

  // Add extra instructions for length requirements
  let extraInstruction = '';
  const isRetry = attemptCount > 1;
  let minimumRequiredWords = 0;

  // Get word count requirements based on existing summaries
  if (videoId) {
    // For medium summaries, compare with short
    if (length === 'medium') {
      const shortSummary = getCachedSummary(videoId, 'short');
      if (shortSummary) {
        const shortWordCount = countWords(shortSummary);
        minimumRequiredWords = Math.max(
          SUMMARY_PARAMETERS.medium.wordCount.min,
          shortWordCount + 75
        );
        extraInstruction = isRetry
          ? `\n\nCRITICAL: Your medium summary MUST be AT LEAST ${minimumRequiredWords} words (the short summary is ${shortWordCount} words).`
          : `\n\nIMPORTANT: Your medium summary should be AT LEAST ${minimumRequiredWords} words (the short summary is ${shortWordCount} words).`;
      }
    }
    // For long summaries, compare with medium
    else if (length === 'long') {
      const mediumSummary = getCachedSummary(videoId, 'medium');
      if (mediumSummary) {
        const mediumWordCount = countWords(mediumSummary);
        minimumRequiredWords = Math.max(
          SUMMARY_PARAMETERS.long.wordCount.min,
          mediumWordCount + 150
        );
        extraInstruction = isRetry
          ? `\n\nCRITICAL: Your long summary MUST be AT LEAST ${minimumRequiredWords} words (the medium summary is ${mediumWordCount} words).`
          : `\n\nIMPORTANT: Your long summary should be AT LEAST ${minimumRequiredWords} words (the medium summary is ${mediumWordCount} words).`;
      }
    }
  }

  try {
    // Get the summary
    const summary = await callOpenRouterApi(
      SUMMARY_PROMPTS[length] + extraInstruction,
      transcript,
      length,
      isRetry ? 0.5 : 0.75
    );

    // Validate length requirements
    const validation = validateSummaryLength(summary, length);

    // Check if minimum word requirements are met
    if (
      minimumRequiredWords > 0 &&
      validation.wordCount < minimumRequiredWords
    ) {
      console.warn(
        `Summary too short (${validation.wordCount}/${minimumRequiredWords} words). Regenerating...`
      );
      return summarizeTranscript(transcript, length, videoId, attemptCount + 1);
    }

    // Check length relationships between summaries
    if (videoId && validation.valid) {
      // Medium should be sufficiently longer than short
      if (length === 'medium') {
        const shortSummary = getCachedSummary(videoId, 'short');
        if (shortSummary) {
          const shortWordCount = countWords(shortSummary);
          if (validation.wordCount < shortWordCount * 1.3) {
            console.warn(
              `Medium summary not significantly longer than short summary. Regenerating...`
            );
            return summarizeTranscript(
              transcript,
              length,
              videoId,
              attemptCount + 1
            );
          }
        }
      }

      // Long should be sufficiently longer than medium
      if (length === 'long') {
        const mediumSummary = getCachedSummary(videoId, 'medium');
        if (mediumSummary) {
          const mediumWordCount = countWords(mediumSummary);
          if (validation.wordCount < mediumWordCount * 1.3) {
            console.warn(
              `Long summary not significantly longer than medium summary. Regenerating...`
            );
            return summarizeTranscript(
              transcript,
              length,
              videoId,
              attemptCount + 1
            );
          }
        }
      }
    }

    return summary;
  } catch (error) {
    // Pass through specific errors
    if (error instanceof Error) {
      // Pass through API key errors
      if (error.message.startsWith('API_KEY_ERROR')) {
        throw error;
      }

      // For other errors, provide meaningful error messages
      if (
        error.message.includes('Invalid response format') ||
        error.message.includes('Empty response')
      ) {
        console.error('API response error:', error);
        throw new Error(`Failed to generate summary: ${error.message}`);
      }
    }

    console.error('Error summarizing transcript:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to generate summary. Please try again later.');
  }
};

/**
 * Validate an API key
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

    // For key validation, just checking if response is OK is sufficient
    if (!response.ok) {
      // Try to get more details from the error
      const errorData = await response.json().catch(() => ({}));
      console.warn(
        'API key validation failed:',
        errorData.error?.message || response.statusText
      );
      return false;
    }

    // No need to validate the response structure for key validation
    return true;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
};

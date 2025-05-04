# SNIP – Summarize Any YouTube Video in 30 Seconds

## Overview

![Snip Logo](public/snip-logo.svg)

Snip is a lightweight, AI-powered web app that summarizes any YouTube video into a friendly, spoken-style script that takes just 30 seconds to read. It's fully free, fast, and requires no login or account.

## Live Demo

Try it at: [https://snip-virid.vercel.app/](https://snip-virid.vercel.app/)

## What It Does:

- User pastes a YouTube video link
- The app extracts the transcript
- Sends the transcript to an AI model (LLaMA 4 Maverick via OpenRouter)
- Returns a natural, casual summary under 30 seconds long
- Plays the summary aloud using the browser's voice synthesis
- Stores results locally to avoid duplicate calls
- Provides three different summary lengths to choose from
- If API rate limits are hit, users can add their own OpenRouter key

## Tech Stack:

Frontend: Next.js 15 with App Router + TailwindCSS 4  
Hosting: Vercel (Free tier)  
AI Model: OpenRouter (meta-llama/llama-4-maverick:free)  
Transcript Extraction: youtube-caption-extractor  
Text-to-Speech: `window.speechSynthesis` (native browser support)  
Local Storage: Used to cache results and store optional user API key  
No backend database or user login

## Project Structure:

- `/app/page.tsx` - Main UI page
- `/app/layout.tsx` - Root layout with metadata
- `/components/SummaryCard.tsx` - Summary display UI and Play button
- `/components/summary/SummaryContent.tsx` - Markdown rendering with styling
- `/components/ApiKeyInput.tsx` - Modal for pasting your own API key
- `/lib/getTranscript.ts` - Logic to extract YouTube transcript
- `/lib/summarize.ts` - Logic to send transcript to OpenRouter
- `/utils/localStorage.ts` - Helper functions for caching + key management
- `/app/api/` - API routes for fetching video information and transcripts

## Local Development:

Run the app locally with:

```
npm install
npm run dev
```

Then open: [http://localhost:3000](http://localhost:3000)

## Environment Setup:

Create a file called `.env.local` and add your OpenRouter API key:

```
NEXT_PUBLIC_OPENROUTER_API_KEY=your-api-key-here
```

## Summary Lengths:

The app offers three summary lengths, each with specific word count ranges:

- **Short**: Concise overview (100-225 words) highlighting key points
- **Medium**: Thorough yet conversational summary (250-375 words)
- **Long**: Comprehensive explanation (500-800 words) with more detail

All summaries maintain a natural, conversational tone and are formatted with Markdown for better readability.

## Rate Limit Handling:

The default OpenRouter free API key has a limit of approximately 10 requests per day.  
When rate limits are reached, users are prompted to add their own OpenRouter API key.  
Adding a personal API key gives users access to 1000 free requests per day.  
All keys are stored only in the user's browser via localStorage for privacy.

## Accessibility Features:

- Voice selection for text-to-speech
- Adjustable playback settings
- Readable text formatting with proper contrast
- Keyboard-accessible controls
- Well-structured headings and sections

## Deployment:

Deploy using Vercel:

```
vercel --prod
```

## Credits:

Built by [Aga Kadela](https://github.com/agakadela) for a [YouTube coding project](https://www.youtube.com/@aga-kadela). AI model provided by [OpenRouter](https://openrouter.ai) (meta-llama/llama-4-maverick:free).

## Use Your Own API Key:

1. Generate a free OpenRouter key at: [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up with Google, GitHub, or email (no credit card required)
3. Copy your API key starting with `sk-or-v1-...`
4. Use it in the app when prompted or add to your `.env.local` file for development

**Recommended:** Set a usage cap under Settings > Usage to avoid billing surprises.

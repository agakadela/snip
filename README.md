# SNIP – Summarize Any YouTube Video in 30 Seconds

## Overview

Snip is a lightweight, AI-powered web app that summarizes any YouTube video into a friendly, spoken-style script that takes just 30 seconds to read. It's fully free, fast, and requires no login or account.

## Live Demo (Coming Soon)

Try it at: [https://snip.vercel.app](https://snip.vercel.app)

## What It Does:

- User pastes a YouTube video link
- The app extracts the transcript
- Sends the transcript to an AI model (LLaMA 4 Maverick via OpenRouter)
- Returns a natural, casual summary under 30 seconds long
- Plays the summary aloud using the browser’s voice engine
- Stores results locally to avoid duplicate calls
- If API rate limits are hit, users can paste their own OpenRouter key

## Tech Stack:

Frontend: Next.js 15 with App Router + TailwindCSS  
Hosting: Vercel (Free tier)  
AI Model: OpenRouter (meta-llama/llama-4-maverick:free)  
Transcript Extraction: youtube-transcript-api  
Text-to-Speech: `window.speechSynthesis` (native browser support)  
Local Storage: Used to cache results and store optional user API key  
No backend database or user login

## Project Structure:

- `/app page.tsx` - Main UI page
- `/components SummaryCard.tsx` - Summary display UI and Play button
- `ApiKeyInput.tsx` - Modal for pasting your own API key
- `/lib getTranscript.ts` - Logic to extract YouTube transcript
- `summarize.ts` - Logic to send transcript to OpenRouter
- `/utils localStorage.ts` - Helper functions for caching + key management
- `/public favicon.ico` - App icon
- `.env.local` - Contains OPENROUTER_API_KEY

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
OPENROUTER_API_KEY=your-api-key-here
```

## Prompt Used:

> "Summarize the following YouTube transcript into a natural, spoken-style script that takes no more than 30 seconds to read aloud. Use casual, friendly language. Avoid robotic or technical phrasing."

## Rate Limit Handling:

The app allows a few requests via the developer's built-in key.  
If too many people use it at once (e.g., from a YouTube spike), users are prompted to paste their own OpenRouter API key.  
Their key is saved only in their browser via localStorage.  
No data is stored or shared server-side.

## Deployment:

Deploy in one click using Vercel CLI:

```
vercel --prod
```

## Credits:

Built by [Aga Kadela](https://github.com/agakadela) for a [YouTube coding project](https://www.youtube.com/@aga-kadela). AI model provided by [OpenRouter](https://openrouter.ai) (meta-llama/llama-4-maverick:free).

## Use Your Own API Key:

Generate a free OpenRouter key at: [https://openrouter.ai](https://openrouter.ai)  
**Recommended:** Set a usage cap under Settings > Usage to avoid billing surprises.

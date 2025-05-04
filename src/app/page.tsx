'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { extractVideoId, getTranscript } from '@/lib/getTranscript';
import { summarizeTranscript, SummaryLength } from '@/lib/summarize';
import {
  getCachedSummary,
  cacheSummary,
  getAvailableSummaryLengths,
} from '@/utils/localStorage';
import SummaryCard from '@/components/SummaryCard';
import ApiKeyInput from '@/components/ApiKeyInput';

export default function Home() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [availableLengths, setAvailableLengths] = useState<SummaryLength[]>([]);

  // Validate URL as user types
  useEffect(() => {
    if (!url) {
      setVideoId(null);
      return;
    }

    const id = extractVideoId(url);
    setVideoId(id);
    setError(id ? null : 'Invalid YouTube URL');
  }, [url]);

  // Try to fetch the video title if we have a valid ID
  useEffect(() => {
    if (!videoId) {
      setVideoTitle(null);
      return;
    }

    const fetchVideoTitle = async () => {
      try {
        // Use our own API route to avoid Content Security Policy issues
        const response = await fetch(`/api/video-info?videoId=${videoId}`);
        const data = await response.json();
        setVideoTitle(data.title);
      } catch (error) {
        console.error('Error fetching video title:', error);
        setVideoTitle('');
      }
    };

    fetchVideoTitle();

    // Check for available cached summary lengths
    const availableSummaryLengths = getAvailableSummaryLengths(videoId);
    setAvailableLengths(availableSummaryLengths);

    // If we have a cached summary for the current length, use it
    const cached = getCachedSummary(videoId, summaryLength);
    if (cached) {
      setSummary(cached);
    }
  }, [videoId, summaryLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    // Check if we already have a cached summary for the selected length
    const cached = getCachedSummary(videoId, summaryLength);

    if (cached) {
      setSummary(cached);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      // 1. Get the transcript
      const transcript = await getTranscript(videoId);

      // 2. Summarize the transcript with the selected length
      const summaryText = await summarizeTranscript(
        transcript,
        summaryLength,
        videoId
      );

      // 4. Cache and display the summary if it passes validation
      cacheSummary(videoId, summaryText, summaryLength);

      // Update the available lengths
      setAvailableLengths(
        [...availableLengths, summaryLength].filter(
          (value, index, self) => self.indexOf(value) === index
        )
      );

      setSummary(summaryText);
    } catch (err) {
      console.error('Error in summarization process:', err);

      // Handle different types of errors with appropriate messages
      if (err instanceof Error) {
        // Handle API key errors
        if (err.message.startsWith('API_KEY_ERROR')) {
          // Parse the error message to get details
          const errorParts = err.message.split(':');
          const errorType = errorParts[1] || '';
          const errorDetails = errorParts.slice(2).join(':');

          setShowApiKeyModal(true);

          if (errorType === 'RATE_LIMIT') {
            if (
              errorDetails.includes('user_id') ||
              errorDetails.includes('account')
            ) {
              setError(
                `You've reached the API usage limit. Please provide your own OpenRouter API key to continue.`
              );
            } else {
              setError(
                `Rate limit exceeded: ${
                  errorDetails ||
                  'Please provide your own OpenRouter API key to continue.'
                }`
              );
            }
          } else {
            setError(
              'API key is invalid or has expired. Please provide your own OpenRouter API key.'
            );
          }
        }
        // Handle other errors as before...
        else if (
          err.message.includes('Invalid response format') ||
          err.message.includes('Empty response')
        ) {
          setError(
            'Could not generate summary. This is likely due to API rate limits. Try adding your own API key.'
          );
          setShowApiKeyModal(true);
        }
        // Handle other known errors
        else if (err.message.includes('Failed to generate summary')) {
          setError(err.message);
          // If it seems like a rate limit issue, show the API key modal
          if (
            err.message.toLowerCase().includes('rate') ||
            err.message.toLowerCase().includes('limit') ||
            err.message.toLowerCase().includes('quota')
          ) {
            setShowApiKeyModal(true);
          }
        }
        // Handle unexpected errors
        else {
          setError('Failed to summarize the video. Please try again later.');
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeySuccess = () => {
    // Retry the summarization after a successful API key entry
    if (videoId) {
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-white flex flex-col items-center px-4 py-12 sm:py-16'>
      <header className='w-full max-w-2xl flex flex-col items-center mb-12'>
        <div className='flex items-center gap-2 mb-6'>
          <Image
            src='/snip-logo.svg'
            alt='Snip Logo'
            width={40}
            height={40}
            className='w-10 h-10'
            priority
          />
          <h1 className='text-3xl font-bold text-white'>Snip</h1>
        </div>
        <p className='text-zinc-400 text-center mb-2'>
          Extract the essence of any YouTube video in 30 seconds or less.
        </p>
        <p className='text-zinc-500 text-sm text-center'>
          Paste a YouTube link, get a spoken-style summary you can read or play.
        </p>
      </header>

      <main className='w-full max-w-2xl flex flex-col items-center gap-8'>
        <form onSubmit={handleSubmit} className='w-full animate-fade-in-up'>
          {/* Input field with submit button */}
          <div className='relative'>
            <input
              type='text'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='Paste a YouTube URL'
              className={`
                w-full px-4 py-3 pr-24 rounded-lg bg-zinc-900 border 
                ${
                  error
                    ? 'border-red-500'
                    : 'border-zinc-700 focus:border-indigo-500'
                } 
                text-white placeholder:text-zinc-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all
              `}
            />
            <button
              type='submit'
              disabled={!videoId || isLoading}
              className={`
                absolute right-2 top-1/2 transform -translate-y-1/2
                px-4 py-1.5 rounded-md bg-indigo-600 text-white font-medium
                hover:bg-indigo-700 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                <div className='flex items-center gap-1'>
                  <svg
                    className='animate-spin h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    ></path>
                  </svg>
                  <span>Snipping</span>
                </div>
              ) : (
                'Snip It'
              )}
            </button>
          </div>

          {/* Summary length selector with cached indicators */}
          <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
            <div className='text-xs text-zinc-500'>Summary length:</div>
            <div className='flex gap-1'>
              {['short', 'medium', 'long'].map((length) => {
                const isCached = availableLengths.includes(
                  length as SummaryLength
                );
                return (
                  <button
                    key={length}
                    type='button'
                    onClick={() => setSummaryLength(length as SummaryLength)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors flex items-center ${
                      summaryLength === length
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {isCached && (
                      <span
                        className='w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5'
                        aria-hidden='true'
                      ></span>
                    )}
                    <span>
                      {length.charAt(0).toUpperCase() +
                        length.slice(1).replace('-', ' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {videoId && !error && (
            <p className='text-green-500 text-sm mt-2'>Valid YouTube URL ✓</p>
          )}
        </form>

        {isLoading && (
          <div className='flex flex-col items-center justify-center p-10'>
            <div className='flex items-center justify-center gap-2'>
              <div className='h-3 w-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
              <div className='h-3 w-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
              <div className='h-3 w-3 bg-indigo-500 rounded-full animate-bounce'></div>
            </div>
            <p className='mt-4 text-zinc-400 text-sm'>Summarizing video...</p>
          </div>
        )}

        {summary && !isLoading && videoId && (
          <div className='w-full animate-fade-in-up transition-all duration-300'>
            <SummaryCard
              summary={summary}
              videoId={videoId}
              videoTitle={videoTitle || undefined}
            />
          </div>
        )}

        <div className='w-full border-t border-zinc-800 mt-4 pt-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-zinc-900/60 rounded-lg p-5 border border-zinc-800'>
              <div className='flex items-center justify-center w-10 h-10 rounded-full bg-indigo-900/30 mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-5 h-5 text-indigo-400'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                Fast & Privacy-Focused
              </h3>
              <p className='text-zinc-400 text-sm'>
                Everything runs client-side with no data storage. Your videos
                stay private.
              </p>
            </div>

            <div className='bg-zinc-900/60 rounded-lg p-5 border border-zinc-800'>
              <div className='flex items-center justify-center w-10 h-10 rounded-full bg-indigo-900/30 mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-5 h-5 text-indigo-400'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                Conversational Style
              </h3>
              <p className='text-zinc-400 text-sm'>
                Summaries are crafted in natural, spoken language that&apos;s
                easy to understand.
              </p>
            </div>

            <div className='bg-zinc-900/60 rounded-lg p-5 border border-zinc-800'>
              <div className='flex items-center justify-center w-10 h-10 rounded-full bg-indigo-900/30 mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-5 h-5 text-indigo-400'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-medium text-zinc-200 mb-2'>
                Listen On-the-Go
              </h3>
              <p className='text-zinc-400 text-sm'>
                Play the summary aloud with natural-sounding speech when
                you&apos;re not able to read.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className='mt-16 text-zinc-500 text-sm text-center'>
        <p>Built with Next.js and OpenRouter. No login required.</p>
        <p className='mt-1'>Summaries are cached locally for faster access.</p>
      </footer>

      <ApiKeyInput
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={handleApiKeySuccess}
      />
    </div>
  );
}

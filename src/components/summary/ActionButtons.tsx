import React, { useState } from 'react';

type ActionButtonsProps = {
  videoId: string;
  readTimeSeconds: number;
  wordCount: number;
  onPlay: () => void;
};

export default function ActionButtons({
  videoId,
  readTimeSeconds,
  wordCount,
  onPlay,
}: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Format reading time
  const readTimeFormatted =
    readTimeSeconds < 60
      ? `${readTimeSeconds}s`
      : `${Math.floor(readTimeSeconds / 60)}m ${readTimeSeconds % 60}s`;

  const handleCopy = () => {
    // Create YouTube video URL
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(videoUrl);

    // Set copied state to true
    setCopied(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className='flex items-center justify-between mb-5'>
      <div className='flex items-center gap-3'>
        {/* Meta info about the summary */}
        <div className='flex items-center gap-2 text-sm'>
          <span className='inline-flex items-center px-2.5 py-1.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/30 shadow-sm'>
            <svg
              className='w-3.5 h-3.5 mr-1.5 text-indigo-400'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10' />
              <polyline points='12 6 12 12 16 14' />
            </svg>
            {readTimeFormatted} read
          </span>

          <span className='inline-flex items-center px-2.5 py-1.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/30 shadow-sm'>
            <svg
              className='w-3.5 h-3.5 mr-1.5 text-indigo-400'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
            </svg>
            {wordCount} words
          </span>
        </div>
      </div>

      <div className='flex gap-2'>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`p-2 rounded-md ${
            copied
              ? 'text-green-400 bg-zinc-800/80 border-green-700/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80'
          } transition-colors duration-200 border ${
            copied
              ? 'border-green-700/50'
              : 'border-transparent hover:border-zinc-700/50'
          }`}
          title={copied ? 'Copied!' : 'Copy video link'}
        >
          {copied ? (
            <svg
              className='w-4 h-4'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M20 6L9 17l-5-5' />
            </svg>
          ) : (
            <svg
              className='w-4 h-4'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' />
              <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' />
            </svg>
          )}
        </button>

        {/* Open in YouTube button */}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target='_blank'
          rel='noopener noreferrer'
          className='p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors duration-200 border border-transparent hover:border-zinc-700/50'
          title='Watch on YouTube'
        >
          <svg
            className='w-4 h-4'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M15 10l5 5-5 5' />
            <path d='M4 4v7a4 4 0 0 0 4 4h11' />
          </svg>
        </a>

        {/* Play button in action bar (small version) */}
        <button
          onClick={onPlay}
          className='p-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors duration-200 border border-transparent hover:border-zinc-700/50'
          title='Listen'
        >
          <svg
            className='w-4 h-4'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5' />
            <path d='M15.54 8.46a5 5 0 0 1 0 7.07' />
            <path d='M19.07 4.93a10 10 0 0 1 0 14.14' />
          </svg>
        </button>
      </div>
    </div>
  );
}

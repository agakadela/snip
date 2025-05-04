import React from 'react';

type PlayButtonProps = {
  isSpeaking: boolean;
  onClick: () => void;
};

export default function PlayButton({ isSpeaking, onClick }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md
        ${
          isSpeaking
            ? 'bg-red-600/80 hover:bg-red-600 text-white'
            : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
        }
        text-sm font-medium transition-all duration-200
        shadow-sm hover:shadow-md border border-transparent
        hover:border-indigo-500/50 hover:-translate-y-0.5
        active:translate-y-0 active:shadow-sm
      `}
    >
      {isSpeaking ? (
        <>
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
            <rect x='6' y='4' width='4' height='16' />
            <rect x='14' y='4' width='4' height='16' />
          </svg>
          Stop
        </>
      ) : (
        <>
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
            <polygon points='5 3 19 12 5 21 5 3' />
          </svg>
          Listen
        </>
      )}
    </button>
  );
}

import React from 'react';

type PlayButtonProps = {
  isSpeaking: boolean;
  onClick: () => void;
};

export default function PlayButton({ isSpeaking, onClick }: PlayButtonProps) {
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-medium transition-colors duration-200'
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

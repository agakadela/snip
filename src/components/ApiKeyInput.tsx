'use client';

import { useState } from 'react';
import { saveUserApiKey } from '@/utils/localStorage';
import { validateApiKey } from '@/lib/summarize';

type ApiKeyInputProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ApiKeyInput({
  isOpen,
  onClose,
  onSuccess,
}: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateApiKey(apiKey);

      if (isValid) {
        saveUserApiKey(apiKey);
        onSuccess();
        onClose();
      } else {
        setError('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Error validating API key. Please try again.');
      console.error('API key validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div
        className='bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-xl font-semibold text-white mb-4'>
          API Key Required
        </h2>

        <p className='text-zinc-300 mb-3'>
          The default API key has reached its usage limit. Please enter your own
          OpenRouter API key to continue using Snip.
        </p>

        <div className='bg-indigo-900/30 p-3 rounded-lg border border-indigo-800/50 mb-4'>
          <p className='text-zinc-200 text-sm mb-1 font-medium'>
            Why am I seeing this?
          </p>
          <p className='text-zinc-300 text-sm mb-2'>
            Free OpenRouter API keys have a limit of 10 requests per day. Adding
            your own free key will give you 1000 free requests per day.
          </p>
          <p className='text-zinc-300 text-sm'>
            <strong>Your data remains private</strong> - your key is stored
            locally in your browser only.
          </p>
        </div>

        <div className='bg-green-900/20 p-3 rounded-lg border border-green-800/40 mb-4'>
          <p className='text-zinc-200 text-sm font-medium mb-1'>
            How to get your free API key:
          </p>
          <ol className='text-zinc-300 text-sm list-decimal pl-5 space-y-1'>
            <li>
              Go to{' '}
              <a
                href='https://openrouter.ai/keys'
                target='_blank'
                rel='noopener noreferrer'
                className='text-indigo-400 hover:text-indigo-300 underline'
              >
                OpenRouter.ai
              </a>
            </li>
            <li>Sign up with Google, GitHub, or email</li>
            <li>No credit card required for free tier</li>
            <li>Copy your API key and paste it below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='apiKey'
              className='block text-sm font-medium text-zinc-400 mb-1'
            >
              OpenRouter API Key
            </label>
            <input
              id='apiKey'
              type='password'
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder='sk-or-v1-...'
              className='w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
            {error && <p className='mt-2 text-red-500 text-sm'>{error}</p>}
          </div>

          <div className='flex items-center justify-between mt-6'>
            <a
              href='https://openrouter.ai/keys'
              target='_blank'
              rel='noopener noreferrer'
              className='text-indigo-400 hover:text-indigo-300 text-sm'
            >
              Get an API key →
            </a>

            <div className='flex gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isValidating}
                className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                {isValidating ? (
                  <>
                    <svg
                      className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
                    Validating...
                  </>
                ) : (
                  'Save Key'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

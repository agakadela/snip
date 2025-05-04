import React from 'react';

type VoiceSelectorProps = {
  selectedVoice: string;
  voices: SpeechSynthesisVoice[];
  onChange: (voice: string) => void;
};

export default function VoiceSelector({
  selectedVoice,
  voices,
  onChange,
}: VoiceSelectorProps) {
  if (voices.length === 0) {
    return null;
  }

  return (
    <div className='flex items-center'>
      <label
        htmlFor='voice-select'
        className='text-sm mr-2.5 text-zinc-300 font-medium'
      >
        Voice:
      </label>
      <select
        id='voice-select'
        value={selectedVoice}
        onChange={(e) => onChange(e.target.value)}
        className='
          bg-zinc-800/80 text-zinc-200 text-sm 
          rounded-md border border-zinc-700/70 
          px-3 py-1.5 
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
          appearance-none cursor-pointer
          pr-8 pl-3
          shadow-sm
          transition-all duration-200
          hover:border-zinc-600
          relative
        '
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237f8ea3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1rem',
        }}
      >
        {voices.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {voice.name.includes('Google')
              ? voice.name.replace('Google ', '')
              : voice.name.split(' (')[0]}
          </option>
        ))}
      </select>
    </div>
  );
}

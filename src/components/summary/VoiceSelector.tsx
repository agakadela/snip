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
      <label htmlFor='voice-select' className='text-sm mr-2 text-zinc-400'>
        Voice:
      </label>
      <select
        id='voice-select'
        value={selectedVoice}
        onChange={(e) => onChange(e.target.value)}
        className='bg-zinc-800 text-zinc-200 text-sm rounded-md border border-zinc-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500'
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

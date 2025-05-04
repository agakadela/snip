'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getVoicePreference, saveVoicePreference } from '@/utils/localStorage';
import SummaryContent from './summary/SummaryContent';
import ActionButtons from './summary/ActionButtons';
import VoiceSelector from './summary/VoiceSelector';
import PlayButton from './summary/PlayButton';

type SummaryCardProps = {
  summary: string;
  videoId: string;
  videoTitle?: string;
};

// Helper function to strip markdown formatting
const stripMarkdown = (markdown: string): string => {
  // Replace code blocks
  let text = markdown.replace(
    /```[\s\S]*?```/g,
    'Code block omitted for speech.'
  );

  // Replace inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Replace headers
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Replace bold and italic
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');

  // Replace links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

  // Replace images
  text = text.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, 'Image: $1');

  // Replace bullet points
  text = text.replace(/^\s*[-*+]\s+(.+)$/gm, '• $1');

  // Replace numbered lists
  text = text.replace(/^\s*\d+\.\s+(.+)$/gm, '$1');

  // Replace horizontal rules
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, 'Section break.');

  return text;
};

export default function SummaryCard({
  summary,
  videoId,
  videoTitle,
}: SummaryCardProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    const initVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    initVoices();
    window.speechSynthesis.addEventListener('voiceschanged', initVoices);

    const savedVoice = getVoicePreference();
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', initVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Get high-quality voices
  const highQualityVoices = useMemo(() => {
    if (availableVoices.length === 0) return [];

    const preferredVoices = [
      'Google US English',
      'Google UK English Female',
      'Google UK English Male',
      'Daniel (English (United Kingdom))',
      'Samantha',
      'Alex',
    ];

    const filtered = availableVoices.filter((voice) =>
      preferredVoices.some(
        (name) => voice.name === name || voice.name.includes(name)
      )
    );

    return filtered.length > 0
      ? filtered.sort((a, b) => {
          const aIndex = preferredVoices.findIndex(
            (name) => a.name === name || a.name.includes(name)
          );
          const bIndex = preferredVoices.findIndex(
            (name) => b.name === name || b.name.includes(name)
          );
          return aIndex - bIndex;
        })
      : availableVoices.filter((voice) => voice.lang.includes('en'));
  }, [availableVoices]);

  // Set default voice when available
  useEffect(() => {
    if (highQualityVoices.length > 0 && !selectedVoice) {
      const bestVoice = highQualityVoices[0];
      setSelectedVoice(bestVoice.name);
      saveVoicePreference(bestVoice.name);
    }
  }, [highQualityVoices, selectedVoice]);

  // Play summary function
  const playSummary = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown before speaking
    const cleanText = stripMarkdown(summary);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Set voice and parameters
    if (selectedVoice) {
      const voice = availableVoices.find((v) => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    } else if (highQualityVoices.length > 0) {
      utterance.voice = highQualityVoices[0];
    }

    // Base settings
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    // Optimize for specific voices
    if (utterance.voice) {
      const name = utterance.voice.name;
      if (name.includes('Google')) {
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
      } else if (name.includes('Daniel')) {
        utterance.rate = 0.9;
        utterance.pitch = 0.92;
      }
    }

    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [summary, selectedVoice, availableVoices, highQualityVoices]);

  // Calculate estimated read time
  const wordCount = stripMarkdown(summary).split(/\s+/).length;
  const readTimeSeconds = Math.round((wordCount / 150) * 60);

  return (
    <div className='w-full max-w-2xl bg-zinc-900/70 rounded-xl p-6 backdrop-blur-sm border border-zinc-800 shadow-xl transition-all duration-300 hover:shadow-2xl'>
      {/* Action buttons for quick access */}
      <ActionButtons
        videoId={videoId}
        readTimeSeconds={readTimeSeconds}
        wordCount={wordCount}
        onPlay={playSummary}
      />

      {/* Main content area */}
      <div className='bg-gradient-to-b from-zinc-800/70 to-zinc-900/70 rounded-lg p-6 mb-5 text-zinc-200 text-base leading-relaxed relative overflow-hidden shadow-lg border border-zinc-700/30'>
        <div className='absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl'></div>
        <div className='absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl'></div>

        <SummaryContent summary={summary} videoTitle={videoTitle} />
      </div>

      {/* Voice controls */}
      <div className='flex items-center justify-between mb-4'>
        <VoiceSelector
          selectedVoice={selectedVoice || ''}
          voices={highQualityVoices}
          onChange={(voice) => {
            setSelectedVoice(voice);
            saveVoicePreference(voice);
          }}
        />

        <PlayButton isSpeaking={isSpeaking} onClick={playSummary} />
      </div>
    </div>
  );
}

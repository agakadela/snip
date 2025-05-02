"use client";

import { useState, useEffect, useCallback, useMemo, Fragment, ReactNode } from "react";
import Image from "next/image";
import { getVoicePreference, saveVoicePreference } from "@/utils/localStorage";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

type SummaryCardProps = {
  summary: string;
  videoId: string;
  videoTitle?: string;
};

// Helper function to process and render summary content with code blocks
function renderSummaryContent(summaryText: string): ReactNode {
  const lines = summaryText.split("\n");
  
  // Process the lines to find code blocks and format accordingly
  const renderedContent: ReactNode[] = [];
  let skipToIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    // Skip lines that are part of a code block we've already processed
    if (i <= skipToIndex) continue;
    
    const line = lines[i];
    
    // Check for code block start
    if (line.trim().startsWith("```")) {
      // Extract language from opening tag
      const langMatch = line.trim().match(/^```(.*)$/);
      const language = langMatch && langMatch[1] ? langMatch[1].trim() : "typescript";
      
      // Look for closing tag
      const codeContent: string[] = [];
      let foundClosing = false;
      let j = i + 1;
      
      while (j < lines.length) {
        if (lines[j].trim() === "```") {
          foundClosing = true;
          break;
        }
        codeContent.push(lines[j]);
        j++;
      }
      
      if (foundClosing) {
        // Add code block with syntax highlighting
        renderedContent.push(
          <div key={`code-${i}`} className="my-4 overflow-hidden rounded-md">
            <SyntaxHighlighter 
              language={language}
              style={vscDarkPlus}
              customStyle={{
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                margin: 0,
                padding: '1rem'
              }}
            >
              {codeContent.join("\n")}
            </SyntaxHighlighter>
          </div>
        );
        
        // Skip past the closing tag
        skipToIndex = j;
        continue;
      }
    }
    
    // Process non-code blocks with the original logic
    const cleanLine = line.replace(/^#+\s+/, "");
    
    // Section headers (MAIN TOPIC:, KEY POINTS:, SUMMARY:)
    if (cleanLine.match(/^(MAIN TOPIC:|KEY POINTS:|SUMMARY:)(.*)$/i)) {
      const matches = cleanLine.match(/^(MAIN TOPIC:|KEY POINTS:|SUMMARY:)(.*)$/i);
      const headerLabel = matches?.[1] || "";
      const headerContent = matches?.[2] || "";
      
      // Special handling for SUMMARY section
      if (headerLabel.toUpperCase().includes("SUMMARY")) {
        const paragraphs = headerContent
          .split(/\.\s+/)
          .filter((para) => para.trim().length > 0)
          .map((para) => para.trim() + (para.endsWith(".") ? "" : "."));
        
        renderedContent.push(
          <Fragment key={`header-${i}`}>
            <h3 className="font-semibold text-indigo-400 uppercase mt-3 mb-2">
              {headerLabel}
            </h3>
            {paragraphs.map((paragraph, paraIndex) => (
              <p key={`para-${i}-${paraIndex}`} className="mb-3">
                {paragraph}
              </p>
            ))}
          </Fragment>
        );
      } 
      // Special handling for KEY POINTS section
      else if (headerLabel.toUpperCase().includes("KEY POINTS")) {
        const points = headerContent
          .split(/\s*-\s+/)
          .filter((point) => point.trim().length > 0);
        
        renderedContent.push(
          <Fragment key={`header-${i}`}>
            <h3 className="font-semibold text-indigo-400 uppercase mt-3 mb-2">
              {headerLabel}
            </h3>
            {points.map((point, pointIndex) => (
              <div key={`point-${i}-${pointIndex}`} className="flex ml-2 mb-2">
                <span className="mr-2">•</span>
                <span>{point}</span>
              </div>
            ))}
          </Fragment>
        );
      } 
      // Other section headers
      else {
        renderedContent.push(
          <Fragment key={`header-${i}`}>
            <h3 className="font-semibold text-indigo-400 uppercase mt-3 mb-2">
              {headerLabel}
            </h3>
            <p>{headerContent}</p>
          </Fragment>
        );
      }
    }
    // Bullet points
    else if (
      cleanLine.trim().startsWith("-") ||
      cleanLine.trim().startsWith("•") ||
      cleanLine.trim().startsWith("*")
    ) {
      renderedContent.push(
        <div key={`bullet-${i}`} className="flex ml-2 mb-2">
          <span className="mr-2">•</span>
          <span>{cleanLine.replace(/^[-•*]\s*/, "")}</span>
        </div>
      );
    }
    // Empty lines
    else if (cleanLine.trim() === "") {
      renderedContent.push(<div key={`empty-${i}`} className="h-2"></div>);
    }
    // Regular text
    else {
      renderedContent.push(
        <p key={`text-${i}`} className="mb-2">
          {cleanLine}
        </p>
      );
    }
  }
  
  return renderedContent;
}

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

  useEffect(() => {
    // Initialize voice handling
    const initVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    // Try to get voices immediately
    initVoices();

    // Handle voice list changes
    const voicesChangedHandler = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      voicesChangedHandler
    );

    // Get saved voice preference - only once on mount
    const savedVoicePreference = getVoicePreference();
    if (savedVoicePreference) {
      setSelectedVoice(savedVoicePreference);
    }

    // Cleanup
    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler
      );
      window.speechSynthesis.cancel(); // Cancel any ongoing speech on unmount
    };
  }, []);

  // Get only the specific high-quality voices requested - wrapped in useMemo for performance
  const highQualityVoices = useMemo(() => {
    // Return early if no voices are available yet
    if (availableVoices.length === 0) {
      return [];
    }

    // Specific list of voices to include (in order of preference)
    const specificVoices = [
      "Google US English", // Best natural sounding voice
      "Google UK English Female",
      "Google UK English Male",
      "Daniel (English (United Kingdom))", // Good macOS/UK voice
      "Samantha", // Good macOS voice
      "Alex", // Good macOS voice
    ];

    // Filter available voices to match our specific list
    const filteredVoices = availableVoices.filter((voice) => {
      // Match exact names or include partial matches for flexibility across systems
      return specificVoices.some(
        (preferredName) =>
          voice.name === preferredName || voice.name.includes(preferredName)
      );
    });

    // If we found our specific voices, sort them by our preference order
    if (filteredVoices.length > 0) {
      return filteredVoices.sort((a, b) => {
        const aIndex = specificVoices.findIndex(
          (name) => a.name === name || a.name.includes(name)
        );
        const bIndex = specificVoices.findIndex(
          (name) => b.name === name || b.name.includes(name)
        );
        return aIndex - bIndex; // Lower index = higher in the list
      });
    }

    // Fallback: if none of our specific voices are available, return English voices
    return availableVoices.filter((voice) => voice.lang.includes("en"));
  }, [availableVoices]);

  // Set default voice when available voices change - only when no voice is selected
  useEffect(() => {
    if (highQualityVoices.length > 0 && !selectedVoice) {
      // Try to find Google US English as the default voice
      const googleVoice = highQualityVoices.find(
        (voice) =>
          voice.name === "Google US English" ||
          voice.name.includes("Google US English")
      );

      if (googleVoice) {
        setSelectedVoice(googleVoice.name);
        saveVoicePreference(googleVoice.name);
      } else if (highQualityVoices.length > 0) {
        // Fallback to first high-quality voice
        setSelectedVoice(highQualityVoices[0].name);
        saveVoicePreference(highQualityVoices[0].name);
      } else {
        // Last resort: any English voice
        const englishVoice = availableVoices.find((voice) =>
          voice.lang.includes("en")
        );
        if (englishVoice) {
          setSelectedVoice(englishVoice.name);
          saveVoicePreference(englishVoice.name);
        }
      }
    }
  }, [availableVoices, selectedVoice, highQualityVoices]);

  // Play the summary using text-to-speech - wrapped in useCallback
  const playSummary = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(summary);

    // Use the selected voice if available
    if (selectedVoice) {
      const voice = availableVoices.find(
        (voice) => voice.name === selectedVoice
      );
      if (voice) {
        utterance.voice = voice;
      }
    } else if (highQualityVoices.length > 0) {
      // Use the memoized high-quality voices instead of recalculating
      utterance.voice = highQualityVoices[0];
    }

    // Fine-tune speech parameters for more natural sound
    // Rate: slightly slower than default for better clarity (0.9-0.95 sounds more natural than 1.0)
    utterance.rate = 0.92;

    // Pitch: slightly lower than default makes most voices sound more natural
    utterance.pitch = 0.95;

    // Volume: full volume
    utterance.volume = 1.0;

    // Handle events
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Adjust pitch and rate for specific voices to optimize their natural sound
    if (utterance.voice) {
      const voiceName = utterance.voice.name;
      if (voiceName.includes("Google")) {
        // Google voices sound best with these settings
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
      } else if (voiceName.includes("Daniel")) {
        utterance.rate = 0.9;
        utterance.pitch = 0.92;
      } else if (voiceName.includes("Samantha")) {
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
      } else if (voiceName.includes("Alex")) {
        utterance.rate = 0.9;
        utterance.pitch = 0.9;
      }
    }

    window.speechSynthesis.speak(utterance);
  }, [summary, selectedVoice, availableVoices, highQualityVoices]);

  // Calculate estimated read time (about 150 words per minute for casual speech)
  const wordCount = summary.split(/\s+/).length;
  const readTimeSeconds = Math.round((wordCount / 150) * 60);

  return (
    <div className="w-full max-w-2xl bg-zinc-900/60 rounded-xl p-6 backdrop-blur-sm border border-zinc-800 shadow-lg transition-all duration-300 hover:shadow-xl">
      {videoTitle && (
        <div className="flex mb-2">
          <h2 className="text-xl font-medium text-zinc-100 truncate flex-1">
            {videoTitle}
          </h2>
        </div>
      )}

      {/* YouTube thumbnail and metadata card - mobile-friendly */}
      <div className="flex mb-4 bg-zinc-800/50 rounded-lg overflow-hidden">
        {/* Summary metadata - on the left */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="text-xs text-zinc-400">
              {readTimeSeconds} sec read
            </div>
            <div className="text-xs text-zinc-400">{wordCount} words</div>
          </div>
          <a
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1 w-fit"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Check on YouTube
          </a>
        </div>

        {/* Thumbnail with border - on the right */}
        <a
          href={`https://youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-[140px] flex-shrink-0 group relative border-l border-zinc-700/60"
        >
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              width={160}
              height={120}
              priority
              sizes="160px"
            />
          </div>
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600/90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>
      </div>

      <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 text-zinc-200 text-base leading-relaxed">
        {/* Format the structured summary with sections */}
        {renderSummaryContent(summary)}
      </div>

      {/* Voice selection dropdown */}
      <div className="flex items-center justify-end mb-3">
        <div className="flex items-center gap-2">
          <label htmlFor="voice-select" className="text-sm text-zinc-400">
            Speaking voice:
          </label>
          <select
            id="voice-select"
            value={selectedVoice || ""}
            onChange={(e) => {
              setSelectedVoice(e.target.value);
              saveVoicePreference(e.target.value);
            }}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {highQualityVoices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={playSummary}
        className={`
          flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg 
          ${
            isSpeaking
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }
          text-white font-medium transition-colors duration-200
        `}
      >
        {isSpeaking ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Stop Playing
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Play Summary
          </>
        )}
      </button>
    </div>
  );
}

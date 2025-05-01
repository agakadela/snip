"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import React from "react";

type SummaryCardProps = {
  summary: string;
  videoId: string;
  videoTitle?: string;
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

  useEffect(() => {
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    setAvailableVoices(voices);

    // Handle voice list changes
    const voicesChangedHandler = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      voicesChangedHandler
    );

    // Cleanup
    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        voicesChangedHandler
      );
      window.speechSynthesis.cancel(); // Cancel any ongoing speech on unmount
    };
  }, []);

  // Play the summary using text-to-speech
  const playSummary = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(summary);

    // Try to find a good English voice
    const preferredVoice =
      availableVoices.find(
        (voice) =>
          voice.lang.includes("en") &&
          (voice.name.includes("Daniel") || voice.name.includes("Samantha"))
      ) || availableVoices.find((voice) => voice.lang.includes("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

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
              unoptimized={true}
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
        {summary.split("\n").map((line, index) => {
          // Remove any markdown symbols like #, ##, etc. at the beginning of lines
          const cleanLine = line.replace(/^#+\s+/, "");

          // For section headers (MAIN TOPIC:, KEY POINTS:, SUMMARY:)
          if (cleanLine.match(/^(MAIN TOPIC:|KEY POINTS:|SUMMARY:)(.*)$/i)) {
            const matches = cleanLine.match(
              /^(MAIN TOPIC:|KEY POINTS:|SUMMARY:)(.*)$/i
            );
            const headerLabel = matches?.[1] || "";
            const headerContent = matches?.[2] || "";

            // Special handling for SUMMARY section to add paragraph breaks
            if (headerLabel.toUpperCase().includes("SUMMARY")) {
              // Split the summary content by periods followed by spaces to create paragraphs
              const paragraphs = headerContent
                .split(/\.\s+/)
                .filter((para) => para.trim().length > 0)
                .map((para) => para.trim() + (para.endsWith(".") ? "" : "."));

              return (
                <React.Fragment key={`header-${index}`}>
                  <h3 className="font-semibold text-indigo-400 uppercase mt-3 mb-2">
                    {headerLabel}
                  </h3>
                  {paragraphs.map((paragraph, paraIndex) => (
                    <p key={`para-${index}-${paraIndex}`} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </React.Fragment>
              );
            } else {
              return (
                <React.Fragment key={`header-${index}`}>
                  <h3 className="font-semibold text-indigo-400 uppercase mt-3 mb-2">
                    {headerLabel}
                  </h3>
                  <p>{headerContent}</p>
                </React.Fragment>
              );
            }
          }
          // For bullet points (lines starting with - or • or *)
          else if (
            cleanLine.trim().startsWith("-") ||
            cleanLine.trim().startsWith("•") ||
            cleanLine.trim().startsWith("*")
          ) {
            return (
              <div key={index} className="flex ml-2 mb-2">
                <span className="mr-2">•</span>
                <span>{cleanLine.replace(/^[-•*]\s*/, "")}</span>
              </div>
            );
          }
          // For empty lines
          else if (cleanLine.trim() === "") {
            return <div key={index} className="h-2"></div>;
          }
          // For regular text
          else {
            return (
              <p key={index} className="mb-2">
                {cleanLine}
              </p>
            );
          }
        })}
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

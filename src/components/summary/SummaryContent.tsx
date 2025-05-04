import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

type SummaryContentProps = {
  summary: string;
  videoTitle?: string;
};

// Clean summary text by removing common intros and timestamps
// Note: The LLM prompts have been updated to avoid generating these patterns,
// but we keep this function as a backup in case some still appear
const cleanSummaryText = (text: string): string => {
  let cleaned = text;

  // Remove common intro phrases (simplified list since prompts now discourage these)
  const introPatterns = [
    /Here's a (?:scannable |concise |brief |comprehensive |detailed )?summary of the YouTube transcript:?\s*/i,
    /Summary of the video:?\s*/i,
    /Video summary:?\s*/i,
    /Transcript summary:?\s*/i,
    /Summary:?\s*/i,
    /In this video:?\s*/i,
  ];

  introPatterns.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove timestamps like [0:45], [1:23-2:45], (3:21), or 5:40 - when at the start of lines
  cleaned = cleaned.replace(
    /^(?:\[?\(?\d+:\d+(?:-\d+:\d+)?\]?\)?)\s*-?\s*/gm,
    ''
  );

  // Remove timestamps when within brackets at any position
  cleaned = cleaned.replace(/\[?\(?\d+:\d+(?:-\d+:\d+)?\]?\)?/g, '');

  return cleaned;
};

export default function SummaryContent({
  summary,
  videoTitle,
}: SummaryContentProps) {
  // Clean the summary text
  const cleanedSummary = React.useMemo(
    () => cleanSummaryText(summary),
    [summary]
  );

  // Process the summary to find TL;DR sections and other special blocks
  const processedSummary = React.useMemo(() => {
    // Split the summary into sections
    const sections = cleanedSummary.split('\n\n');

    // Process each section for special rendering
    return sections.map((section, index) => {
      // Check for TL;DR section
      const isTldr =
        section.toLowerCase().includes('tl;dr') ||
        section.toLowerCase().includes('tldr') ||
        section.toLowerCase().includes('summary:');

      // Check for key points or important notes
      const isKeyPoints =
        section.toLowerCase().includes('key points') ||
        section.toLowerCase().includes('important:') ||
        section.toLowerCase().includes('note:');

      // Return the section with its type
      return {
        content: section,
        type: isTldr ? 'tldr' : isKeyPoints ? 'keypoints' : 'regular',
        id: `section-${index}`,
      };
    });
  }, [cleanedSummary]);

  return (
    <div className='relative z-10'>
      {videoTitle && (
        <h2 className='text-xl font-bold mb-6 text-white border-b border-zinc-700 pb-2'>
          {videoTitle}
        </h2>
      )}

      <div className='markdown-content prose prose-invert max-w-none space-y-6'>
        {processedSummary.map((section) => {
          if (section.type === 'tldr') {
            return (
              <div
                key={section.id}
                className='bg-indigo-950/30 p-4 rounded-md border-l-4 border-indigo-500 mb-2 shadow-md'
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: (props) => (
                      <p className='text-white font-medium' {...props} />
                    ),
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            );
          } else if (section.type === 'keypoints') {
            return (
              <div
                key={section.id}
                className='bg-purple-950/20 p-4 rounded-md border-l-4 border-purple-500 mb-2 shadow-md'
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: (props) => <p className='text-purple-100' {...props} />,
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            );
          } else {
            return (
              <div key={section.id}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: (props) => (
                      <h1
                        className='text-2xl font-bold my-5 text-white'
                        {...props}
                      />
                    ),
                    h2: (props) => (
                      <h2
                        className='text-xl font-bold my-4 text-white'
                        {...props}
                      />
                    ),
                    h3: (props) => (
                      <h3
                        className='text-lg font-bold my-3 text-indigo-300'
                        {...props}
                      />
                    ),
                    h4: (props) => (
                      <h4
                        className='font-semibold text-indigo-300 my-2'
                        {...props}
                      />
                    ),
                    p: (props) => (
                      <p
                        className='mb-4 text-zinc-100 leading-relaxed'
                        {...props}
                      />
                    ),
                    ul: (props) => (
                      <ul
                        className='list-disc pl-6 space-y-2 mb-4 text-zinc-200'
                        {...props}
                      />
                    ),
                    ol: (props) => (
                      <ol
                        className='list-decimal pl-6 space-y-2 mb-4 text-zinc-200'
                        {...props}
                      />
                    ),
                    li: (props) => <li className='mb-1.5' {...props} />,
                    blockquote: (props) => (
                      <blockquote
                        className='bg-indigo-950/30 p-4 rounded-md border-l-4 border-indigo-500 mb-4 text-zinc-200 italic'
                        {...props}
                      />
                    ),
                    code: (props) => {
                      const { children, className, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;

                      if (isInline) {
                        return (
                          <code
                            className='bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-sm'
                            {...rest}
                          >
                            {children}
                          </code>
                        );
                      }

                      const language = match ? match[1] : '';

                      return (
                        <div className='bg-zinc-800/80 rounded-md p-1 mb-4 overflow-x-auto border border-zinc-700/50 shadow-md'>
                          {language && (
                            <div className='px-4 py-1 bg-zinc-700/50 text-xs text-zinc-300 font-mono rounded-t-md border-b border-zinc-600/50'>
                              {language}
                            </div>
                          )}
                          <div className='p-3'>
                            <code
                              className={className || 'text-amber-300'}
                              {...rest}
                            >
                              {children}
                            </code>
                          </div>
                        </div>
                      );
                    },
                    a: (props) => (
                      <a
                        className='text-blue-400 hover:text-blue-300 hover:underline transition-colors'
                        {...props}
                      />
                    ),

                    hr: (props) => (
                      <hr className='my-6 border-zinc-700/50' {...props} />
                    ),
                    table: (props) => (
                      <div className='overflow-x-auto my-4 rounded-md border border-zinc-700/50'>
                        <table className='min-w-full' {...props} />
                      </div>
                    ),
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

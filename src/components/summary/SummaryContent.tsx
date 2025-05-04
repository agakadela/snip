import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

type SummaryContentProps = {
  summary: string;
  videoTitle?: string;
};

export default function SummaryContent({
  summary,
  videoTitle,
}: SummaryContentProps) {
  return (
    <div className='relative z-10'>
      {videoTitle && (
        <h2 className='text-xl font-bold mb-4 text-white'>{videoTitle}</h2>
      )}

      <div className='markdown-content prose prose-invert max-w-none'>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: (props) => (
              <h1 className='text-2xl font-bold my-4 text-white' {...props} />
            ),
            h2: (props) => (
              <h2 className='text-xl font-bold my-3 text-white' {...props} />
            ),
            h3: (props) => (
              <h3
                className='text-lg font-bold my-2 text-indigo-300'
                {...props}
              />
            ),
            h4: (props) => (
              <h4 className='font-semibold text-indigo-300 my-2' {...props} />
            ),
            p: (props) => <p className='mb-4' {...props} />,
            ul: (props) => (
              <ul className='list-disc pl-5 space-y-2 mb-4' {...props} />
            ),
            ol: (props) => (
              <ol className='list-decimal pl-5 space-y-2 mb-4' {...props} />
            ),
            li: (props) => <li className='mb-1' {...props} />,
            blockquote: (props) => (
              <blockquote
                className='bg-indigo-950/30 p-3 rounded-md border-l-4 border-indigo-500 mb-4'
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
                    className='bg-zinc-800 px-1 py-0.5 rounded text-amber-300'
                    {...rest}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <div className='bg-zinc-800/80 rounded-md p-3 mb-4 overflow-x-auto'>
                  <code className={className || 'text-amber-300'} {...rest}>
                    {children}
                  </code>
                </div>
              );
            },
            a: (props) => (
              <a className='text-blue-400 hover:underline' {...props} />
            ),
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </div>
  );
}

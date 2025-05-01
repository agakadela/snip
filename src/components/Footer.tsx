'use client';

import Link from 'next/link';
import { FaGithub, FaStar } from 'react-icons/fa';

export default function Footer() {
  // GitHub repo URL - replace with your actual repo when ready
  const githubUrl = 'https://github.com/AgaKadela/snip';
  
  // Function to handle starring the repo
  const handleStarClick = () => {
    window.open(`${githubUrl}/stargazers`, '_blank');
  };

  return (
    <footer className="w-full py-6 px-4 mt-12 border-t border-zinc-800">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-zinc-400 text-sm">
          © {new Date().getFullYear()} · Built by{' '}
          <Link
            href="https://github.com/AgaKadela"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Aga Kadela
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
          >
            <FaGithub className="w-5 h-5" />
            <span className="hidden sm:inline">View on GitHub</span>
          </Link>

          <button
            onClick={handleStarClick}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1 px-3 rounded-md transition-colors"
          >
            <FaStar className="w-4 h-4 text-yellow-400" />
            <span>Star</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

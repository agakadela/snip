import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ytimg.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.youtube.com',
        pathname: '**',
      },
    ],
  },

  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              "connect-src 'self' https://*.youtube.com https://corsproxy.io https://openrouter.ai https://*.googleapis.com; " +
              'img-src * data: blob:; ' +
              'media-src *; ' +
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; " +
              "style-src 'self' 'unsafe-inline'; " +
              'frame-src *;',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

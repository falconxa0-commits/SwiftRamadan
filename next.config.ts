import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // ── Standalone output for Docker production deployment ──
  output: 'standalone',

  // ── Image optimization ──
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ── Compression ──
  compress: true,

  // ── Allowed dev origins ──
  allowedDevOrigins: [
    ".space-z.ai",
  ],

  // ── Cache headers for static assets ──
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, immutable, max-age=31536000' },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;

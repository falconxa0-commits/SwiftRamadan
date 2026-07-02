// CDN Configuration — Cloudflare or Vercel CDN
// In production, serve all static assets through CDN for faster loading

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

/**
 * Sanitize a path to prevent open redirect / SSRF:
 * - Must be relative (no protocol like http://)
 * - Must start with / or be a plain path
 * - No directory traversal (..)
 */
function sanitizePath(path: string): string {
  // Block absolute URLs (http://, https://, //)
  if (/^https?:\/\//i.test(path) || path.startsWith('//')) {
    return '';
  }
  // Block directory traversal
  if (path.includes('..')) {
    return '';
  }
  return path;
}

export function cdnUrl(path: string): string {
  if (!CDN_URL) return path;
  const clean = sanitizePath(path);
  if (!clean) {
    console.warn('[CDN] Blocked invalid path:', path);
    return path;
  }
  // Remove leading slash if present
  const stripped = clean.startsWith('/') ? clean.substring(1) : clean;
  return `${CDN_URL}/${stripped}`;
}

export function imageCdn(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg';
}): string {
  if (!url) return '';

  // If using Cloudinary, use their transformation URLs
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2 && options) {
      const transforms: string[] = [];
      if (options.width) transforms.push(`w_${options.width}`);
      if (options.height) transforms.push(`h_${options.height}`);
      if (options.quality) transforms.push(`q_${options.quality}`);
      if (options.format) transforms.push(`f_${options.format}`);
      transforms.push('c_fill');
      return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
    }
  }

  // If using CDN URL prefix
  if (CDN_URL && url.startsWith('/')) {
    return `${CDN_URL}${url}`;
  }

  return url;
}

export function isCdnConfigured(): boolean {
  return !!CDN_URL;
}

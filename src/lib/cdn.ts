// CDN Configuration — Cloudflare or Vercel CDN
// In production, serve all static assets through CDN for faster loading

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export function cdnUrl(path: string): string {
  if (!CDN_URL) return path;
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${CDN_URL}/${cleanPath}`;
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

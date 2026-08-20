/**
 * Security Headers Utility for SwiftRamadan
 * 
 * Provides security header configurations for HTTP responses.
 * These headers help protect against common web vulnerabilities:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME sniffing
 * - Information leakage
 */

/**
 * Core security headers that should be applied to all responses.
 * These are already implemented in middleware.ts but centralized here
 * for consistency and potential enhancement.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevents MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevents clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Enables browser XSS filter
  'X-XSS-Protection': '1; mode=block',
  
  // Controls referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restricts browser features (camera, mic, location)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  
  // Prevents DNS prefetching to reduce information leakage
  'X-DNS-Prefetch-Control': 'off',
  
  // Strict transport security (HTTPS only in production)
  // Note: This should only be set when HTTPS is actually configured
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Content-Security-Policy header value.
 * 
 * CSP helps prevent XSS by restricting sources of executable scripts.
 * This is a moderately strict policy suitable for a Single Page App.
 * 
 * For development, the policy is more permissive.
 */
export function getContentSecurityPolicy(isDevelopment: boolean = false): string {
  if (isDevelopment) {
    // Development CSP - more permissive for hot reloading
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.z-ai.dev https://*.paystack.co https://api.flutterwave.com https://api.monnify.com ws://localhost:* ws://127.0.0.1:*",
      "frame-src https://checkout.paystack.co https://flutterwave.com",
      "media-src 'self' blob: https://*.cloudinary.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  // Production CSP - stricter
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed for Next.js/React
    "style-src 'self' 'unsafe-inline'",  // Needed for styled-components/Tailwind
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.z-ai.dev https://*.paystack.co https://api.flutterwave.com https://api.monnify.com",
    "frame-src https://checkout.paystack.co https://flutterwave.com",
    "media-src 'self' blob: https://*.cloudinary.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

/**
 * Apply security headers to a Response object.
 * Use this in API routes or middleware for consistent headers.
 */
export function applySecurityHeaders(
  response: Response,
  options?: { isDevelopment?: boolean; includeCSP?: boolean }
): Response {
  const { isDevelopment = false, includeCSP = true } = options ?? {};

  // Apply core security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Add CSP if requested
  if (includeCSP) {
    response.headers.set('Content-Security-Policy', getContentSecurityPolicy(isDevelopment));
  }

  return response;
}

/**
 * Headers specifically for API responses (no CSP needed).
 * API endpoints don't render HTML, so CSP is not applicable.
 */
export const API_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Apply API-specific security headers (no CSP).
 */
export function applyApiSecurityHeaders(response: Response): Response {
  for (const [key, value] of Object.entries(API_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

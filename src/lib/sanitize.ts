/**
 * HTML/XSS sanitization utilities.
 *
 * These functions strip or escape potentially dangerous HTML from user input
 * before it is stored in the database.  They should be applied to any
 * user-supplied string that may later be rendered in a browser:
 *   - name, storeName, businessCategory, etc.
 *   - community post content
 *   - chat messages
 *   - notification titles/messages
 */

/**
 * Strip ALL HTML tags from a string, leaving only plain text.
 * Also neutralizes attribute-based XSS (e.g. <img src=x onerror=alert(1)>).
 *
 * Uses a two-pass approach:
 * 1. Replace common XSS vectors (event handlers, javascript: URLs)
 * 2. Strip remaining HTML tags
 */
export function stripHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    // Remove <script> tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handler attributes (onerror=, onclick=, etc.)
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data: URLs (can also contain XSS payloads)
    .replace(/data\s*:/gi, '')
    // Strip all remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Escape HTML special characters for safe rendering in text content.
 * Converts <, >, &, ", ' to their HTML entity equivalents.
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize a user profile field: strip HTML and enforce max length.
 */
export function sanitizeField(input: string, maxLength: number = 200): string {
  const stripped = stripHtml(input);
  return stripped.slice(0, maxLength);
}

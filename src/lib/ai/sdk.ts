// Shared AI SDK initialization and helpers for SwiftRamadan agent system
// Prevents redundant SDK initialization across routes

import ZAI from 'z-ai-web-dev-sdk';

let sdkInstance: InstanceType<typeof ZAI> | null = null;

export async function getAISDK() {
  if (!sdkInstance) {
    const ZAISDK = (await import('z-ai-web-dev-sdk')).default;
    sdkInstance = await ZAISDK.create();
  }
  return sdkInstance;
}

// Extract JSON from AI response (handles ```json fences, partial JSON, etc.)
export function extractJSON<T = unknown>(text: string): T | null {
  // Direct parse
  try { return JSON.parse(text); } catch {}
  
  // Strip ```json fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  
  // Find first { to last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  
  // Find first [ to last ]
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(text.slice(arrStart, arrEnd + 1)); } catch {}
  }
  
  return null;
}

// Sanitize user input to prevent prompt injection
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // Strip HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '')   // Strip control chars
    .trim()
    .slice(0, 2000);                    // Max 2000 chars
}

// Rate limit key per user+agent
export function getAgentRateLimitKey(userId: string, agentId: string): string {
  return `agent:${agentId}:${userId}`;
}

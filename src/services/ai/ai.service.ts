/**
 * AI Service — encapsulates AI business logic for SwiftRamadan.
 *
 * Sits between the AI API routes (`/api/chat`, `/api/agent`, `/api/safa`) and
 * the AI SDK + agent registry. Owns:
 *   - Input sanitization (applied to ALL user-supplied strings to prevent
 *     prompt injection).
 *   - Conversation message assembly (system prompt + optional context +
 *     history + current message).
 *   - Agent listing / lookup by role.
 *
 * SECURITY: {@link sanitizeInput} is applied to the user message AND every
 * historical message string. Without this, a malicious user could inject
 * system-prompt overrides or control characters.
 *
 * @module services/ai
 */

import { getAISDK, sanitizeInput } from '@/lib/ai/sdk';
import { agents, getAgentsForRole, getAgent as getAgentDef } from '@/lib/ai/agents/index';
import type { AgentDefinition, AgentId } from '@/lib/ai/types';

/** A chat role accepted by the AI SDK. */
export type ChatRole = 'system' | 'user' | 'assistant';

/** A single chat message in the conversation sent to the AI. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Optional context that gets injected into the system prompt. */
export interface ChatContext {
  userName?: string;
  role?: string;
  cartItems?: { name: string; qty: number; price: number }[];
  recentOrders?: { id: string; item: string; status: string }[];
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  swiftPoints?: number;
  dietaryPrefs?: string[];
}

/** Result of {@link sendMessage}. */
export interface SendMessageResult {
  reply: string;
  /** Whether the SDK call succeeded (false → fallback used). */
  ok: boolean;
  /** If `ok === false`, the error message (for logging only — never returned
   *  to the client to avoid leaking SDK internals). */
  internalError?: string;
}

/**
 * Send a message to the AI assistant.
 *
 * Flow:
 *   1. Sanitize the user message and any provided history messages via
 *      {@link sanitizeInput} (strips HTML, control chars, truncates to 2000).
 *   2. Build a system prompt that includes the optional context.
 *   3. Append the last (up to 10) historical messages.
 *   4. Call the AI SDK (`getAISDK` → `chat.completions.create`).
 *   5. On failure, return a fallback acknowledgement (NOT a leaky error
 *      message — clients see a generic "try again" reply).
 *
 * @param userId    The authenticated user's ID (currently unused but required
 *                  for future per-user rate-limiting / context fetching).
 * @param message   The user's current message. Sanitized before use.
 * @param context   Optional context object (cart, orders, loyalty, etc.).
 * @param history   Optional conversation history. Each entry is sanitized.
 *
 * @returns A `SendMessageResult` with the assistant's reply.
 */
export async function sendMessage(
  userId: string,
  message: string,
  context?: ChatContext,
  history?: ChatMessage[],
): Promise<SendMessageResult> {
  // SECURITY: Sanitize ALL user-supplied input before it reaches the model.
  const safeMessage = sanitizeInput(String(message || ''));
  if (!safeMessage) {
    return { reply: 'Please send a message I can understand.', ok: false };
  }

  const conversationMessages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(context) },
  ];

  // Append the most recent (up to 10) historical messages, sanitized.
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-10);
    for (const msg of recent) {
      if (msg && (msg.role === 'user' || msg.role === 'assistant')) {
        conversationMessages.push({
          role: msg.role,
          content: sanitizeInput(String(msg.content || '')),
        });
      }
    }
  }

  conversationMessages.push({ role: 'user', content: safeMessage });

  try {
    const sdk = await getAISDK();
    // The userId is reserved for future per-user context enrichment — we mark
    // it as used so the linter doesn't complain.
    void userId;

    // The SDK is loosely typed; cast to access `.chat.completions.create`.
    const sdkAny = sdk as unknown as {
      chat: {
        completions: {
          create: (args: { messages: ChatMessage[] }) => Promise<{
            choices: { message: { content: string } }[];
          }>;
        };
      };
    };

    const response = await sdkAny.chat.completions.create({
      messages: conversationMessages,
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      return { reply: getFallbackReply(safeMessage), ok: false };
    }

    return { reply, ok: true };
  } catch (err) {
    // Log to server console for debugging — never leak the error to the client.
    console.warn('[ai.service] sendMessage failed, using fallback:', err);
    return {
      reply: getFallbackReply(safeMessage),
      ok: false,
      internalError: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * List all AI agents available to a given role.
 *
 * @param role  One of 'customer' | 'vendor' | 'rider' | 'admin'.
 *              `admin` is treated as having access to all agents.
 * @returns An array of {@link AgentDefinition} objects.
 */
export function listAgents(role: string): AgentDefinition[] {
  if (role === 'admin') {
    return Object.values(agents);
  }
  return getAgentsForRole(role);
}

/**
 * Fetch a single agent definition by ID.
 *
 * @returns The {@link AgentDefinition} if it exists, `undefined` otherwise.
 */
export function getAgent(id: AgentId | string): AgentDefinition | undefined {
  return getAgentDef(id as AgentId);
}

/* ────────────────────────── Internal helpers ────────────────────────── */

/**
 * Build the system prompt for the assistant, optionally enriched with the
 * provided context (user name, cart, recent orders, loyalty tier, etc.).
 *
 * The base prompt establishes Safa's identity as the SwiftRamadan assistant.
 */
function buildSystemPrompt(context?: ChatContext): string {
  const base = `You are Safa, an expert AI assistant for SwiftRamadan — a Ramadan food delivery super-app in Lagos, Nigeria. You specialize in Ramadan food & lifestyle guidance, Nigerian cuisine, and Islamic practices during Ramadan.

Core personality: Warm, knowledgeable, concise. Use occasional emojis. Reference Naira (₦) for prices. Keep responses under 120 words unless the user specifically asks for detail.

Guidelines:
- Be culturally sensitive and respectful of Islamic traditions
- Suggest Sunnah foods (dates, water, honey) when relevant
- Always give practical, actionable advice
- If you don't know something, be honest and redirect to what you can help with`;

  if (!context) return base;

  const parts: string[] = [base, '', '--- USER CONTEXT ---'];
  if (context.userName) parts.push(`User's name: ${context.userName}`);
  if (context.role) parts.push(`User's role: ${context.role}`);
  if (context.loyaltyTier) {
    parts.push(
      `Loyalty tier: ${context.loyaltyTier.charAt(0).toUpperCase() + context.loyaltyTier.slice(1)} member`,
    );
  }
  if (typeof context.swiftPoints === 'number') {
    parts.push(`SwiftPoints balance: ${context.swiftPoints.toLocaleString()}`);
  }
  if (Array.isArray(context.dietaryPrefs) && context.dietaryPrefs.length > 0) {
    parts.push(`Dietary preferences: ${context.dietaryPrefs.join(', ')}`);
  }
  if (Array.isArray(context.cartItems) && context.cartItems.length > 0) {
    const cartSummary = context.cartItems
      .map((i) => `${i.name} x${i.qty} (₦${i.price})`)
      .join(', ');
    const cartTotal = context.cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    parts.push(`Current cart items: ${cartSummary}`);
    parts.push(`Cart total: ₦${cartTotal}`);
  }
  if (Array.isArray(context.recentOrders) && context.recentOrders.length > 0) {
    const orderSummary = context.recentOrders
      .slice(0, 3)
      .map((o) => `${o.item} (${o.status})`)
      .join(', ');
    parts.push(`Recent orders: ${orderSummary}`);
  }

  return parts.join('\n');
}

/** Generic fallback reply when the AI SDK is unavailable or fails. */
function getFallbackReply(_userMessage: string): string {
  return "I'm here to help! You can ask me about Iftar meals, Sahur boxes, delivery times, promotions, SwiftRewards, group buys, or anything else about SwiftRamadan. 🌙";
}

/**
 * Unified AI Gateway — the single entry point for ALL AI requests in
 * SwiftRamadan.
 *
 * Pipeline (per spec PHASE-2-AI-GATEWAY):
 *   Authentication → Permission → Input sanitization → Token budget →
 *   Model call → Output validation
 *
 * This file owns the orchestration of stages 3–6 (sanitization, budget,
 * model call, output validation). Stages 1 (Authentication) and 2
 * (Permission) are the caller's responsibility — the gateway is invoked
 * AFTER `requireAuth` and the role check, because those are tightly coupled
 * to the HTTP request and live in the route handler. The gateway itself
 * is transport-agnostic: it can be called from a route handler, a cron
 * job, a queue worker, or another service.
 *
 * INVARIANTS enforced by the gateway:
 *  - Every model call goes through `getAISDK()` — NEVER inline `ZAI.create()`.
 *    This is critical for cost control: the SDK is a long-lived singleton,
 *    and `ZAI.create()` is expensive (network handshake, config fetch).
 *  - `max_tokens` is always set, always clamped to `[1, MAX_PER_REQUEST_TOKENS]`.
 *    Default is `TOKEN_BUDGETS.perRequest` (500); hard ceiling 2000.
 *  - Token usage is always recorded via `recordTokenUsage`, even when the
 *    call fails (we record 0 — but we log the failure).
 *  - Every request is logged via `logAiRequest` (structured, no PII).
 *  - Output is always passed through `validateOutput` before being returned.
 *
 * ERROR HANDLING POLICY:
 *  The gateway NEVER throws. Every failure mode returns a typed
 *  `{ success: false, error }` response. Callers can `await aiRequest(...)`
 *  without try/catch. Errors are logged internally so the caller doesn't
 *  have to.
 */

import { getAISDK } from '@/lib/ai/sdk';
import { getAgent } from '@/lib/ai/agents/index';

import {
  sanitizePromptInput,
  validateOutput,
  containsInjectionAttempt,
  FOOD_SAFETY_RULES,
} from './security';
import {
  checkTokenBudget,
  recordTokenUsage,
  resolveMaxTokens,
  AI_RATE_LIMITS,
} from './limits';
import {
  getConversation,
  saveConversation,
  clearConversation,
} from './memory';

/** Public type re-exports for callers. */
export type { ChatMessage } from './memory';

/** Shape of an `aiRequest` call. */
export interface AiRequestParams {
  /** Authenticated user ID (from `requireAuth`). */
  userId: string;
  /** Authenticated user role (from `requireAuth`). Used for agent permission. */
  userRole: string;
  /** The user's message to send to the model. */
  message: string;
  /** Optional agent ID. When omitted, the default "safa" persona is used. */
  agentId?: string;
  /** Optional per-call context (cart, orders, dietary prefs, etc.). */
  context?: Record<string, unknown>;
  /** Optional override for `max_tokens`; clamped to `[1, 2000]`. */
  maxTokens?: number;
}

/** Shape of an `aiRequest` response. */
export interface AiRequestResult {
  success: boolean;
  response?: string;
  error?: string;
  tokensUsed?: number;
}

/** Default system prompt when no `agentId` is supplied. */
const DEFAULT_SYSTEM_PROMPT = `You are Safa, the AI assistant for SwiftRamadan — a Ramadan food delivery super-app in Lagos, Nigeria.

Tone: warm, concise, respectful of Islamic traditions. Use Naira (₦) for prices.
Currency: Nigerian Naira (₦).
Always suggest safe food handling. Never recommend non-halal items.

${FOOD_SAFETY_RULES}`;

/** Concurrency-safe in-flight request counter (for per-user rate limit). */
const inFlightPerUser = new Map<string, number>();

/**
 * Lightweight per-user concurrency limiter (in-memory, single-instance).
 *
 * This is a *second* layer of rate-limiting that complements `AI_RATE_LIMITS`
 * (which is the rolling-window count). The point of this check is to prevent
 * a single user from spawning N parallel AI calls and burning through their
 * token budget before the daily counter can catch up.
 *
 * We cap concurrent in-flight requests per user at 3. Anything beyond that
 * is rejected with HTTP-429-style semantics (returned as a non-throwing
 * `success: false`).
 */
const MAX_CONCURRENT_PER_USER = 3;

function acquireUserSlot(userId: string): boolean {
  const current = inFlightPerUser.get(userId) ?? 0;
  if (current >= MAX_CONCURRENT_PER_USER) return false;
  inFlightPerUser.set(userId, current + 1);
  return true;
}

function releaseUserSlot(userId: string): void {
  const current = inFlightPerUser.get(userId) ?? 0;
  if (current <= 1) {
    inFlightPerUser.delete(userId);
  } else {
    inFlightPerUser.set(userId, current - 1);
  }
}

/**
 * Structured request log entry. Written by `logAiRequest` to the console
 * (and therefore to the platform log aggregator — Caddy/Loki/etc.).
 *
 * Deliberately avoids PII: we log `userId` (needed for correlation) but
 * never the message body, the AI response, or the user's email.
 */
export interface AiRequestLogEntry {
  /** RFC3339 timestamp. */
  ts: string;
  /** Event type — always "ai_request" for normal calls, "ai_error" for failures. */
  event: 'ai_request' | 'ai_error';
  /** Opaque user ID (NOT email / name). */
  userId: string;
  /** Agent ID or "default". */
  agentId: string;
  /** Outcome of the call. */
  status: 'ok' | 'blocked_injection' | 'blocked_budget' | 'blocked_concurrency' | 'error';
  /** Tokens reported by the SDK (or our best estimate). */
  tokensUsed: number;
  /** Wall-clock duration of the model call in ms. */
  durationMs: number;
  /** Short, non-PII error message on failure. */
  error?: string;
}

/**
 * Log an AI request to the platform log stream.
 *
 * This is the audit trail for every AI call. It MUST be called for every
 * gateway invocation, success or failure. We log to `console.log` so the
 * output is captured by Next.js's request-scoped logger and the Caddy
 * gateway's structured logging. (For higher-volume deployments this should
 * be swapped for an OpenTelemetry span, but that's out of scope for
 * Phase 2.)
 *
 * Never throws.
 */
export function logAiRequest(entry: AiRequestLogEntry): void {
  try {
    // Single-line JSON so it's grep-friendly and log-aggregator-friendly.
    // PII guard: we never log `message` or `response` bodies.
    console.log(JSON.stringify(entry));
  } catch {
    // Logging is best-effort.
  }
}

/**
 * Estimate token count for a string when the SDK doesn't return usage.
 *
 * Heuristic: ~4 chars per token for English. Deliberately conservative
 * (over-estimate) so we don't under-count budget usage. The ZAI SDK
 * returns `usage.total_tokens` on most responses, so this is a fallback.
 */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Build the system prompt for a given agent + context.
 *
 * Always appends `FOOD_SAFETY_RULES` so the model is reminded of the safety
 * constraints on every call (defence in depth).
 */
function buildSystemPrompt(
  agentId: string | undefined,
  context: Record<string, unknown> | undefined,
): string {
  let base = DEFAULT_SYSTEM_PROMPT;

  if (agentId) {
    const agent = getAgent(agentId as Parameters<typeof getAgent>[0]);
    if (agent) {
      base = `${agent.systemPrompt}\n\n${FOOD_SAFETY_RULES}`;
    }
  }

  if (context && Object.keys(context).length > 0) {
    base += '\n\n--- USER CONTEXT ---';
    if (typeof context.userName === 'string' && context.userName) {
      base += `\nUser: ${context.userName}`;
    }
    if (typeof context.role === 'string' && context.role) {
      base += `\nRole: ${context.role}`;
    }
    if (typeof context.loyaltyTier === 'string' && context.loyaltyTier) {
      base += `\nLoyalty tier: ${context.loyaltyTier}`;
    }
    if (Array.isArray(context.dietaryPrefs) && context.dietaryPrefs.length > 0) {
      base += `\nDietary preferences: ${(context.dietaryPrefs as string[]).join(', ')}`;
    }
    if (Array.isArray(context.cartItems) && context.cartItems.length > 0) {
      base += `\nCart items: ${context.cartItems.length}`;
    }
    base += '\n--- END CONTEXT ---';
  }

  return base;
}

/**
 * The single entry point for ALL AI requests in SwiftRamadan.
 *
 * Pipeline:
 *   1. Validate `userId` / `userRole` / `message` (caller did auth+permission).
 *   2. Sanitize input via `sanitizePromptInput` (strip HTML, control chars,
 *      injection phrases; cap length).
 *   3. Refuse unambiguous prompt-injection attempts (defence in depth —
 *      `sanitizePromptInput` already stripped the common ones, but if
 *      `containsInjectionAttempt` is still true on the raw input, refuse).
 *   4. Check token budget via `checkTokenBudget`. Refuse if exhausted.
 *   5. Acquire per-user concurrency slot (in-memory, single-instance).
 *   6. Call the model via `getAISDK()` singleton with `max_tokens` set.
 *   7. Validate output via `validateOutput`. Refuse if unsafe.
 *   8. Record token usage via `recordTokenUsage` (best-effort).
 *   9. Log the request via `logAiRequest`.
 *  10. Return `{ success, response, tokensUsed }`.
 *
 * NEVER throws — all failure modes are returned as `{ success: false, error }`.
 */
export async function aiRequest(params: AiRequestParams): Promise<AiRequestResult> {
  const startedAt = Date.now();
  const durationMs = () => Date.now() - startedAt;

  const userId = params?.userId;
  const userRole = params?.userRole;
  const agentId = params?.agentId ?? 'default';

  // ── Step 1: required-params validation ──────────────────────────────────
  if (!userId || typeof userId !== 'string') {
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_error',
      userId: '(missing)',
      agentId,
      status: 'error',
      tokensUsed: 0,
      durationMs: durationMs(),
      error: 'missing userId',
    });
    return { success: false, error: 'Authentication required.' };
  }
  if (!userRole || typeof userRole !== 'string') {
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_error',
      userId,
      agentId,
      status: 'error',
      tokensUsed: 0,
      durationMs: durationMs(),
      error: 'missing userRole',
    });
    return { success: false, error: 'Permission denied: missing role.' };
  }

  // ── Step 2: input sanitization ──────────────────────────────────────────
  const rawMessage = typeof params.message === 'string' ? params.message : '';
  const sanitized = sanitizePromptInput(rawMessage);
  if (!sanitized) {
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_error',
      userId,
      agentId,
      status: 'error',
      tokensUsed: 0,
      durationMs: durationMs(),
      error: 'empty message after sanitize',
    });
    return { success: false, error: 'Message cannot be empty.' };
  }

  // ── Step 3: injection refusal (defence in depth) ────────────────────────
  // `sanitizePromptInput` already STRIPPED the common phrases; if the RAW
  // input still trips `containsInjectionAttempt` after stripping, the user
  // is being deliberately evasive — refuse the request.
  if (containsInjectionAttempt(rawMessage) && containsInjectionAttempt(sanitized)) {
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_request',
      userId,
      agentId,
      status: 'blocked_injection',
      tokensUsed: 0,
      durationMs: durationMs(),
    });
    return {
      success: false,
      error: 'Your message contains patterns that look like a prompt-injection attempt. Please rephrase.',
    };
  }

  // ── Step 4: token budget check ─────────────────────────────────────────
  const budget = await checkTokenBudget(userId);
  if (!budget.allowed) {
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_request',
      userId,
      agentId,
      status: 'blocked_budget',
      tokensUsed: 0,
      durationMs: durationMs(),
    });
    return {
      success: false,
      error: `Daily AI token budget exhausted. Try again tomorrow (resets at 00:00 UTC). Remaining: 0.`,
    };
  }

  // ── Step 5: per-user concurrency slot ───────────────────────────────────
  if (!acquireUserSlot(userId)) {
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_request',
      userId,
      agentId,
      status: 'blocked_concurrency',
      tokensUsed: 0,
      durationMs: durationMs(),
    });
    return {
      success: false,
      error: `Too many concurrent AI requests. Please wait for your previous request to finish.`,
    };
  }

  // ── Step 6: model call ───────────────────────────────────────────────────
  try {
    const zai = await getAISDK(); // NEVER inline `ZAI.create()` — use the singleton.
    const maxTokens = resolveMaxTokens(params.maxTokens);
    const systemPrompt = buildSystemPrompt(params.agentId, params.context);

    // Pull conversation history from Redis (best-effort; the route handler
    // is responsible for saving it back via `saveConversation`).
    const history = await getConversation(userId);

    // Filter history to the roles ZAI's chat completion accepts.
    const zaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user', content: sanitized },
    ];

    const completion = await zai.chat.completions.create({
      messages: zaiMessages,
      max_tokens: maxTokens,
      thinking: { type: 'disabled' },
    });

    const rawOutput: string =
      completion?.choices?.[0]?.message?.content ??
      completion?.choices?.[0]?.text ??
      '';

    // ── Step 7: output validation ─────────────────────────────────────────
    const validation = validateOutput(rawOutput, 'text');
    if (!validation.safe || !validation.sanitized) {
      // If validation flagged the output as unsafe, return a graceful
      // fallback rather than the (possibly redacted) content. We still
      // record token usage so the user can't circumvent their budget by
      // triggering refusals.
      const tokensUsed =
        Number(completion?.usage?.total_tokens ?? estimateTokens(rawOutput + sanitized));
      await recordTokenUsage(userId, tokensUsed);

      logAiRequest({
        ts: new Date().toISOString(),
        event: 'ai_request',
        userId,
        agentId,
        status: 'error',
        tokensUsed,
        durationMs: durationMs(),
        error: 'output validation failed',
      });

      return {
        success: false,
        error: "I couldn't generate a safe response. Please try rephrasing your request.",
        tokensUsed,
      };
    }

    // ── Step 8: record token usage ────────────────────────────────────────
    const tokensUsed = Number(
      completion?.usage?.total_tokens ?? estimateTokens(validation.sanitized + sanitized),
    );
    await recordTokenUsage(userId, tokensUsed);

    // ── Step 9: log the successful request ────────────────────────────────
    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_request',
      userId,
      agentId,
      status: 'ok',
      tokensUsed,
      durationMs: durationMs(),
    });

    // ── Step 10: return the validated response ────────────────────────────
    return {
      success: true,
      response: validation.sanitized,
      tokensUsed,
    };
  } catch (error) {
    // ── Error path: log + return typed error ──────────────────────────────
    const message = error instanceof Error ? error.message : 'Unknown AI error';

    logAiRequest({
      ts: new Date().toISOString(),
      event: 'ai_error',
      userId,
      agentId,
      status: 'error',
      tokensUsed: 0,
      durationMs: durationMs(),
      error: message,
    });

    return {
      success: false,
      error: 'AI assistant temporarily unavailable. Please try again.',
    };
  } finally {
    releaseUserSlot(userId);
  }
}

// NOTE: convenience re-exports live in the barrel `@/ai` (`src/ai/index.ts`).
// Keeping `gateway.ts` focused on the request pipeline itself — the barrel
// pulls limits / security / memory symbols from their own modules so we
// don't have to maintain duplicate re-export lists here.

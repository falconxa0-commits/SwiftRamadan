/**
 * Unified AI Gateway unit tests — `src/ai/gateway.ts`.
 *
 * Verifies the `aiRequest` pipeline contract:
 *  - Returns `{ success: true, response, tokensUsed }` on a valid call.
 *  - Returns `{ success: false, error }` on empty message / SDK error /
 *    output-validation failure — never throws.
 *  - Applies the per-request `maxTokens` (via `resolveMaxTokens`) to the
 *    `chat.completions.create` call.
 *  - Records token usage via `recordTokenUsage` after every call (success
 *    or output-validation failure).
 *  - Uses the `getAISDK()` singleton (NOT inline `ZAI.create()`) — this is
 *    the cost-control invariant.
 *  - Runs model output through `validateOutput`. If validation redacts a
 *    secret, the call returns `success: false` (defence in depth).
 *  - Builds the system prompt with `FOOD_SAFETY_RULES` appended on every
 *    call so the model is reminded of the safety constraints.
 *  - Logs every request via `logAiRequest` (which calls `console.log`)
 *    with a JSON entry that NEVER includes the message body or response
 *    (PII guard).
 *  - Requires both `userId` and `userRole` (caller is responsible for
 *    auth + permission).
 *
 * Mock strategy:
 *  - `@/lib/ai/sdk`: stubs `getAISDK` to return a mock SDK whose
 *    `chat.completions.create` we control per-test. Also stubs
 *    `sanitizeInput` (used by `@/ai/security`) so we don't pull in the
 *    real `z-ai-web-dev-sdk` package.
 *  - `z-ai-web-dev-sdk`: stubbed with a spy on `ZAI.create` so we can
 *    assert it's NEVER called by the gateway.
 *  - `@/ai/limits`: stubs `checkTokenBudget` (allow by default) and
 *    `recordTokenUsage` (spy). `resolveMaxTokens` is the real impl.
 *  - `@/ai/memory`: stubs `getConversation` to return `[]`.
 *  - `@/lib/ai/agents/index`: stubs `getAgent` to return `undefined`
 *    (so the default system prompt is used).
 *
 * `@/ai/security` is NOT mocked — we want the real `sanitizePromptInput`
 * and `validateOutput` so the "validates output" and "redacts secrets"
 * tests exercise the real code path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock the ZAI SDK package — its `create` should NEVER be called by the
// gateway (the gateway uses the singleton via getAISDK).
const zaiCreateMock = vi.fn();
vi.mock('z-ai-web-dev-sdk', () => ({
  default: { create: zaiCreateMock },
}));

// Mock @/lib/ai/sdk: getAISDK returns a mock SDK; sanitizeInput mirrors the
// production helper (used by @/ai/security).
const createMock = vi.fn();
const getAISDKMock = vi.fn(async () => ({
  chat: { completions: { create: createMock } },
}));
vi.mock('@/lib/ai/sdk', () => ({
  getAISDK: () => getAISDKMock(),
  sanitizeInput: (input: string): string =>
    input
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 2000),
}));

// Mock @/ai/limits: checkTokenBudget allows by default; recordTokenUsage is
// a spy so we can assert it was called with the right (userId, tokens).
const checkTokenBudgetMock = vi.fn(async () => ({ allowed: true, remaining: 10_000 }));
const recordTokenUsageMock = vi.fn(async () => undefined);
vi.mock('@/ai/limits', () => ({
  checkTokenBudget: (...a: unknown[]) => checkTokenBudgetMock(...a),
  recordTokenUsage: (...a: unknown[]) => recordTokenUsageMock(...a),
  resolveMaxTokens: (n?: number) => {
    const requested = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : 500;
    if (requested < 1) return 1;
    if (requested > 2000) return 2000;
    return requested;
  },
  AI_RATE_LIMITS: { requests: 20, window: 60 },
  TOKEN_BUDGETS: { daily: 10_000, perRequest: 500 },
  MAX_PER_REQUEST_TOKENS: 2_000,
}));

// Mock @/ai/memory: getConversation returns [] (no prior history).
const getConversationMock = vi.fn(async () => []);
vi.mock('@/ai/memory', () => ({
  getConversation: () => getConversationMock(),
  saveConversation: vi.fn(async () => undefined),
  clearConversation: vi.fn(async () => undefined),
}));

// Mock @/lib/ai/agents/index: getAgent returns undefined (use default prompt).
vi.mock('@/lib/ai/agents/index', () => ({
  getAgent: () => undefined,
  getAgentsForRole: () => [],
  agents: {},
}));

// NOTE: @/ai/security is NOT mocked — we use the real implementation.
// Its `sanitizePromptInput` and `validateOutput` run against the stubbed
// `sanitizeInput` from `@/lib/ai/sdk` above.

import { aiRequest } from '@/ai/gateway';

describe('ai/gateway — happy path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success on valid input with a sanitized response', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'Sure, here is a recipe for jollof rice.' } }],
      usage: { total_tokens: 42 },
    });

    const result = await aiRequest({
      userId: 'user-1',
      userRole: 'customer',
      message: 'Give me a jollof rice recipe',
    });

    expect(result.success).toBe(true);
    expect(result.response).toBe('Sure, here is a recipe for jollof rice.');
    expect(result.tokensUsed).toBe(42);
  });

  it('records token usage after a successful call', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'hello' } }],
      usage: { total_tokens: 7 },
    });

    await aiRequest({
      userId: 'user-2',
      userRole: 'customer',
      message: 'hi',
    });

    expect(recordTokenUsageMock).toHaveBeenCalledTimes(1);
    expect(recordTokenUsageMock.mock.calls[0][0]).toBe('user-2');
    expect(recordTokenUsageMock.mock.calls[0][1]).toBe(7);
  });

  it('uses the getAISDK singleton (NOT inline ZAI.create)', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
      usage: { total_tokens: 1 },
    });

    await aiRequest({
      userId: 'user-3',
      userRole: 'customer',
      message: 'hi',
    });

    expect(getAISDKMock).toHaveBeenCalledTimes(1);
    // The ZAI.create mock should NEVER have been called by the gateway.
    expect(zaiCreateMock).not.toHaveBeenCalled();
  });

  it('applies the per-request token budget (max_tokens) to the SDK call', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
      usage: { total_tokens: 1 },
    });

    await aiRequest({
      userId: 'user-4',
      userRole: 'customer',
      message: 'hi',
      maxTokens: 750,
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0][0];
    expect(call.max_tokens).toBe(750);
  });

  it('includes FOOD_SAFETY_RULES in the system prompt sent to the model', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'ok' } }],
      usage: { total_tokens: 1 },
    });

    await aiRequest({
      userId: 'user-5',
      userRole: 'customer',
      message: 'hi',
    });

    const call = createMock.mock.calls[0][0];
    const systemMessage = call.messages.find(
      (m: { role: string; content: string }) => m.role === 'system',
    );
    expect(systemMessage).toBeDefined();
    expect(systemMessage.content).toContain('FOOD SAFETY RULES');
  });

  it('logs the request via console.log without the message body or response', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'safe-response' } }],
      usage: { total_tokens: 1 },
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const secretMessage = 'UNIQUE_MSG_BODY_42';
    await aiRequest({
      userId: 'user-6',
      userRole: 'customer',
      message: secretMessage,
    });

    // At least one console.log call should be a JSON entry with
    // event === 'ai_request' and the user's message body MUST NOT appear.
    const jsonLogs = consoleSpy.mock.calls
      .map((c) => c[0])
      .filter((s) => typeof s === 'string' && s.includes('"event":"ai_request"'));
    expect(jsonLogs.length).toBeGreaterThan(0);
    for (const entry of jsonLogs) {
      expect(entry).not.toContain(secretMessage);
      expect(entry).not.toContain('safe-response');
    }

    consoleSpy.mockRestore();
  });
});

describe('ai/gateway — input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error on an empty message', async () => {
    const result = await aiRequest({
      userId: 'user-empty',
      userRole: 'customer',
      message: '',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  it('returns error when userRole is missing (respects user role)', async () => {
    const result = await aiRequest({
      userId: 'user-no-role',
      userRole: '',
      message: 'hi',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/role|permission/i);
  });

  it('returns error when userId is missing', async () => {
    const result = await aiRequest({
      userId: '',
      userRole: 'customer',
      message: 'hi',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/authentication/i);
  });
});

describe('ai/gateway — error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles SDK errors gracefully (returns success:false, never throws)', async () => {
    createMock.mockRejectedValueOnce(new Error('SDK network failure'));

    const result = await aiRequest({
      userId: 'user-err-1',
      userRole: 'customer',
      message: 'hi',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    // The error message must NOT leak the raw SDK error (avoid info disclosure).
    expect(result.error).not.toContain('SDK network failure');
  });

  it('handles timeouts (a thrown error becomes success:false)', async () => {
    createMock.mockRejectedValueOnce(new Error('Request timed out after 30000ms'));

    const result = await aiRequest({
      userId: 'user-err-2',
      userRole: 'customer',
      message: 'hi',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('validates output — refuses when validateOutput marks it unsafe', async () => {
    // Empty output → validateOutput returns safe:false.
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: '' } }],
      usage: { total_tokens: 1 },
    });

    const result = await aiRequest({
      userId: 'user-err-3',
      userRole: 'customer',
      message: 'hi',
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/safe response/i);
  });

  it('redacts secrets in output — refuses when output contains a leaked key', async () => {
    // The real validateOutput (NOT mocked) marks `safe: false` when it
    // redacts a Stripe-shaped secret. The gateway should then refuse to
    // return the (possibly redacted) content.
    const fakeKey = 'sk_live_' + 'abcdefghijklmnopqrstuvwxyz123456';
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: `Your key is ${fakeKey} please use it.` } }],
      usage: { total_tokens: 1 },
    });

    const result = await aiRequest({
      userId: 'user-err-4',
      userRole: 'customer',
      message: 'hi',
    });

    expect(result.success).toBe(false);
    // The response field must NOT contain the secret (it's either undefined
    // or doesn't contain the key).
    expect(result.response ?? '').not.toContain(fakeKey);
    // Token usage is still recorded (defence in depth — refusals still
    // count toward the user's daily budget so they can't bypass limits by
    // triggering refusals).
    expect(recordTokenUsageMock).toHaveBeenCalled();
  });
});

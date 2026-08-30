/**
 * Unified AI gateway barrel — single import surface for ALL AI access in
 * SwiftRamadan.
 *
 * Phase 2 (PHASE-2-AI-GATEWAY) — additive layer; existing AI routes at
 * `/api/safa`, `/api/agent`, `/api/chat`, etc. are unchanged and continue
 * to work. New code SHOULD import from `@/ai` so it goes through the full
 * security pipeline:
 *
 *   Authentication → Permission → Input sanitization → Token budget →
 *   Model call → Output validation
 *
 * Example usage in a route handler:
 *
 *   import { aiRequest } from '@/ai';
 *   import { requireAuth } from '@/lib/session';
 *
 *   export async function POST(request: NextRequest) {
 *     const auth = await requireAuth(request);
 *     if (auth instanceof NextResponse) return auth;
 *
 *     const { message, agentId } = await request.json();
 *     const result = await aiRequest({
 *       userId: auth.userId,
 *       userRole: auth.role,
 *       message,
 *       agentId,
 *     });
 *     return NextResponse.json(result);
 *   }
 */

// Gateway — the single entry point for all AI requests.
export {
  aiRequest,
  logAiRequest,
  // Types
  type AiRequestParams,
  type AiRequestResult,
  type AiRequestLogEntry,
} from './gateway';

// Security — AI-specific input/output sanitization.
export {
  sanitizePromptInput,
  validateOutput,
  containsInjectionAttempt,
  FOOD_SAFETY_RULES,
  type OutputValidationResult,
} from './security';

// Memory — Redis-backed conversation history.
export {
  getConversation,
  saveConversation,
  clearConversation,
  type ChatMessage,
} from './memory';

// Limits — token budget + rate limiting.
export {
  TOKEN_BUDGETS,
  AI_RATE_LIMITS,
  MAX_PER_REQUEST_TOKENS,
  checkTokenBudget,
  recordTokenUsage,
  resolveMaxTokens,
} from './limits';

// Agents — re-export of the existing agent registry.
export {
  agents,
  getAgentsForRole,
  getAgent,
  type AgentId,
  type AgentDefinition,
} from './agents/index';

/**
 * Agent registry re-export for the unified AI gateway.
 *
 * The agent definitions themselves live at `@/lib/ai/agents/index` (Phase 1)
 * and are used by the existing `/api/agent` route. The gateway needs the
 * SAME definitions (so `aiRequest({ agentId })` can resolve the agent's
 * system prompt), and we don't want a second source of truth.
 *
 * This barrel re-exports the three symbols the gateway consumes, plus the
 * `AgentId` type for callers:
 *
 *   - `agents`            — full record of all agent definitions
 *   - `getAgentsForRole`  — list agents available to a given user role
 *   - `getAgent`          — look up a single agent by ID
 *
 * Pipeline enforcement (per spec PHASE-2-AI-GATEWAY):
 *   Authentication → Permission → Input sanitization → Token budget →
 *   Model call → Output validation
 *
 * Stage 2 (Permission) uses `getAgentsForRole(role)` to decide whether
 * `agentId` is allowed for `userRole`. The gateway itself delegates this
 * to the route handler (because auth lives there), but exposes the helper
 * here for callers who want to do their own pre-flight check.
 */

export { agents, getAgentsForRole, getAgent } from '@/lib/ai/agents/index';
export type { AgentId, AgentDefinition } from '@/lib/ai/types';

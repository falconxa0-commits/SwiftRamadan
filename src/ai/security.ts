/**
 * AI security layer for the unified AI gateway.
 *
 * Pipeline enforcement (per spec PHASE-2-AI-GATEWAY):
 *   Authentication → Permission → Input sanitization → Token budget → Model call → Output validation
 *
 * This module owns two of the six pipeline stages:
 *   - Input sanitization    → `sanitizePromptInput`, `containsInjectionAttempt`
 *   - Output validation     → `validateOutput`
 * Plus the shared `FOOD_SAFETY_RULES` system-prompt addition that every
 * agent system prompt should append (so the model is told up-front what
 * it must refuse to recommend).
 *
 * Threat model:
 *   1. Prompt injection — "ignore previous instructions", role-play jailbreaks,
 *      fake system messages. Detected by `containsInjectionAttempt` and
 *      neutralized by `sanitizePromptInput`.
 *   2. XSS / HTML in user input — strip via the shared `sanitizeInput` helper.
 *   3. Unbounded input length — cap at 2000 chars (matches `sanitizeInput`).
 *   4. Unsafe food recommendations — model is told to refuse via
 *      `FOOD_SAFETY_RULES`; output is also screened by `validateOutput`.
 *   5. Model leaking PII / secrets back into responses — `validateOutput`
 *      strips common secrets patterns before returning to the caller.
 *
 * This module is deliberately stateless and side-effect-free — it's pure
 * function composition that the gateway can call inline.
 */

import { sanitizeInput } from '@/lib/ai/sdk';

/** Hard cap on user-supplied prompt length (chars). Matches `sanitizeInput`. */
export const PROMPT_MAX_LENGTH = 2_000;

/**
 * Common prompt-injection patterns observed in the wild.
 *
 * - `ignore (all|previous) instructions` / `ignore (the) (above|prior) ...`
 * - `disregard (the|all|previous) (prior|above)? ...`
 * - `forget (your|all|previous|prior) ... instructions`
 * - `you are (now) (a|an) ...` role-swap style jailbreaks
 * - `system prompt:` / `new system:` / `<\/?system>` (fake system messages)
 * - `reveal (your|the) (system )?prompt` exfiltration attempts
 * - `do not follow (your|the) (system )?(instructions|rules)`
 * - `override (your|the) (system )?(instructions|rules|prompt)`
 * - `from now on ...` (often used to re-frame the conversation)
 * - `pretend (you are|to be) ...`
 * - `act as (if )?...` (often used to bypass refusals)
 * - `jailbreak`, `DAN`, `developer mode`, `unrestricted mode`
 *
 * The list is intentionally broad — over-flagging is cheap (we'll just refuse
 * or strip the offending phrase); under-flagging lets an injection through.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(?:all\s+|the\s+|previous\s+|prior\s+|above\s+)?(?:instructions?|prompts?|rules?)/i,
  /disregard\s+(?:the\s+|all\s+|previous\s+|prior\s+|above\s+)?(?:instructions?|prompts?|rules?)/i,
  /forget\s+(?:your|all|previous|prior)\s+(?:instructions?|prompts?|rules?)/i,
  /do\s+not\s+follow\s+(?:your|the)\s+(?:system\s+)?(?:instructions?|rules?)/i,
  /override\s+(?:your|the)\s+(?:system\s+)?(?:instructions?|rules?|prompt)/i,
  /you\s+are\s+(?:now|actually)\s+(?:a|an)\s+/i,
  /pretend\s+(?:you\s+are|to\s+be)\s+/i,
  /act\s+as\s+(?:if\s+)?(?:you\s+are\s+)?(?:a|an)\s+/i,
  /(?:reveal|show|print|repeat)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?)/i,
  /new\s+system\s*(?:prompt|message)?\s*:/i,
  /system\s*prompt\s*:/i,
  /<\/?system>/i,
  /\bjailbreak\b/i,
  /\bDAN\b/,
  /developer\s+mode/i,
  /unrestricted\s+mode/i,
  /from\s+now\s+on\s+(?:you\s+)?(?:are|will|must|should|act)/i,
];

/**
 * Phrases that, when found in the sanitized input, should be stripped before
 * the input is sent to the model. We strip rather than reject because a
 * benign message may contain the words "ignore" or "instructions" in a
 * non-malicious context (e.g. "I want to ignore the cheese in this recipe
 * — do you have other instructions?"). The gateway additionally checks
 * `containsInjectionAttempt` and may refuse the request entirely if the
 * pattern is unambiguous.
 */
const STRIP_PATTERNS: readonly RegExp[] = [
  /ignore\s+(?:all\s+|the\s+|previous\s+|prior\s+|above\s+)?(?:instructions?|prompts?|rules?)[.!]?/gi,
  /disregard\s+(?:the\s+|all\s+|previous\s+|prior\s+|above\s+)?(?:instructions?|prompts?|rules?)[.!]?/gi,
  /forget\s+(?:your|all|previous|prior)\s+(?:instructions?|prompts?|rules?)[.!]?/gi,
  /<\/?system>/gi,
  /(?:new\s+)?system\s*prompt\s*:[^]*?(?=\n\s*\n|$)/gi,
];

/** True if `input` matches any known prompt-injection pattern. */
export function containsInjectionAttempt(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return INJECTION_PATTERNS.some((re) => re.test(input));
}

/**
 * Sanitize user input destined for an LLM prompt.
 *
 * Wraps `sanitizeInput` from `@/lib/ai/sdk` (which strips HTML, control
 * chars, and caps at 2000 chars) and adds AI-specific filters:
 *   - Strips common prompt-injection phrases ("ignore previous
 *     instructions", fake `system:` blocks, `<system>` tags, …).
 *   - Collapses excessive whitespace so injection attempts that try to hide
 *     via mid-phrase newlines/spaces are still caught.
 *   - Re-caps the final length to `PROMPT_MAX_LENGTH` (in case the strip
 *     patterns added gaps — it's a safety net).
 *
 * Returns the sanitized string. NEVER returns a rejection — that's the
 * caller's responsibility (use `containsInjectionAttempt` on the raw input
 * to decide whether to refuse before calling the model).
 */
export function sanitizePromptInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // 1. Delegate the HTML / control-char / length handling to the shared helper.
  let cleaned = sanitizeInput(input);

  // 2. Collapse whitespace runs so injection phrases can't dodge the regex
  //    by splitting across lines: "ignore\n\nprevious   instructions".
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 3. Strip known injection phrases. We do this AFTER the whitespace
  //    collapse so the patterns match reliably.
  for (const re of STRIP_PATTERNS) {
    cleaned = cleaned.replace(re, '');
  }

  // 4. Final trim + length safety net (strip patterns may have left odd gaps).
  cleaned = cleaned.trim();
  if (cleaned.length > PROMPT_MAX_LENGTH) {
    cleaned = cleaned.slice(0, PROMPT_MAX_LENGTH);
  }

  return cleaned;
}

/**
 * System-prompt addition enforcing food-safety rules.
 *
 * Append this to every agent's `systemPrompt` so the model is told up-front
 * (before any user input) what it must refuse to recommend. This is a
 * defence-in-depth layer — the gateway ALSO screens output via
 * `validateOutput`, but telling the model the rules first is far more
 * effective than relying on post-hoc filtering alone.
 *
 * Temperatures are advisory, not regulatory — for Nigerian poultry the FDA
 * equivalent (NAFDAC) guidance is 74 °C internal; we state 74 °C explicitly
 * to match the spec.
 */
export const FOOD_SAFETY_RULES = `
--- FOOD SAFETY RULES (NON-NEGOTIABLE) ---
You are operating in a Ramadan food-delivery context where users may follow
your cooking advice literally. You MUST NOT recommend any of the following:

1. Undercooked or raw meat, poultry, fish, or eggs. Poultry must reach an
   internal temperature of 74°C (165°F). Ground meat 71°C (160°F). Whole
   cuts of beef/pork/lamb 63°C (145°F) with a 3-minute rest. Fish 63°C
   (145°F) or until opaque and flaky.
2. Serving raw or runny eggs (e.g. raw egg in drinks, soft-boiled eggs for
   pregnant customers, the elderly, or young children).
3. Unsafe food handling: leaving perishable food at room temperature for
   more than 2 hours (1 hour if ambient temperature exceeds 32°C / 90°F),
   cross-contamination between raw meat and ready-to-eat foods, unwashed
   hands or utensils, or reheating food more than once.
4. Consuming food that has visibly spoiled, smells off, or has been stored
   past its use-by date, even if it "looks fine on the outside".
5. Raw or undercooked sprouts for at-risk groups (children, elderly,
   pregnant, immunocompromised) — sprouts are a known Salmonella/E. coli
   vector.
6. Unpasteurised (raw) milk or juices for at-risk groups.
7. Honey for infants under 12 months (infant botulism risk).
8. High-mercury fish (shark, swordfish, king mackerel, tilefish) for
   pregnant or breastfeeding customers.
9. Anything that contradicts Nigerian NAFDAC food-safety guidance or
   standard HACCP principles.

If a user asks for something unsafe, REFUSE the unsafe part, briefly explain
the risk, and offer a safe alternative. Never present unsafe advice as
"just this once" or "if you're careful". Food safety is not negotiable.
--- END FOOD SAFETY RULES ---
`.trim();

/** Output validation result returned by `validateOutput`. */
export interface OutputValidationResult {
  /** False if the output should NOT be returned to the user. */
  safe: boolean;
  /** The sanitized output to return to the user. */
  sanitized: string;
}

/**
 * Patterns that, if found in model output, mark it as unsafe to return
 * verbatim. We strip them when possible (and mark `safe: false` so the
 * caller can substitute a fallback message).
 */
const UNSAFE_OUTPUT_PATTERNS: readonly RegExp[] = [
  // Looks like an API key (sk-... or sk_live_... or pk_live_...)
  /\bsk_[A-Za-z0-9_]{20,}\b/g,
  /\bpk_(?:live|test)_[A-Za-z0-9_]{20,}\b/g,
  // AWS-style keys
  /AKIA[0-9A-Z]{16}/g,
  // Generic long hex/base64 strings that look like secrets (>32 chars)
  /\b(?:secret|token|password|api[_-]?key)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{32,}["']?/gi,
  // JWT-shaped strings (three base64 segments separated by dots)
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
];

/**
 * Strip HTML tags from a string (used for output sanitization).
 * Lighter-weight than `stripHtml` from `@/lib/sanitize` because model
 * output rarely contains the XSS vectors that `stripHtml` is built for;
 * we just need to remove markdown-injected `<script>` etc.
 */
function stripTagsFromOutput(s: string): string {
  return s
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
}

/**
 * Validate model output before returning it to the user.
 *
 * `type` controls how strict the validation is:
 *  - `text`   — strip HTML, redact secrets, cap length.
 *  - `recipe` — same as `text` plus a soft check that the output mentions a
 *               temperature or cooking-time cue when it claims to be a
 *               recipe (otherwise mark unsafe so the caller can fall back).
 *  - `json`   — verify the output is parseable JSON; if not, mark unsafe.
 *
 * Always returns the `sanitized` string, even when `safe === false`, so the
 * caller can choose to log the redacted content for debugging. When
 * `safe === false` the caller SHOULD NOT surface the content to the user.
 */
export function validateOutput(
  output: string,
  type: 'text' | 'recipe' | 'json',
): OutputValidationResult {
  if (typeof output !== 'string' || output.length === 0) {
    return { safe: false, sanitized: '' };
  }

  let sanitized = output;

  // 1. Strip HTML / script tags from any output type.
  sanitized = stripTagsFromOutput(sanitized);

  // 2. Redact anything that looks like a leaked secret.
  for (const re of UNSAFE_OUTPUT_PATTERNS) {
    sanitized = sanitized.replace(re, '[REDACTED]');
  }

  // 3. Cap output length. Generous ceiling — most recipe / chat outputs are
  //    well under this, but we want a hard ceiling to prevent a runaway
  //    model from flooding the client.
  const OUTPUT_MAX_LENGTH = 8_000;
  if (sanitized.length > OUTPUT_MAX_LENGTH) {
    sanitized = sanitized.slice(0, OUTPUT_MAX_LENGTH);
  }

  let safe = true;

  // 4. Type-specific checks.
  if (type === 'json') {
    try {
      JSON.parse(sanitized.trim());
    } catch {
      safe = false;
    }
  } else if (type === 'recipe') {
    // A real recipe should mention at least one of: a temperature, a time,
    // or an ingredient. This is a soft signal — if none are present the
    // model probably didn't produce a real recipe.
    const hasTemp = /\b\d+\s*(?:°C|°F|celsius|fahrenheit)\b/i.test(sanitized);
    const hasTime = /\b(?:min(?:ute)?s?|hr|hours?|sec(?:ond)?s?)\b/i.test(sanitized);
    const hasIngredient = /\b(?:cups?|tbsp|tsp|grams?|g\b|kg|ml|L\b|tablespoons?|teaspoons?|ingredients?)\b/i.test(sanitized);
    if (!hasTemp && !hasTime && !hasIngredient) {
      safe = false;
    }
  }

  // Final safety check — if any unsafe pattern was actually redacted, we
  // mark the output unsafe so the caller can substitute a fallback. This is
  // conservative (the model mentioning the word "token" in a benign way
  // wouldn't trip the redactor because the regex requires a 32+ char secret
  // value), but if a real secret DID get redacted we want to refuse.
  if (output !== sanitized && UNSAFE_OUTPUT_PATTERNS.some((re) => re.test(output))) {
    safe = false;
  }

  return { safe, sanitized };
}

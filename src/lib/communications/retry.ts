// Shared retry utility for communication providers (Twilio, Termii, Resend)
// Nigerian phone number validation/normalization
// DND-aware routing helper for Termii

/* -------------------------------------------------------------------------- */
/* withRetry — generic retry with exponential backoff                         */
/* -------------------------------------------------------------------------- */

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  backoffMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(
          `[Retry] Attempt ${attempt + 1}/${retries + 1} failed — retrying in ${delay}ms`,
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/* -------------------------------------------------------------------------- */
/* Nigerian Phone Number Validation & Normalization                           */
/* -------------------------------------------------------------------------- */

/**
 * Normalize a Nigerian phone number to the international format (234XXXXXXXXXX).
 * Accepts: +234XXXXXXXXXX, 234XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX (10 digits)
 */
export function normalizeNigerianPhone(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // +234XXXXXXXXXX or 234XXXXXXXXXX → already has country code
  if (digits.startsWith('234') && digits.length === 13) {
    return digits;
  }

  // 0XXXXXXXXXX → strip leading 0, add 234
  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }

  // XXXXXXXXXX (10 digits, no leading 0) → add 234
  if (digits.length === 10) {
    return `234${digits}`;
  }

  // Already 13 digits starting with 234 (no +)
  if (digits.length === 13 && digits.startsWith('234')) {
    return digits;
  }

  // Return as-is if we can't normalize
  return digits;
}

/**
 * Check if a phone number looks like a valid Nigerian number.
 */
export function isValidNigerianPhone(phone: string): boolean {
  const normalized = normalizeNigerianPhone(phone);
  // Nigerian numbers: 234 followed by 7/8/9/8 and 7 more digits = 13 digits total
  return /^234[789]\d{8}$/.test(normalized);
}

/**
 * Check if a phone number is a Nigerian number (for routing decisions).
 */
export function isNigerianNumber(phone: string): boolean {
  try {
    const normalized = normalizeNigerianPhone(phone);
    return normalized.startsWith('234');
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* DND-Aware Routing Helper for Termii                                        */
/* -------------------------------------------------------------------------- */

/**
 * In Nigeria, the Do-Not-Disturb (DND) registry blocks promotional SMS.
 * Transactional messages (OTP, order updates) can bypass DND via the
 * "dnd" channel on Termii. This helper picks the right channel.
 */
export function getTermiiChannel(messageType: 'transactional' | 'promotional'): string {
  // Transactional messages (OTP, order updates, delivery status) use DND bypass
  // Promotional messages use the standard route
  return messageType === 'transactional' ? 'dnd' : 'generic';
}

/**
 * Determine the message type based on content heuristics.
 * Useful when the caller doesn't explicitly specify a type.
 */
export function inferMessageType(content: string): 'transactional' | 'promotional' {
  const transactionalKeywords = [
    'otp', 'code', 'verification', 'verify', 'order', 'delivery',
    'delivered', 'rider', 'tracking', 'payment', 'refund', 'receipt',
    'transaction', 'payout', 'assigned', 'in transit',
  ];

  const lower = content.toLowerCase();
  const isTransactional = transactionalKeywords.some((kw) => lower.includes(kw));

  return isTransactional ? 'transactional' : 'promotional';
}

/* -------------------------------------------------------------------------- */
/* Smart Channel Router                                                       */
/* -------------------------------------------------------------------------- */

export interface RoutingResult {
  channels: Array<'whatsapp' | 'sms' | 'email'>;
  preferredChannel: 'whatsapp' | 'sms' | 'email';
  smsChannel?: 'dnd' | 'generic'; // Termii-specific
}

/**
 * Determine the best communication channel for a Nigerian phone number.
 * Priority: WhatsApp → SMS (DND bypass for transactional) → Email
 */
export function routeCommunication({
  phone,
  messageType = 'transactional',
  hasWhatsApp = true,
}: {
  phone?: string;
  messageType?: 'transactional' | 'promotional';
  hasWhatsApp?: boolean;
}): RoutingResult {
  const channels: Array<'whatsapp' | 'sms' | 'email'> = [];

  // Nigerian numbers get WhatsApp first (if available), then SMS, then email
  if (phone && isNigerianNumber(phone)) {
    if (hasWhatsApp) channels.push('whatsapp');
    channels.push('sms');
  } else if (phone) {
    // International numbers: SMS first
    channels.push('sms');
  }

  // Always include email as a fallback
  channels.push('email');

  return {
    channels,
    preferredChannel: channels[0],
    smsChannel: phone && isNigerianNumber(phone)
      ? getTermiiChannel(messageType)
      : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

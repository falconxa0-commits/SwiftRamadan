// Shared HTTP utilities — Circuit breaker, retry with backoff, timeout, resilient fetch
// Used by all payment/communication providers for robust external API calls

/* -------------------------------------------------------------------------- */
/* Circuit Breaker                                                            */
/* -------------------------------------------------------------------------- */

export enum CircuitState {
  Closed = 'closed',
  Open = 'open',
  HalfOpen = 'half-open',
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.Closed;
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  constructor(failureThreshold = 5, resetTimeoutMs = 60_000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  getState(): CircuitState {
    return this.state;
  }

  /** Check if a request is allowed through the circuit breaker. */
  allowRequest(): boolean {
    switch (this.state) {
      case CircuitState.Closed:
        return true;
      case CircuitState.Open: {
        const elapsed = Date.now() - this.lastFailureTime;
        if (elapsed >= this.resetTimeoutMs) {
          // Transition to half-open — allow one probe request
          this.state = CircuitState.HalfOpen;
          return true;
        }
        return false;
      }
      case CircuitState.HalfOpen:
        // Only one probe request is allowed at a time; since we're synchronous
        // here we allow it and the caller must call recordSuccess / recordFailure
        return true;
    }
  }

  /** Record a successful request. */
  recordSuccess(): void {
    if (this.state === CircuitState.HalfOpen) {
      // Probe succeeded — close the circuit
      this.state = CircuitState.Closed;
    }
    this.failureCount = 0;
  }

  /** Record a failed request. */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HalfOpen) {
      // Probe failed — re-open the circuit
      this.state = CircuitState.Open;
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.Open;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Per-provider circuit breaker registry                                      */
/* -------------------------------------------------------------------------- */

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(provider: string): CircuitBreaker {
  let cb = circuitBreakers.get(provider);
  if (!cb) {
    cb = new CircuitBreaker();
    circuitBreakers.set(provider, cb);
  }
  return cb;
}

/* -------------------------------------------------------------------------- */
/* fetchWithRetry — exponential backoff on 5xx / network errors               */
/* -------------------------------------------------------------------------- */

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoffMs = 1000,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Only retry on server errors (5xx). Client errors (4xx) are the caller's
      // problem and should not be retried.
      if (response.status >= 500 && attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(
          `[HTTP] ${response.status} on attempt ${attempt + 1}/${retries + 1} for ${url} — retrying in ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(
          `[HTTP] Network error on attempt ${attempt + 1}/${retries + 1} for ${url} — retrying in ${delay}ms`,
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/* -------------------------------------------------------------------------- */
/* fetchWithTimeout — aborts request after timeout                            */
/* -------------------------------------------------------------------------- */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/* -------------------------------------------------------------------------- */
/* ResilientFetchConfig                                                       */
/* -------------------------------------------------------------------------- */

export interface ResilientFetchConfig {
  retries?: number;         // default 3
  backoffMs?: number;       // default 1000
  timeoutMs?: number;       // default 10000
  provider?: string;        // circuit breaker key (default url host)
}

/* -------------------------------------------------------------------------- */
/* resilientFetch — combines retry + timeout + circuit breaker                */
/* -------------------------------------------------------------------------- */

export async function resilientFetch(
  url: string,
  options: RequestInit = {},
  config: ResilientFetchConfig = {},
): Promise<Response> {
  const {
    retries = 3,
    backoffMs = 1000,
    timeoutMs = 10_000,
    provider = new URL(url).host,
  } = config;

  const cb = getCircuitBreaker(provider);

  if (!cb.allowRequest()) {
    throw new Error(`[HTTP] Circuit breaker OPEN for provider "${provider}" — refusing request to ${url}`);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status >= 500 && attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(
          `[HTTP] ${response.status} on attempt ${attempt + 1}/${retries + 1} for ${url} — retrying in ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }

      // Success (2xx or non-retriable 4xx)
      if (response.status < 500) {
        cb.recordSuccess();
      } else {
        cb.recordFailure();
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        console.warn(
          `[HTTP] Network error on attempt ${attempt + 1}/${retries + 1} for ${url} — retrying in ${delay}ms`,
        );
        await sleep(delay);
      }
    }
  }

  cb.recordFailure();
  throw lastError;
}

/* -------------------------------------------------------------------------- */
/* assertOk — throws on non-2xx responses                                     */
/* -------------------------------------------------------------------------- */

export async function assertOk(response: Response, provider: string): Promise<void> {
  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // ignore read errors
    }
    const message = body ? ` — ${body.slice(0, 200)}` : '';
    throw new Error(`[${provider}] HTTP ${response.status}${message}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

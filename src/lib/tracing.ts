/**
 * OpenTelemetry tracing stub.
 * In production, install @opentelemetry/sdk-node and configure exporters.
 * For now, this provides a consistent API that can be wired up later.
 */

export interface Span {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, unknown>;
}

const activeSpans: Span[] = [];

export function startSpan(name: string, attributes: Record<string, unknown> = {}): Span {
  const span: Span = { name, startTime: Date.now(), attributes };
  activeSpans.push(span);
  return span;
}

export function endSpan(span: Span): void {
  span.endTime = Date.now();
}

export function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes: Record<string, unknown> = {}
): Promise<T> {
  const span = startSpan(name, attributes);
  return fn().finally(() => endSpan(span));
}

export function getActiveSpans(): Span[] {
  return activeSpans.filter(s => !s.endTime);
}

/**
 * Structured logger — JSON output for production, pretty output for dev.
 * Replaces scattered console.error/warn calls with structured logging.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('order created', { orderId: 'abc123', total: 4500 });
 *   logger.error('payment failed', { provider: 'paystack', error: err.message });
 *
 * Production output (one JSON object per line, ready for Loki / Datadog / CloudWatch):
 *   {"level":"info","message":"order created","timestamp":"2025-01-15T...","orderId":"abc123","total":4500}
 *
 * Dev output (coloured, human-readable):
 *   [INFO] order created
 *     {"orderId":"abc123","total":4500}
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';

function formatLog(level: LogLevel, message: string, meta: Record<string, unknown> = {}): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

function log(entry: LogEntry) {
  if (isProduction) {
    // JSON for log aggregation (Loki, Datadog, etc.)
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    // Pretty print for dev
    const color = entry.level === 'error' ? '\x1b[31m' : entry.level === 'warn' ? '\x1b[33m' : '\x1b[36m';
    const reset = '\x1b[0m';
    process.stdout.write(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}\n`);
    if (Object.keys(entry).length > 3) {
      process.stdout.write(
        `  ${JSON.stringify(
          { ...entry, level: undefined, message: undefined, timestamp: undefined },
          null,
          2,
        )}\n`,
      );
    }
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log(formatLog('debug', message, meta)),
  info: (message: string, meta?: Record<string, unknown>) => log(formatLog('info', message, meta)),
  warn: (message: string, meta?: Record<string, unknown>) => log(formatLog('warn', message, meta)),
  error: (message: string, meta?: Record<string, unknown>) => log(formatLog('error', message, meta)),
};

export { captureException } from '@/lib/monitoring/sentry';

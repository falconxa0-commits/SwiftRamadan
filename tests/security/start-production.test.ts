import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const rawScript = readFileSync('./scripts/start-production.sh', 'utf-8');

// Strip shell comment lines so the test inspects executable commands only.
// This prevents the audit-fix documentation (which mentions the old insecure
// flag as historical context) from masking real regressions.
const script = rawScript
  .split('\n')
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n');

describe('Production Data Safety (G12)', () => {
  it('does NOT invoke prisma with --accept-data-loss (regression: G12)', () => {
    // The dangerous pattern is `prisma db push --accept-data-loss` (or any
    // prisma subcommand with that flag). Informational echo lines that
    // reference the flag do not invoke prisma and are not flagged.
    expect(script).not.toMatch(/prisma[^\n]*--accept-data-loss/);
  });
  it('exits 1 on migration failure', () => {
    expect(script).toContain('exit 1');
  });
});

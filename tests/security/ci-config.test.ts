import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const rawCiConfig = readFileSync('./.github/workflows/ci.yml', 'utf-8');

// Strip YAML comment lines so the test only inspects executable CI directives.
// This prevents the audit-fix documentation (which mentions the old insecure
// pattern as historical context) from masking real regressions.
const ciConfig = rawCiConfig
  .split('\n')
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n');

describe('CI Security (G1)', () => {
  it('bun audit step is present', () => {
    expect(ciConfig).toContain('bun audit');
  });
  it('bun audit is not softened with || true (regression: G1)', () => {
    expect(ciConfig).not.toContain('bun audit || true');
    // Also guard against any softer form like `bun audit ... || true` or `|| exit 0`
    expect(ciConfig).not.toMatch(/bun audit[^\n]*\|\|\s*true/);
    expect(ciConfig).not.toMatch(/bun audit[^\n]*\|\|\s*exit\s+0/);
  });
});

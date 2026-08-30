import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const caddyfile = readFileSync('./Caddyfile', 'utf-8');

describe('Caddyfile SSRF (B1)', () => {
  it('does NOT use wildcard XTransformPort', () => {
    expect(caddyfile).not.toContain('reverse_proxy localhost:{query.XTransformPort}');
  });
  it('has allowlist for port 3002', () => {
    expect(caddyfile).toContain('3002');
  });
  it('has allowlist for port 3003', () => {
    expect(caddyfile).toContain('3003');
  });
  it('has allowlist for port 3004', () => {
    expect(caddyfile).toContain('3004');
  });
  it('returns 403 for unauthorized ports', () => {
    expect(caddyfile).toContain('403');
  });
});

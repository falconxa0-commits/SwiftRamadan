import { describe, it, expect } from 'vitest';
import { isPublicApiRoute } from '@/lib/session';

describe('Public Route Exact Match (B12)', () => {
  it('/api/auth is public', () => {
    expect(isPublicApiRoute('/api/auth', 'POST')).toBe(true);
  });
  it('/api/auth/device-token is NOT public (exact match prevents prefix)', () => {
    expect(isPublicApiRoute('/api/auth/device-token', 'POST')).toBe(false);
  });
  it('/api/health is public', () => {
    expect(isPublicApiRoute('/api/health', 'GET')).toBe(true);
  });
  it('/api/payments/callback is public', () => {
    expect(isPublicApiRoute('/api/payments/callback', 'POST')).toBe(true);
  });
  it('/api/admin/users is NOT public', () => {
    expect(isPublicApiRoute('/api/admin/users', 'GET')).toBe(false);
  });
});

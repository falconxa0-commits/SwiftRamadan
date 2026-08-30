/**
 * AI conversation memory unit tests — `src/ai/memory.ts`.
 *
 * Verifies the Redis-backed conversation store:
 *  - `getConversation` returns `[]` for a new user (cache miss).
 *  - `getConversation` returns the stored messages on a cache hit.
 *  - `saveConversation` writes the messages to Redis via `cacheSet`.
 *  - `saveConversation` passes the 24h TTL (`86_400` seconds) to `cacheSet`.
 *  - `clearConversation` deletes the conversation key via `redisDel`.
 *  - All three ops degrade gracefully when Redis is unavailable (cacheGet
 *    returns null / cacheSet returns false / redisDel returns false) —
 *    they never throw.
 *  - The module uses `cacheGet`/`cacheSet`/`redisDel` from `@/lib/redis`
 *    (the Redis-backed cache helpers), NOT an in-memory `Map` — this
 *    guards against reverting to the pre-Phase-2 in-memory store.
 *
 * Mock strategy:
 *  - `@/lib/redis` is mocked so we can control cache hit/miss behaviour
 *    and assert which cache helpers were called.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const cacheGetMock = vi.fn();
const cacheSetMock = vi.fn();
const redisDelMock = vi.fn();

vi.mock('@/lib/redis', () => ({
  cacheGet: (...args: unknown[]) => cacheGetMock(...args),
  cacheSet: (...args: unknown[]) => cacheSetMock(...args),
  redisDel: (...args: unknown[]) => redisDelMock(...args),
}));

import {
  getConversation,
  saveConversation,
  clearConversation,
  type ChatMessage,
} from '@/ai/memory';

describe('ai/memory — `getConversation`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty array for a new user (cache miss)', async () => {
    cacheGetMock.mockResolvedValueOnce(null);
    const result = await getConversation('new-user-1');
    expect(result).toEqual([]);
  });

  it('returns saved messages on a cache hit', async () => {
    const stored: ChatMessage[] = [
      { role: 'user', content: 'hi', timestamp: '2024-01-01T00:00:00.000Z' },
      { role: 'assistant', content: 'hello', timestamp: '2024-01-01T00:00:01.000Z' },
    ];
    cacheGetMock.mockResolvedValueOnce(stored);
    const result = await getConversation('user-2');
    expect(result).toEqual(stored);
  });

  it('handles Redis unavailable (cacheGet returns null) without throwing', async () => {
    cacheGetMock.mockResolvedValueOnce(null);
    const result = await getConversation('user-3');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('handles a corrupt / non-array stored value (returns [])', async () => {
    // cacheGet returns a value that isn't an array — the impl should
    // defensively return [].
    cacheGetMock.mockResolvedValueOnce({ not: 'an array' });
    const result = await getConversation('user-4');
    expect(result).toEqual([]);
  });

  it('returns [] for an empty userId', async () => {
    // Should not even call cacheGet.
    const result = await getConversation('');
    expect(result).toEqual([]);
    expect(cacheGetMock).not.toHaveBeenCalled();
  });
});

describe('ai/memory — `saveConversation`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores messages via cacheSet', async () => {
    cacheSetMock.mockResolvedValueOnce(true);
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi back' },
    ];
    await saveConversation('user-save-1', messages);
    expect(cacheSetMock).toHaveBeenCalledTimes(1);
    // First arg is the conversation key (namespaced under `ai:conversation:`).
    const key = cacheSetMock.mock.calls[0][0] as string;
    expect(key).toContain('ai:conversation:');
    expect(key).toContain('user-save-1');
    // Second arg is the trimmed messages array.
    const stored = cacheSetMock.mock.calls[0][1] as ChatMessage[];
    expect(stored).toHaveLength(2);
    expect(stored[0].content).toBe('hello');
  });

  it('respects the 24-hour TTL (passes 86_400 to cacheSet)', async () => {
    cacheSetMock.mockResolvedValueOnce(true);
    await saveConversation('user-save-2', [{ role: 'user', content: 'x' }]);
    const ttl = cacheSetMock.mock.calls[0][2];
    expect(ttl).toBe(86_400);
  });

  it('handles Redis unavailable (cacheSet returns false) without throwing', async () => {
    cacheSetMock.mockResolvedValueOnce(false);
    // Should not throw — saveConversation is fail-open.
    await expect(
      saveConversation('user-save-3', [{ role: 'user', content: 'x' }]),
    ).resolves.toBeUndefined();
  });

  it('no-ops when userId is empty', async () => {
    await saveConversation('', [{ role: 'user', content: 'x' }]);
    expect(cacheSetMock).not.toHaveBeenCalled();
  });

  it('trims history to MAX_HISTORY_MESSAGES (20)', async () => {
    cacheSetMock.mockResolvedValueOnce(true);
    // 25 messages — should be trimmed to the last 20.
    const messages: ChatMessage[] = Array.from({ length: 25 }, (_, i) => ({
      role: 'user' as const,
      content: `msg-${i}`,
    }));
    await saveConversation('user-save-4', messages);
    const stored = cacheSetMock.mock.calls[0][1] as ChatMessage[];
    expect(stored).toHaveLength(20);
    // Should keep the LAST 20 messages.
    expect(stored[0].content).toBe('msg-5');
    expect(stored[19].content).toBe('msg-24');
  });
});

describe('ai/memory — `clearConversation`', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the conversation via redisDel', async () => {
    redisDelMock.mockResolvedValueOnce(true);
    await clearConversation('user-clear-1');
    expect(redisDelMock).toHaveBeenCalledTimes(1);
    const key = redisDelMock.mock.calls[0][0] as string;
    // clearConversation deletes `cache:ai:conversation:${userId}` (the
    // prefix is what cacheSet writes under).
    expect(key).toContain('cache:');
    expect(key).toContain('ai:conversation:');
    expect(key).toContain('user-clear-1');
  });

  it('no-ops when userId is empty', async () => {
    await clearConversation('');
    expect(redisDelMock).not.toHaveBeenCalled();
  });
});

describe('ai/memory — uses Redis (not in-memory Map)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('all three ops go through the @/lib/redis cache helpers', async () => {
    cacheGetMock.mockResolvedValueOnce(null);
    cacheSetMock.mockResolvedValueOnce(true);
    redisDelMock.mockResolvedValueOnce(true);

    await getConversation('verify-1');
    expect(cacheGetMock).toHaveBeenCalledTimes(1);

    await saveConversation('verify-1', [{ role: 'user', content: 'x' }]);
    expect(cacheSetMock).toHaveBeenCalledTimes(1);

    await clearConversation('verify-1');
    expect(redisDelMock).toHaveBeenCalledTimes(1);
  });
});

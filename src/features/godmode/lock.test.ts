import { describe, expect, it } from 'vitest';

import { checkPasscode, constantTimeEqual, LOCK_MS, OPEN, recordAttempt, tick } from './lock';

describe('God Mode lock', () => {
  it('rejects wrong codes', () => {
    expect(checkPasscode('000000')).toBe(false);
    expect(checkPasscode('')).toBe(false);
  });

  it('compares in constant time and by length', () => {
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(false);
  });

  it('locks after five failures for ten minutes', () => {
    let s = tick(OPEN, 1000);
    for (let i = 0; i < 5; i++) s = recordAttempt(s, false);
    expect(s.lockLeft).toBe(LOCK_MS);
    s = tick(s, 1000 + LOCK_MS / 2);
    expect(s.lockLeft).toBe(LOCK_MS / 2);
    s = tick(s, 1000 + LOCK_MS);
    expect(s.lockLeft).toBe(0);
    expect(s.failures).toBe(0);
  });

  it('does not unlock when the clock is turned back', () => {
    let s = tick(OPEN, 10_000_000);
    for (let i = 0; i < 5; i++) s = recordAttempt(s, false);
    s = tick(s, 0);
    expect(s.lockLeft).toBe(LOCK_MS);
    s = tick(s, 10_000_000 + 1000);
    expect(s.lockLeft).toBe(LOCK_MS - 1000);
  });
});

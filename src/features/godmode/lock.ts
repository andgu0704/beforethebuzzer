/**
 * The God Mode passcode check and its lockout. The passcode is stored only as a PBKDF2-SHA256
 * hash with a random salt; the comparison is constant-time. Five wrong attempts lock the prompt
 * for ten minutes. The lock survives restarts and does not lift if the clock is turned back:
 * time is measured from the latest moment the app has seen, never from an earlier one.
 *
 * Honest limit: a six-digit code can be brute-forced from this hash by anyone who unpacks the
 * app. The hash keeps the digits out of the source; the lockout stops guessing in the app.
 */

import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

const SALT = 'a5a52342154ba10ce0064bc1c2b5300a';
const HASH = 'd2e6d1af18d4655bfea9bd38c8c669e37390ee4bbe138f72381a2286ff36cd5d';
const ITERATIONS = 20000;

export const MAX_ATTEMPTS = 5;
export const LOCK_MS = 10 * 60 * 1000;

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export function checkPasscode(code: string, salt = SALT, hash = HASH): boolean {
  const derived = pbkdf2(sha256, new TextEncoder().encode(code), fromHex(salt), {
    c: ITERATIONS,
    dkLen: 32,
  });
  return constantTimeEqual(derived, fromHex(hash));
}

export interface LockState {
  readonly failures: number;
  /** Milliseconds of trusted time left on the lock. */
  readonly lockLeft: number;
  /** Latest wall-clock time seen, to detect the clock being turned back. */
  readonly lastSeen: number;
}

export const OPEN: LockState = { failures: 0, lockLeft: 0, lastSeen: 0 };

/** Moves the lock forward to `now`. A clock that went backwards counts as no time passing. */
export function tick(s: LockState, now: number): LockState {
  const elapsed = s.lastSeen === 0 ? 0 : Math.max(0, now - s.lastSeen);
  const lockLeft = Math.max(0, s.lockLeft - elapsed);
  return {
    failures: lockLeft === 0 && s.lockLeft > 0 ? 0 : s.failures,
    lockLeft,
    lastSeen: Math.max(now, s.lastSeen),
  };
}

export function recordAttempt(s: LockState, ok: boolean): LockState {
  if (ok) return { ...s, failures: 0, lockLeft: 0 };
  const failures = s.failures + 1;
  return failures >= MAX_ATTEMPTS ? { ...s, failures, lockLeft: LOCK_MS } : { ...s, failures };
}

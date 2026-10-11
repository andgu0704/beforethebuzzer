import { describe, expect, it } from 'vitest';

import { createRng, restoreRng } from './rng';

describe('rng', () => {
  it('repeats a sequence for the same seed and label', () => {
    const a = createRng('seed', 'games', 3);
    const b = createRng('seed', 'games', 3);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('gives independent streams for different labels', () => {
    const a = createRng('seed', 'games', 3);
    const b = createRng('seed', 'games', 4);
    const same = Array.from({ length: 50 }, () => a.next() === b.next()).filter(Boolean).length;
    expect(same).toBe(0);
  });

  it('produces uniform values in range with a sensible mean', () => {
    const rng = createRng('uniform');
    let sum = 0;
    for (let i = 0; i < 20000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 20000).toBeCloseTo(0.5, 1);
  });

  it('draws integers across the full inclusive range', () => {
    const rng = createRng('ints');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(rng.int(1, 6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('approximates a normal distribution', () => {
    const rng = createRng('normal');
    const xs = Array.from({ length: 20000 }, () => rng.normal(10, 2));
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length);
    expect(mean).toBeCloseTo(10, 1);
    expect(sd).toBeGreaterThan(1.9);
    expect(sd).toBeLessThan(2.1);
  });

  it('respects weights', () => {
    const rng = createRng('weights');
    let heavy = 0;
    for (let i = 0; i < 10000; i++)
      if (rng.weighted(['a', 'b'], (x) => (x === 'a' ? 3 : 1)) === 'a') heavy++;
    expect(heavy / 10000).toBeCloseTo(0.75, 1);
  });

  it('forks deterministically', () => {
    const a = createRng('seed').fork('child');
    const b = createRng('seed').fork('child');
    expect(a.next()).toBe(b.next());
  });

  it('resumes from a snapshot', () => {
    const a = createRng('seed', 'resume');
    a.next();
    const snap = a.snapshot();
    const b = restoreRng(JSON.parse(JSON.stringify(snap)) as typeof snap);
    for (let i = 0; i < 20; i++) expect(b.next()).toBe(a.next());
  });
});

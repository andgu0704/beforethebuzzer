import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { apportion, dexp, dlog, dpow, logistic, shiftProbability } from './math';

describe('deterministic maths', () => {
  it('matches Math.exp closely', () => {
    fc.assert(
      fc.property(fc.double({ min: -50, max: 50, noNaN: true }), (x) => {
        const expected = Math.exp(x);
        expect(Math.abs(dexp(x) - expected) / expected).toBeLessThan(1e-13);
      }),
    );
  });

  it('matches Math.log closely', () => {
    fc.assert(
      fc.property(fc.double({ min: 1e-6, max: 1e6, noNaN: true }), (x) => {
        expect(Math.abs(dlog(x) - Math.log(x))).toBeLessThan(1e-12);
      }),
    );
  });

  it('computes powers', () => {
    expect(dpow(2, 10)).toBeCloseTo(1024, 9);
    expect(dpow(0.5, 1.4)).toBeCloseTo(0.5 ** 1.4, 12);
  });

  it('keeps probabilities inside (0, 1)', () => {
    expect(logistic(0)).toBe(0.5);
    expect(shiftProbability(0.35, 0)).toBeCloseTo(0.35, 9);
    expect(shiftProbability(0.99, 10)).toBeLessThan(1);
    expect(shiftProbability(0.01, -10)).toBeGreaterThan(0);
  });

  it('apportions integers that sum to the total', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.01, max: 40, noNaN: true }), { minLength: 1, maxLength: 15 }),
        fc.integer({ min: 0, max: 300 }),
        (weights, total) => {
          const parts = apportion(total, weights);
          expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
        },
      ),
    );
  });
});

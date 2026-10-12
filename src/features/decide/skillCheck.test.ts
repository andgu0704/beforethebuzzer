import { describe, expect, it } from 'vitest';

import { timingQuality, zoneWidth } from './skill';

describe('the skill-check meter', () => {
  it('gives better players a wider zone', () => {
    expect(zoneWidth(80)).toBeGreaterThan(zoneWidth(40));
  });

  it('scores dead centre best, the zone edge well, and a miss down to nothing', () => {
    const w = zoneWidth(50);
    expect(timingQuality(0.5, 0.5, w)).toBe(1);
    expect(timingQuality(0.5 + w / 2, 0.5, w)).toBeCloseTo(0.75);
    expect(timingQuality(0.5 + w / 2 + 0.1, 0.5, w)).toBeLessThan(0.75);
    expect(timingQuality(0.99, 0.2, w)).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';

import { dayLabel, weekRange } from './views';

describe('dates', () => {
  it('never runs past the end of a month', () => {
    expect(weekRange(1)).toBe('Jan 1–7');
    expect(weekRange(26)).toBe('Jun 25–Jul 1');
    expect(dayLabel(48, 6)).toBe('Dec 2');
    for (let w = 1; w <= 52; w++)
      for (let o = 0; o < 7; o++)
        expect(Number(dayLabel(w, o).split(' ')[1])).toBeLessThanOrEqual(31);
  });
});

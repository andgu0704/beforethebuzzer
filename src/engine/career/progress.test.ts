import { describe, expect, it } from 'vitest';

import { content } from '@/content';

import { indexContent } from '../content/registry';
import { weekIndex } from '../core/calendar';
import { finalMomentWindow } from '../game/moments';
import type { LiveGame } from '../game/types';
import { testPlayer } from '../testing/creation';
import { createCareer } from './create';
import { fadeStock, quietWeekReaction, STOCK_CARRY } from './progress';

const index = indexContent(content);

describe('draft stock', () => {
  it('carries only part of last season into the next', () => {
    const state = createCareer(index, testPlayer('stock-a'));
    state.career.stock = 6;
    fadeStock(state);
    expect(state.career.stock).toBeCloseTo(6 * STOCK_CARRY);
    state.career.stock = -2;
    fadeStock(state);
    expect(state.career.stock).toBeCloseTo(-2 * STOCK_CARRY);
  });
});

describe('quiet weeks', () => {
  it('only draw a post when nothing else happened that week', () => {
    let posted = 0;
    for (let i = 0; i < 12; i++) {
      const state = createCareer(index, testPlayer(`quiet-${i}`));
      const now = weekIndex(state.world.date);
      state.career.feed = state.career.feed.filter((f) => weekIndex(f.date) !== now);
      quietWeekReaction(state, index);
      const posts = state.career.feed.filter((f) => f.social?.template.startsWith('quiet_week'));
      expect(posts.length).toBeLessThanOrEqual(1);
      posted += posts.length;
      // A second call in the same week finds the post and stays quiet.
      quietWeekReaction(state, index);
      expect(state.career.feed.filter((f) => f.social).length).toBe(posts.length);
    }
    expect(posted).toBeGreaterThan(0);

    const busy = createCareer(index, testPlayer('quiet-busy'));
    const before = busy.career.feed.length;
    expect(busy.career.feed.some((f) => weekIndex(f.date) === weekIndex(busy.world.date))).toBe(
      true,
    );
    quietWeekReaction(busy, index);
    expect(busy.career.feed.length).toBe(before);
  });
});

describe('final-seconds moments', () => {
  const live = (period: number, clock: number, score: [number, number]) =>
    ({ rulesId: 'college', period, clock, score }) as unknown as LiveGame;

  it('open only late in the last period of a close game', () => {
    expect(finalMomentWindow(live(2, 20, [60, 58]), 0)).toBe(true);
    expect(finalMomentWindow(live(2, 20, [58, 64]), 0)).toBe(true);
    expect(finalMomentWindow(live(2, 20, [50, 64]), 0)).toBe(false);
    expect(finalMomentWindow(live(2, 90, [60, 58]), 0)).toBe(false);
    expect(finalMomentWindow(live(1, 20, [60, 58]), 0)).toBe(false);
  });
});

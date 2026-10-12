import { describe, expect, it } from 'vitest';

import { content } from '@/content';

import { BOTS, planSize } from '../bots/bots';
import { playCareer } from '../bots/run';
import { indexContent } from '../content/registry';
import { deserialise, serialise } from '../save/store';
import { testPlayer } from '../testing/creation';
import { createCareer } from './create';
import { advance, advanceSlice, resolve } from './turn';

const index = indexContent(content);

describe('a whole career', () => {
  it('runs from the showcase to draft night and ends with a result', () => {
    const run = playCareer(index, testPlayer('career-a'), BOTS.casual);
    expect(run.ending).not.toBeNull();
    expect(['draft', 'undrafted']).toContain(run.ending?.reason);
    expect(run.interrupts['offers']).toBe(1);
    expect(run.interrupts['draftNight']).toBe(1);
    expect(run.moments.taken).toBeGreaterThan(10);
    expect(run.state.career.timeline.length).toBeGreaterThan(5);
  }, 120_000);

  it('plays identically when saved and reloaded at every decision', () => {
    const straight = playCareer(index, testPlayer('career-b'), BOTS.expert, { maxWeeks: 70 });
    const reloaded = playCareer(index, testPlayer('career-b'), BOTS.expert, {
      maxWeeks: 70,
      onInterrupt: (state) => deserialise(serialise(state)),
    });
    expect(serialise(reloaded.state)).toBe(serialise(straight.state));
  }, 240_000);

  it('round-trips a save exactly', () => {
    const run = playCareer(index, testPlayer('career-c'), BOTS.naive, { maxWeeks: 40 });
    const text = serialise(run.state);
    expect(deserialise(text)).toEqual(run.state);
  }, 120_000);

  it('never plans more than ten blocks', () => {
    const run = playCareer(index, testPlayer('career-d'), BOTS.expert, { maxWeeks: 30 });
    for (const bot of Object.values(BOTS))
      expect(planSize(bot.plan(run.state, index))).toBeLessThanOrEqual(10);
  }, 120_000);
});

describe('sliced weeks', () => {
  it('end in the same state as whole weeks', () => {
    const a = createCareer(index, testPlayer('slices'));
    const b = createCareer(index, testPlayer('slices'));
    const bot = BOTS.expert;
    for (let week = 0; week < 30; week++) {
      for (let guard = 0; guard < 50; guard++) {
        const step = advance(a, index);
        if (step.kind !== 'interrupt') break;
        resolve(a, index, step.interrupt.id, bot.choose(a, index, step.interrupt));
      }
      for (let guard = 0; guard < 500; guard++) {
        const step = advanceSlice(b, index, 1);
        if (step.kind === 'yield') continue;
        if (step.kind !== 'interrupt') break;
        resolve(b, index, step.interrupt.id, bot.choose(b, index, step.interrupt));
      }
    }
    expect(serialise(b)).toBe(serialise(a));
  });
});

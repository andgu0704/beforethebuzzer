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
    // Undrafted underclassmen can go back to school, so a career can reach more than one draft
    // night; every night that ends undrafted asks what next.
    expect(run.interrupts['draftNight']).toBeGreaterThanOrEqual(1);
    const drafted = run.ending?.reason === 'draft' ? 1 : 0;
    expect(run.interrupts['afterDraft'] ?? 0).toBe((run.interrupts['draftNight'] ?? 0) - drafted);
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

describe('social posts', () => {
  it('do not repeat a template among recent posts', () => {
    const run = playCareer(index, testPlayer('social-repeat'), BOTS.casual);
    const posts = run.state.career.feed.filter((f) => f.social).map((f) => f.social?.template);
    for (let i = 1; i < posts.length; i++) expect(posts[i]).not.toBe(posts[i - 1]);
  });
});

describe('going undrafted', () => {
  /** Plays a naive career (it declares early) until the after-draft choice comes up. */
  function untilAfterDraft(seed: string) {
    const state = createCareer(index, testPlayer(seed));
    for (let guard = 0; guard < 20000; guard++) {
      if (state.career.cursor.stage === 'idle') state.career.plan = BOTS.naive.plan(state, index);
      const step = advance(state, index);
      if (step.kind === 'ended') return null;
      if (step.kind !== 'interrupt') continue;
      if (step.interrupt.kind === 'afterDraft') return { state, interrupt: step.interrupt };
      resolve(state, index, step.interrupt.id, BOTS.naive.choose(state, index, step.interrupt));
    }
    return null;
  }

  function firstUndrafted() {
    for (let i = 0; i < 12; i++) {
      const found = untilAfterDraft(`undrafted-${i}`);
      if (found) return found;
    }
    throw new Error('no seed went undrafted with eligibility left');
  }

  it('lets an underclassman go back to college for the next season', () => {
    const { state, interrupt } = firstUndrafted();
    const user = state.world.people[state.career.playerId];
    const yearBefore =
      user?.kind === 'player' && user.affiliation.kind === 'college'
        ? user.affiliation.classYear
        : 0;
    expect(interrupt.seasonsLeft).toBe(4 - yearBefore);
    resolve(state, index, interrupt.id, 'returnToSchool');
    expect(state.career.ending).toBeNull();
    expect(state.career.stage).toBe('college');
    expect(state.career.draft.declared).toBe(false);
    expect(state.career.agentId).toBeNull();
    // Play on into the next season: he is still on the team, a year older.
    for (let weeks = 0; weeks < 20;) {
      const step = advance(state, index);
      if (step.kind === 'ended') break;
      if (step.kind === 'weekDone') weeks++;
      else
        resolve(state, index, step.interrupt.id, BOTS.naive.choose(state, index, step.interrupt));
    }
    const after = state.world.people[state.career.playerId];
    expect(after?.kind === 'player' && after.affiliation.kind === 'college').toBe(true);
    if (after?.kind === 'player' && after.affiliation.kind === 'college') {
      expect(after.affiliation.classYear).toBe(yearBefore + 1);
      expect(state.world.teams[after.affiliation.teamId]?.roster).toContain(after.id);
    }
    expect(state.career.ending).toBeNull();
  });

  it('ends the career when he chooses not to go back', () => {
    const { state, interrupt } = firstUndrafted();
    resolve(state, index, interrupt.id, 'endCareer');
    expect(state.career.ending?.reason).toBe('undrafted');
    expect(advance(state, index).kind).toBe('ended');
  });
});

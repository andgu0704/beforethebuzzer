import { describe, expect, it } from 'vitest';

import { content } from '@/content';

import { BOTS } from '../bots/bots';
import { playCareer } from '../bots/run';
import { indexContent } from '../content/registry';
import { asTeamId } from '../core/ids';
import { testPlayer } from '../testing/creation';
import { simulateAhead } from './ahead';
import { createCareer } from './create';
import { forceNextMoment, revealHidden, setDraftingTeam, setSkill, unlockGodMode } from './godmode';
import { userOf } from './state';
import { advance, resolve } from './turn';

const index = indexContent(content);

describe('God Mode', () => {
  it('is locked until unlocked, and marks the career on first use', () => {
    const state = createCareer(index, testPlayer('god-a'));
    expect(() => {
      setSkill(state, 'shooting', 90);
    }).toThrow();
    unlockGodMode(state);
    expect(state.meta.integrity.godMode).toBe(false);
    setSkill(state, 'shooting', 90);
    expect(userOf(state).skills.shooting).toBe(90);
    expect(state.meta.integrity.godMode).toBe(true);
    expect(state.meta.integrity.log).toHaveLength(1);
    expect(revealHidden(state).ceiling.shooting).toBeGreaterThanOrEqual(90);
  });

  it('forces the next key moment', () => {
    const state = createCareer(index, testPlayer('god-b'));
    unlockGodMode(state);
    let checked = false;
    for (let guard = 0; guard < 2000 && !checked; guard++) {
      const step = advance(state, index);
      if (step.kind !== 'interrupt') continue;
      const i = step.interrupt;
      const isPain =
        i.kind === 'keyMoment' && index.moment.get(i.momentId)?.options[0]?.action.kind === 'pain';
      if (i.kind === 'keyMoment' && !isPain) {
        forceNextMoment(state, 'failure');
        const result = resolve(state, index, i.id, i.options[0] ?? '') as { success: boolean };
        expect(result.success).toBe(false);
        checked = true;
      } else resolve(state, index, i.id, BOTS.casual.choose(state, index, i));
    }
    expect(checked).toBe(true);
  });

  it('chooses the drafting team', () => {
    const team = asTeamId('los_angeles_comets');
    let set = false;
    const run = playCareer(index, testPlayer('god-c'), BOTS.casual, {
      onInterrupt: (state) => {
        if (!set) {
          unlockGodMode(state);
          setDraftingTeam(state, team);
          set = true;
        }
        return state;
      },
    });
    expect(run.ending?.teamId).toBe(team);
    expect(run.state.meta.integrity.godMode).toBe(true);
  }, 180_000);
});

describe('simulate ahead', () => {
  it('passes quiet summer weeks and stops when something needs him', () => {
    const state = createCareer(index, testPlayer('ahead-a'));
    // Get through the spring decisions first.
    for (let guard = 0; guard < 500 && state.career.committedTo === null; guard++) {
      const step = advance(state, index);
      if (step.kind === 'interrupt')
        resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
    }
    const result = simulateAhead(state, index, { maxWeeks: 8 });
    expect(result.weeks).toBeGreaterThan(0);
    expect(['interrupt', 'notable', 'limit']).toContain(result.stop);
    if (result.stop === 'interrupt') expect(state.career.pending[0]?.id).toBe(result.interrupt?.id);
  }, 60_000);
});

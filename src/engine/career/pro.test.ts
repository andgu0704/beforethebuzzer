import { describe, expect, it } from 'vitest';

import { content } from '@/content';

import { BOTS } from '../bots/bots';
import { playCareer } from '../bots/run';
import { seasonOf, WEEK } from '../core/calendar';
import { asTeamId } from '../core/ids';
import { indexContent } from '../content/registry';
import type { Interrupt } from '../model/career';
import { encodeState } from '../save/codec';
import { deserialise, serialise } from '../save/store';
import { testPlayer } from '../testing/creation';
import { setDraftingTeam, unlockGodMode } from './godmode';
import { contractFor, LAST_AGE } from './pro';
import { userOf, userTeamId, type GameState } from './state';
import { advance, resolve } from './turn';

const index = indexContent(content);
const TEAM = asTeamId('los_angeles_comets');

/** A career played to draft night with the pick fixed, so the pro tests start from one state. */
let drafted: string | null = null;
function draftedState(): GameState {
  if (!drafted) {
    let set = false;
    const run = playCareer(index, testPlayer('pro-a'), BOTS.casual, {
      onInterrupt: (state) => {
        if (!set) {
          unlockGodMode(state);
          setDraftingTeam(state, TEAM);
          set = true;
        }
        return state;
      },
    });
    drafted = serialise(run.state);
  }
  return deserialise(drafted);
}

/** Makes him `age` by next summer (birth year is read-only in the model, not in a test). */
function setAge(state: GameState, age: number): void {
  (userOf(state) as { birthYear: number }).birthYear = state.world.date.year - age;
}

/** Plays on with a bot until `stop` holds, an interrupt `until` matches, or the weeks run out. */
function playOn(
  state: GameState,
  weeks: number,
  until?: (i: Interrupt) => boolean,
): Interrupt | null {
  for (let done = 0; done < weeks;) {
    const step = advance(state, index);
    if (step.kind === 'ended') return null;
    if (step.kind === 'weekDone') {
      done++;
      continue;
    }
    if (until?.(step.interrupt)) return step.interrupt;
    resolve(state, index, step.interrupt.id, BOTS.casual.choose(state, index, step.interrupt));
  }
  return null;
}

describe('the pro career', () => {
  it('carries on after the draft: a roster spot, a rookie deal and no ending', () => {
    const state = draftedState();
    expect(state.career.stage).toBe('pro');
    expect(state.career.ending).toBeNull();
    expect(userTeamId(state)).toBe(TEAM);
    expect(state.world.teams[TEAM]?.roster).toContain(state.career.playerId);
    const next = contractFor(state, seasonOf(state.world.date) + 1);
    expect(next?.kind).toBe('rookie');
  }, 180_000);

  it('plays pro games, gets paid and keeps going into the season', () => {
    const state = draftedState();
    const money = state.career.money;
    const games = state.career.feats.wins;
    // From draft week into the pro season (it starts in late October).
    playOn(state, 30);
    expect(state.career.ending).toBeNull();
    expect(state.career.stage).toBe('pro');
    expect(state.career.money).toBeGreaterThan(money + 100_000);
    const proGames = Object.values(state.world.games).filter(
      (g) => g.league === 'pro' && g.result && (g.home === TEAM || g.away === TEAM),
    );
    expect(proGames.length).toBeGreaterThan(5);
    expect(state.career.feats.wins).toBeGreaterThanOrEqual(games);
    // His own games are his: each shows up in the feed with his line.
    const mine = state.career.feed.filter(
      (f) => f.kind === 'game' && proGames.some((g) => g.id === f.gameId),
    );
    expect(mine.length).toBeGreaterThan(5);
  }, 240_000);

  it('asks for a new deal when his runs out, and signing moves him', () => {
    const state = draftedState();
    // Tear up the rookie deal so the next summer is a free-agency summer.
    for (const [id, c] of Object.entries(state.world.contracts))
      if (c.playerId === state.career.playerId) delete state.world.contracts[id];
    const ask = playOn(state, 60, (i) => i.kind === 'contract');
    expect(ask?.kind).toBe('contract');
    if (ask?.kind !== 'contract') return;
    expect(state.world.date.week).toBe(WEEK.summerStart);
    expect(ask.offers.length).toBeGreaterThan(0);
    const pick = ask.offers.find((o) => !o.current) ?? ask.offers[0];
    if (!pick) return;
    resolve(state, index, ask.id, pick.teamId);
    expect(userTeamId(state)).toBe(pick.teamId);
    expect(state.world.teams[pick.teamId]?.roster).toContain(state.career.playerId);
    const deal = contractFor(state, seasonOf(state.world.date));
    expect(deal?.teamId).toBe(pick.teamId);
    expect(deal?.salary).toBe(pick.salary);
    if (!pick.current) {
      for (const t of Object.values(state.world.teams))
        if (t.id !== pick.teamId) expect(t.roster).not.toContain(state.career.playerId);
    }
  }, 240_000);

  it('asks a veteran about one more year, and retiring ends the career', () => {
    const state = draftedState();
    setAge(state, 34);
    const ask = playOn(state, 60, (i) => i.kind === 'retire');
    expect(ask?.kind).toBe('retire');
    if (!ask) return;
    resolve(state, index, ask.id, 'retire');
    expect(state.career.stage).toBe('retired');
    expect(state.career.ending?.reason).toBe('retired');
    expect(userOf(state).affiliation.kind).toBe('retired');
    expect(advance(state, index).kind).toBe('ended');
  }, 240_000);

  it('retires him at the last age whatever he wants', () => {
    const state = draftedState();
    setAge(state, LAST_AGE);
    playOn(state, 60);
    expect(state.career.ending?.reason).toBe('retired');
  }, 240_000);
});

describe('save migration', () => {
  it('turns a version-1 career that ended on draft night into a pro career', () => {
    const state = draftedState();
    const doc = JSON.parse(encodeState(state)) as {
      format: number;
      state: { format: number; career: Record<string, unknown> };
    };
    doc.format = 1;
    doc.state.format = 1;
    doc.state.career['stage'] = 'drafted';
    doc.state.career['ending'] = { reason: 'draft', date: state.world.date, pick: 5, teamId: TEAM };
    for (const key of ['skillPoints', 'skillPointsEarned', 'approach', 'awardsSeen'])
      delete doc.state.career[key];
    const loaded = deserialise(JSON.stringify(doc));
    expect(loaded.format).toBe(2);
    expect(loaded.career.stage).toBe('pro');
    expect(loaded.career.ending).toBeNull();
    expect(loaded.career.skillPoints).toBe(9);
    expect(loaded.career.approach).toBe('team');
    expect(advance(loaded, index).kind).not.toBe('ended');
  }, 180_000);
});

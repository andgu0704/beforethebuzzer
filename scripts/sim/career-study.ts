import { BOTS, type Bot } from '@/engine/bots/bots';
import { playCareer } from '@/engine/bots/run';
import type { ContentIndex } from '@/engine/content/registry';
import { isPlayer } from '@/engine/model/person';
import { serialise } from '@/engine/save/store';
import { randomCreation } from '@/engine/testing/creation';

export interface CareerResult {
  readonly policy: Bot['name'];
  readonly seed: string;
  /** Draft pick, 61 for undrafted. */
  readonly pick: number;
  readonly collegeSeasons: number;
  readonly lastPpg: number;
  readonly lastMpg: number;
  readonly recruitRank: number;
  readonly moments: number;
  readonly momentSuccess: number;
  readonly caps: number;
  readonly traits: number;
  readonly ineligibleGames: number;
  readonly weeks: number;
  readonly ms: number;
  readonly saveMb: number;
}

export function careerStudy(index: ContentIndex, policy: Bot['name'], seed: string): CareerResult {
  const started = performance.now();
  const input = randomCreation(index, seed);
  const run = playCareer(index, input, BOTS[policy]);
  const user = run.state.world.people[run.state.career.playerId];
  const lines = isPlayer(user)
    ? user.lines.filter((l) => l.league === 'college' && !l.competition)
    : [];
  const last = lines[lines.length - 1];
  const ineligible = run.state.career.feed.filter(
    (f) => f.message.key === 'feed.game.missed.ineligible',
  ).length;
  return {
    policy,
    seed,
    pick: run.ending?.pick ?? 61,
    collegeSeasons: lines.length,
    lastPpg: last && last.gp > 0 ? last.pts / last.gp : 0,
    lastMpg: last && last.gp > 0 ? last.min / last.gp : 0,
    recruitRank: isPlayer(user) ? (user.recruitRank ?? 0) : 0,
    moments: run.moments.taken,
    momentSuccess: run.moments.taken > 0 ? run.moments.succeeded / run.moments.taken : 0,
    caps: run.state.career.feats.internationalCaps,
    traits: isPlayer(user) ? user.traits.length - 2 : 0,
    ineligibleGames: ineligible,
    weeks: run.weeks,
    ms: performance.now() - started,
    saveMb: serialise(run.state).length / 1e6,
  };
}

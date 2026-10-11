import { seasonOf } from '../core/calendar';
import { asContractId, nextId, type PersonId, type TeamId } from '../core/ids';
import { clamp, dpow } from '../core/math';
import { createRng, type Rng } from '../core/rng';
import { isPlayer, type Player } from '../model/person';
import type { ProTeam } from '../model/team';
import type { CombineResult, DraftPick, DraftState, World } from '../model/world';
import { winPct } from '../season/standings';
import { eligibleProspects, rankProspects, scout, type StockAdjustments } from './scouting';

export const PICKS = 60;
/** Lottery odds (per 1,000) for the 14 non-playoff teams, worst first. */
const LOTTERY_ODDS = [140, 140, 140, 125, 105, 90, 75, 60, 45, 30, 20, 15, 10, 5];

/**
 * Early-entry decisions for everyone but the user. Seniors are in automatically; underclassmen
 * and overseas prospects declare if scouts rate them highly enough.
 */
export function openDraft(
  world: World,
  userId: PersonId | null,
  adjustments: StockAdjustments = {},
): DraftState {
  const season = seasonOf(world.date);
  const rng = createRng(world.seed, 'declare', season);
  const ranked = rankProspects(world, eligibleProspects(world), adjustments);
  const pool: PersonId[] = [];
  ranked.forEach((view, rank) => {
    const p = world.people[view.playerId];
    if (!isPlayer(p) || p.id === userId) return;
    const senior = p.affiliation.kind === 'college' && p.affiliation.classYear === 4;
    const declareChance =
      rank < 25 ? 0.95 : rank < 45 ? 0.75 : rank < 70 ? 0.4 : rank < 110 ? 0.12 : 0.02;
    if (senior ? rank < 220 : rng.chance(declareChance)) pool.push(p.id);
  });
  const draft: DraftState = {
    season,
    pool,
    board: [],
    previousBoard: [],
    picks: [],
    next: 0,
    combine: {},
  };
  world.draft = draft;
  updateBoard(world, adjustments);
  return draft;
}

export function updateBoard(world: World, adjustments: StockAdjustments = {}): void {
  const draft = world.draft;
  if (!draft) return;
  const players = draft.pool.map((id) => world.people[id]).filter(isPlayer);
  draft.previousBoard = draft.board;
  draft.board = rankProspects(world, players, adjustments).map((v) => v.playerId);
}

/** Underclassmen who tested the waters and look like second-rounders go back to school. */
export function npcWithdrawals(world: World, userId: PersonId | null): void {
  const draft = world.draft;
  if (!draft) return;
  const rng = createRng(world.seed, 'withdraw', draft.season);
  draft.pool = draft.pool.filter((id) => {
    if (id === userId) return true;
    const p = world.people[id];
    if (!isPlayer(p)) return false;
    const rank = draft.board.indexOf(id);
    const underclass = p.affiliation.kind === 'college' && p.affiliation.classYear < 4;
    if (!underclass) return true;
    return !(rank > 40 && rng.chance(rank > 70 ? 0.8 : 0.5));
  });
  updateBoard(world);
}

export function runCombine(world: World): void {
  const draft = world.draft;
  if (!draft) return;
  for (const id of draft.pool) {
    const p = world.people[id];
    if (!isPlayer(p)) continue;
    draft.combine[id] = combineFor(createRng(world.seed, 'combine', id), p);
  }
}

export function combineFor(rng: Rng, p: Player): CombineResult {
  const ath = p.skills.athleticism;
  return {
    heightInShoesCm: p.heightCm + 3,
    wingspanCm: p.wingspanCm,
    standingReachCm: Math.round(p.heightCm * 1.33 + (p.wingspanCm - p.heightCm) * 0.5),
    verticalCm: Math.round(
      clamp(60 + ath * 0.38 + rng.normal(0, 3) - (p.heightCm - 195) * 0.25, 55, 110),
    ),
    laneAgilitySec:
      Math.round(
        clamp(12.6 - ath * 0.022 + (p.heightCm - 195) * 0.012 + rng.normal(0, 0.15), 10, 13.5) *
          100,
      ) / 100,
    sprintSec:
      Math.round(
        clamp(3.6 - ath * 0.0055 + (p.heightCm - 195) * 0.002 + rng.normal(0, 0.04), 2.9, 3.8) *
          100,
      ) / 100,
    shooting: Math.round(clamp(4 + p.skills.shooting * 0.2 + rng.normal(0, 2), 0, 25)),
  };
}

/** Lottery for the top four picks among non-playoff teams, then reverse standings. */
export function setDraftOrder(world: World, playoffTeams: readonly TeamId[]): void {
  const season = seasonOf(world.date);
  const s = world.seasons[String(season)];
  const draft = world.draft;
  if (!s || !draft) return;
  const rng = createRng(world.seed, 'lottery', season);
  const teams = Object.values(world.teams).filter((t): t is ProTeam => t.kind === 'pro');
  const byRecord = [...teams].sort(
    (a, b) => winPct(s.pro.records[a.id]) - winPct(s.pro.records[b.id]) || (a.id < b.id ? -1 : 1),
  );
  const lotteryTeams = byRecord.filter((t) => !playoffTeams.includes(t.id)).slice(0, 14);
  const rest = byRecord.filter((t) => !lotteryTeams.includes(t));
  const winners: ProTeam[] = [];
  for (let pick = 0; pick < 4; pick++) {
    const remaining = lotteryTeams.filter((t) => !winners.includes(t));
    const odds = remaining.map((t) => LOTTERY_ODDS[lotteryTeams.indexOf(t)] ?? 1);
    const choice = rng.weighted(
      remaining.map((t, i) => ({ t, w: odds[i] ?? 1 })),
      (x) => x.w,
    ).t;
    winners.push(choice);
  }
  const firstRound = [...winners, ...lotteryTeams.filter((t) => !winners.includes(t)), ...rest];
  s.pro.lottery = firstRound
    .slice(0, 14)
    .map((t, i) => ({ teamId: t.id, pick: i + 1, from: lotteryTeams.indexOf(t) + 1 }));
  s.pro.draftOrder = firstRound.map((t) => t.id);
  const order = [...firstRound, ...byRecord];
  draft.picks = order.map((t, i): DraftPick => ({
    pick: i + 1,
    round: i < 30 ? 1 : 2,
    teamId: t.id,
    playerId: null,
  }));
}

/** How one team values a prospect: the consensus view bent by its needs and temperament. */
export function teamValue(
  world: World,
  team: ProTeam,
  p: Player,
  consensus: number,
  current: number,
  ceiling: number,
): number {
  const rng = createRng(world.seed, 'teamboard', team.id, p.id);
  const sameSpot = team.roster.filter((id) => {
    const q = world.people[id];
    return isPlayer(q) && q.position === p.position;
  }).length;
  let value = consensus + rng.normal(0, 1.6);
  switch (team.gm.temperament) {
    case 'upside':
      value += (ceiling - current) * 0.15;
      break;
    case 'safe':
      value += (current - 50) * 0.12;
      break;
    case 'need':
      value += sameSpot <= 2 ? 1.5 : sameSpot >= 4 ? -1.5 : 0;
      break;
    case 'bestAvailable':
      break;
  }
  if (p.nation !== 'USA') value += team.gm.internationalBias * 2;
  return value;
}

/** Makes the next pick. `forced` lets God Mode or a promise choose the player. */
export function makePick(
  world: World,
  forced: PersonId | null = null,
  adjustments: StockAdjustments = {},
): DraftPick | null {
  const draft = world.draft;
  if (!draft) return null;
  const pick = draft.picks[draft.next];
  if (!pick) return null;
  const team = world.teams[pick.teamId];
  if (team?.kind !== 'pro') return null;
  const taken = new Set(draft.picks.map((p) => p.playerId).filter((x): x is PersonId => !!x));
  let chosen: PersonId | null = forced && !taken.has(forced) ? forced : null;
  if (!chosen) {
    let best = -Infinity;
    // Teams look at the top of the board, not every name in the pool.
    for (const id of draft.board.slice(0, draft.next + 30)) {
      if (taken.has(id)) continue;
      const p = world.people[id];
      if (!isPlayer(p)) continue;
      const view = scout(world, p, adjustments);
      const value = teamValue(world, team, p, view.score, view.current, view.ceiling);
      if (value > best) {
        best = value;
        chosen = id;
      }
    }
  }
  pick.playerId = chosen;
  draft.next += 1;
  return pick;
}

/** Signs a drafted player to his rookie deal and moves him to the team. */
export function signDraftee(world: World, pick: DraftPick): void {
  if (!pick.playerId) return;
  const p = world.people[pick.playerId];
  const team = world.teams[pick.teamId];
  if (!isPlayer(p) || team?.kind !== 'pro') return;
  const season = world.draft?.season ?? seasonOf(world.date);
  p.draft = { season, pick: pick.pick, teamId: pick.teamId };
  endStint(p, season);
  leaveTeam(world, p);
  p.affiliation = { kind: 'pro', teamId: team.id };
  p.stints.push({ team: team.id, league: 'pro', fromSeason: season + 1, toSeason: null });
  team.roster.push(p.id);
  const id = asContractId(nextId(world.counters, 'contract', 'c'));
  world.contracts[id] = {
    id,
    playerId: p.id,
    teamId: team.id,
    salary: rookieScale(pick.pick),
    firstSeason: season + 1,
    lastSeason: season + (pick.round === 1 ? 4 : 2),
    kind: pick.round === 1 ? 'rookie' : 'minimum',
    playerOption: false,
    noTrade: false,
  };
  world.transactions.push({
    kind: 'drafted',
    date: world.date,
    playerId: p.id,
    teamId: team.id,
    pick: pick.pick,
  });
}

/** First-year salary by pick, in dollars. */
export function rookieScale(pick: number): number {
  if (pick > 30) return 1_300_000;
  return Math.round((11_000_000 * dpow(0.915, pick - 1) + 2_000_000) / 10_000) * 10_000;
}

export function endStint(p: Player, season: number): void {
  for (const s of p.stints) if (s.toSeason === null) s.toSeason = season;
}

/** Removes a player from whichever college or pro roster currently lists him. */
export function leaveTeam(world: World, p: Player): void {
  const a = p.affiliation;
  if (a.kind !== 'college' && a.kind !== 'pro') return;
  const team = world.teams[a.teamId];
  if (team) team.roster = team.roster.filter((id) => id !== p.id);
}

import { WEEK, seasonOf } from '@/engine/core/calendar';
import type { ContentIndex } from '@/engine/content/registry';
import type { LiveGame } from '@/engine/game/types';
import type { GameRecord, PlayerLine } from '@/engine/model/game';
import { isPlayer } from '@/engine/model/person';
import { simulateLeagueWeek, type LeagueContext } from '@/engine/season/league';
import { winPct } from '@/engine/season/standings';
import { createWorld } from '@/engine/world/create';

/** Sums collected per league, merged across workers. */
export interface LeagueTotals {
  teamGames: number;
  games: number;
  pts: number;
  ptsSq: number;
  poss: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  tov: number;
  orb: number;
  drb: number;
  ast: number;
  homeWins: number;
  neutralGames: number;
  overtimes: number;
  marginSq: number;
  bestWinPct: number[];
  worstWinPct: number[];
  topScorer: number[];
  msPerWeek: number[];
}

export function emptyTotals(): LeagueTotals {
  return {
    teamGames: 0,
    games: 0,
    pts: 0,
    ptsSq: 0,
    poss: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    tov: 0,
    orb: 0,
    drb: 0,
    ast: 0,
    homeWins: 0,
    neutralGames: 0,
    overtimes: 0,
    marginSq: 0,
    bestWinPct: [],
    worstWinPct: [],
    topScorer: [],
    msPerWeek: [],
  };
}

const sum = (lines: readonly PlayerLine[], key: keyof Omit<PlayerLine, 'id' | 'starter'>) =>
  lines.reduce((s, l) => s + l[key], 0);

function observe(t: LeagueTotals, game: GameRecord, live: LiveGame, periods: number): void {
  t.games += 1;
  for (const side of [0, 1] as const) {
    const lines = live.stats[side];
    const other = live.stats[side === 0 ? 1 : 0];
    const pts = live.score[side];
    t.teamGames += 1;
    t.pts += pts;
    t.ptsSq += pts * pts;
    t.fgm += sum(lines, 'fgm');
    t.fga += sum(lines, 'fga');
    t.tpm += sum(lines, 'tpm');
    t.tpa += sum(lines, 'tpa');
    t.ftm += sum(lines, 'ftm');
    t.fta += sum(lines, 'fta');
    t.tov += sum(lines, 'tov');
    t.orb += sum(lines, 'orb');
    t.drb += sum(other, 'drb');
    t.ast += sum(lines, 'ast');
    t.poss += sum(lines, 'fga') - sum(lines, 'orb') + sum(lines, 'tov') + 0.44 * sum(lines, 'fta');
  }
  const margin = live.score[0] - live.score[1];
  t.marginSq += margin * margin;
  if (game.neutral) t.neutralGames += 1;
  else if (margin > 0) t.homeWins += 1;
  if (live.period > periods) t.overtimes += 1;
}

/** Simulates `seasons` full league seasons with nobody watching and measures them. */
export function leagueStudy(
  index: ContentIndex,
  seed: string,
  seasons: number,
): { college: LeagueTotals; pro: LeagueTotals } {
  const college = emptyTotals();
  const pro = emptyTotals();
  const world = createWorld(index, seed, { year: 2030, week: WEEK.summerStart });
  const ctx: LeagueContext = {
    index,
    userId: null,
    userCollege: null,
    stock: {},
    nationalExclude: new Set(),
    userDraftNight: false,
  };
  const weeks = seasons * 52;
  for (let w = 0; w < weeks; w++) {
    const started = performance.now();
    simulateLeagueWeek(world, ctx, (game, live) => {
      if (game.kind === 'exhibition' || game.kind === 'showcase') return;
      if (game.league === 'college') observe(college, game, live, 2);
      if (game.league === 'pro' && game.kind === 'regular') observe(pro, game, live, 4);
    });
    const elapsed = performance.now() - started;
    if (
      world.date.week - 1 >= WEEK.nonConferenceStart ||
      world.date.week - 1 <= WEEK.conferenceStart + 8
    )
      college.msPerWeek.push(elapsed);
    // Season-level snapshots just before the postseason.
    const s = world.seasons[String(seasonOf(world.date))];
    if (world.date.week === WEEK.conferenceTournament && s)
      snapshot(world, s.college.records, college, 'college', seasonOf(world.date));
    if (world.date.week === WEEK.proSeasonEnd + 1 && s)
      snapshot(world, s.pro.records, pro, 'pro', seasonOf(world.date));
  }
  return { college, pro };
}

function snapshot(
  world: ReturnType<typeof createWorld>,
  records: Record<string, { w: number; l: number }>,
  t: LeagueTotals,
  league: 'college' | 'pro',
  season: number,
): void {
  const pcts = Object.values(records)
    .map((r) => winPct(r as never))
    .sort((a, b) => b - a);
  if (pcts.length === 0) return;
  t.bestWinPct.push(pcts[0] ?? 0);
  t.worstWinPct.push(pcts[pcts.length - 1] ?? 0);
  let top = 0;
  for (const p of Object.values(world.people)) {
    if (!isPlayer(p)) continue;
    const line = p.lines.find((l) => l.season === season && l.league === league && !l.competition);
    if (line && line.gp >= 15) top = Math.max(top, line.pts / line.gp);
  }
  t.topScorer.push(top);
}

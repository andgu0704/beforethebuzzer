import { asGameId } from '@/engine/core/ids';
import { createRng } from '@/engine/core/rng';
import { prepareTeam } from '@/engine/game/prepare';
import { COLLEGE_RULES, PRO_RULES, type LeagueRules } from '@/engine/game/rules';
import { runGame, startGame } from '@/engine/game/sim';
import { fixtureTeam } from '@/engine/testing/fixtures';
import type { PlayerLine } from '@/engine/model/game';

export interface GameDistribution {
  readonly games: number;
  readonly ppg: number;
  readonly ppgSd: number;
  readonly possessions: number;
  readonly fgPct: number;
  readonly tpPct: number;
  readonly ftPct: number;
  readonly threeShare: number;
  readonly tov: number;
  readonly orbPct: number;
  readonly ast: number;
  readonly astPerFgm: number;
  readonly stl: number;
  readonly blk: number;
  readonly fta: number;
  readonly pf: number;
  readonly homeWin: number;
  readonly overtime: number;
  readonly marginSd: number;
  readonly topScorer: number;
  readonly msPerGame: number;
}

function sum(lines: readonly PlayerLine[], key: keyof Omit<PlayerLine, 'id' | 'starter'>): number {
  let s = 0;
  for (const l of lines) s += l[key];
  return s;
}

export function measureGames(
  rules: LeagueRules,
  level: number,
  games: number,
  seed = 'calibration',
): GameDistribution {
  const rng = createRng(seed, 'teams', rules.id);
  const teams = Array.from({ length: 24 }, (_, i) => fixtureTeam(rng, `t${i}`, level));
  const points: number[] = [];
  const margins: number[] = [];
  let fgm = 0,
    fga = 0,
    tpm = 0,
    tpa = 0,
    ftm = 0,
    fta = 0,
    tov = 0,
    orb = 0,
    drb = 0,
    ast = 0,
    stl = 0,
    blk = 0,
    pf = 0;
  let homeWins = 0,
    ot = 0,
    topScorer = 0,
    possessions = 0;
  const started = performance.now();
  for (let n = 0; n < games; n++) {
    const h = teams[n % teams.length];
    const a = teams[(n * 7 + 3) % teams.length];
    if (!h || !a || h === a) continue;
    const home = prepareTeam({
      teamId: h.teamId,
      roster: h.roster,
      tactics: h.tactics,
      acumen: 50,
      rules,
    });
    const away = prepareTeam({
      teamId: a.teamId,
      roster: a.roster,
      tactics: a.tactics,
      acumen: 50,
      rules,
    });
    const live = startGame({
      gameId: asGameId(`g${n}`),
      rules,
      home: home.team,
      away: away.team,
      homeCourt: true,
      seed,
      recordPlays: false,
    });
    runGame(live, null);
    for (const side of [0, 1] as const) {
      const lines = live.stats[side];
      const other = live.stats[side === 0 ? 1 : 0];
      points.push(live.score[side]);
      fgm += sum(lines, 'fgm');
      fga += sum(lines, 'fga');
      tpm += sum(lines, 'tpm');
      tpa += sum(lines, 'tpa');
      ftm += sum(lines, 'ftm');
      fta += sum(lines, 'fta');
      tov += sum(lines, 'tov');
      orb += sum(lines, 'orb');
      drb += sum(other, 'drb');
      ast += sum(lines, 'ast');
      stl += sum(lines, 'stl');
      blk += sum(lines, 'blk');
      pf += sum(lines, 'pf');
      possessions +=
        sum(lines, 'fga') - sum(lines, 'orb') + sum(lines, 'tov') + 0.44 * sum(lines, 'fta');
      topScorer = Math.max(topScorer, ...lines.map((l) => l.pts));
    }
    margins.push(live.score[0] - live.score[1]);
    if (live.score[0] > live.score[1]) homeWins++;
    if (live.period > rules.periods) ot++;
  }
  const ms = (performance.now() - started) / games;
  const teamGames = points.length;
  const mean = points.reduce((s, p) => s + p, 0) / teamGames;
  const sd = Math.sqrt(points.reduce((s, p) => s + (p - mean) ** 2, 0) / teamGames);
  const mMean = margins.reduce((s, p) => s + p, 0) / margins.length;
  const mSd = Math.sqrt(margins.reduce((s, p) => s + (p - mMean) ** 2, 0) / margins.length);
  return {
    games,
    ppg: mean,
    ppgSd: sd,
    possessions: possessions / teamGames,
    fgPct: fgm / fga,
    tpPct: tpm / tpa,
    ftPct: ftm / fta,
    threeShare: tpa / fga,
    tov: tov / teamGames,
    orbPct: orb / (orb + drb),
    ast: ast / teamGames,
    astPerFgm: ast / fgm,
    stl: stl / teamGames,
    blk: blk / teamGames,
    fta: fta / teamGames,
    pf: pf / teamGames,
    homeWin: homeWins / margins.length,
    overtime: ot / margins.length,
    marginSd: mSd,
    topScorer,
    msPerGame: ms,
  };
}

if (process.argv[1]?.endsWith('game-calibration.ts')) {
  const n = Number(process.argv[2] ?? 2000);
  const fmt = (d: GameDistribution) =>
    Object.entries(d)
      .map(
        ([k, v]) =>
          `${k.padEnd(12)} ${typeof v === 'number' ? (Math.abs(v) < 1.5 ? v.toFixed(3) : v.toFixed(1)) : String(v)}`,
      )
      .join('\n');
  console.log('COLLEGE\n' + fmt(measureGames(COLLEGE_RULES, 46, n)));
  console.log('\nPRO\n' + fmt(measureGames(PRO_RULES, 63, n)));
}

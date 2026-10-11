import { seasonOf } from '../core/calendar';
import { createRng } from '../core/rng';
import type { PersonId, TeamId } from '../core/ids';
import { prepareTeam, type PlayerModifiers, type PreparedTeam, type Role } from '../game/prepare';
import { COLLEGE_RULES, INTERNATIONAL_RULES, PRO_RULES, type LeagueRules } from '../game/rules';
import { runGame, startGame } from '../game/sim';
import type { LiveGame } from '../game/types';
import type { BoxScore, GameRecord, PlayerLine } from '../model/game';
import { emptyTotals, isPlayer, type League, type Player, type SeasonLine } from '../model/person';
import type { World } from '../model/world';
import { rollInjury } from '../player/injury';
import { onTournamentGame } from '../tournament/engine';
import { recordResult } from './standings';

export function rulesForGame(game: GameRecord): LeagueRules {
  if (game.league === 'pro') return PRO_RULES;
  if (game.league === 'national') return INTERNATIONAL_RULES;
  return COLLEGE_RULES;
}

const DEFAULT_TACTICS = { pace: 50, threeRate: 50, pressure: 50, depth: 9 };

export interface TeamContext {
  /** Players who cannot play (suspended, ineligible, not selected). */
  readonly exclude?: ReadonlySet<PersonId>;
  readonly userRole?: Role;
  readonly modifiers?: ReadonlyMap<PersonId, PlayerModifiers>;
}

/** Turns a team's healthy, eligible roster into what the simulator needs. */
export function prepareFor(
  world: World,
  teamId: TeamId,
  rules: LeagueRules,
  ctx: TeamContext = {},
): PreparedTeam {
  const team = world.teams[teamId];
  const coach = team?.coachId ? world.people[team.coachId] : undefined;
  const roster: Player[] = [];
  for (const id of team?.roster ?? []) {
    const p = world.people[id];
    if (!isPlayer(p)) continue;
    if (p.injury && p.injury.weeksLeft > 0 && !p.injury.playedThrough) continue;
    if (ctx.exclude?.has(p.id)) continue;
    roster.push(p);
  }
  return prepareTeam({
    teamId,
    roster: roster.map((p) => ({
      id: p.id,
      position: p.position,
      style: p.style,
      skills: p.skills,
      heightCm: p.heightCm,
      wingspanCm: p.wingspanCm,
      confidence: p.confidence,
      energy: p.energy,
      health: p.injury?.playedThrough ? Math.min(p.health, 70) : p.health,
      isUser: p.isUser,
    })),
    tactics: coach?.kind === 'coach' ? coach.tactics : DEFAULT_TACTICS,
    acumen: coach?.kind === 'coach' ? coach.acumen : 50,
    rules,
    ...(ctx.userRole ? { userRole: ctx.userRole } : {}),
    ...(ctx.modifiers ? { modifiers: ctx.modifiers } : {}),
  });
}

export function startLeagueGame(
  world: World,
  game: GameRecord,
  recordPlays: boolean,
  home: TeamContext = {},
  away: TeamContext = {},
): LiveGame {
  const rules = rulesForGame(game);
  return startGame({
    gameId: game.id,
    rules,
    home: prepareFor(world, game.home, rules, home).team,
    away: prepareFor(world, game.away, rules, away).team,
    homeCourt: !game.neutral,
    seed: world.seed,
    recordPlays,
  });
}

/** Plays a game nobody is watching from start to finish. */
export function playLeagueGame(world: World, game: GameRecord, keepBox: boolean): LiveGame {
  const live = startLeagueGame(world, game, false);
  runGame(live, null);
  finishGame(world, game, live, keepBox);
  return live;
}

function leagueOf(game: GameRecord): League {
  return game.league;
}

/** Stores the result, credits every player's season line, rolls injuries and updates competitions. */
export function finishGame(world: World, game: GameRecord, live: LiveGame, keepBox: boolean): void {
  const box: BoxScore = {
    home: { teamId: game.home, players: live.stats[0] },
    away: { teamId: game.away, players: live.stats[1] },
  };
  game.result = {
    home: live.score[0],
    away: live.score[1],
    overtimes: Math.max(0, live.period - rulesForGame(game).periods),
    box: keepBox ? box : null,
  };
  const season = seasonOf(game.date);
  const competition =
    game.league === 'national' || game.kind === 'playoff'
      ? (game.tournamentId ?? undefined)
      : undefined;
  const injuryRng = createRng(world.seed, 'injury', game.id);
  for (const [teamId, lines] of [
    [game.home, live.stats[0]],
    [game.away, live.stats[1]],
  ] as const) {
    for (const line of lines) {
      const p = world.people[line.id];
      if (!isPlayer(p)) continue;
      creditLine(p, season, teamId, leagueOf(game), competition, line);
      if (!p.isUser && !p.injury) {
        const injury = rollInjury(injuryRng, game.date, line.sec / 60, 1);
        if (injury) p.injury = injury;
      }
    }
  }
  recordResult(world, game);
  onTournamentGame(world, game);
}

export function creditLine(
  p: Player,
  season: number,
  team: TeamId | string,
  league: League,
  competition: string | undefined,
  line: PlayerLine,
): void {
  if (line.sec <= 0 && !line.starter) return;
  let target: SeasonLine | undefined = p.lines.find(
    (l) =>
      l.season === season &&
      l.team === team &&
      l.league === league &&
      l.competition === competition,
  );
  if (!target) {
    target = { ...emptyTotals(), season, team, league, ...(competition ? { competition } : {}) };
    p.lines.push(target);
  }
  target.gp += 1;
  if (line.starter) target.gs += 1;
  target.min = Math.round((target.min + line.sec / 60) * 10) / 10;
  target.pts += line.pts;
  target.fgm += line.fgm;
  target.fga += line.fga;
  target.tpm += line.tpm;
  target.tpa += line.tpa;
  target.ftm += line.ftm;
  target.fta += line.fta;
  target.orb += line.orb;
  target.drb += line.drb;
  target.ast += line.ast;
  target.stl += line.stl;
  target.blk += line.blk;
  target.tov += line.tov;
  target.pf += line.pf;
}

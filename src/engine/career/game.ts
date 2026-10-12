import { ageAt, weekIndex } from '../core/calendar';
import { asInterruptId, nextId, type PersonId, type TeamId } from '../core/ids';
import { clamp } from '../core/math';
import { createRng } from '../core/rng';
import type { ContentIndex } from '../content/registry';
import type { GameContext, SocialTrigger } from '../content/story-types';
import {
  availableOptions,
  finalMomentWindow,
  pickMoment,
  resolveMoment,
  userIndexOn,
  type ClipSpec,
} from '../game/moments';
import type { PlayerModifiers } from '../game/prepare';
import { overallOf, type GameRatings } from '../game/ratings';
import {
  isLastPeriod,
  playScripted,
  removeFromGame,
  rulesFor,
  runGame,
  startGame,
} from '../game/sim';
import type { Side } from '../game/types';
import type { GameRecord, PlayerLine } from '../model/game';
import type { Approach, Interrupt, LiveUserGame } from '../model/career';
import { isPlayer } from '../model/person';
import { rollInjury } from '../player/injury';
import { finishGame, prepareFor, rulesForGame } from '../season/play';
import { meets } from './conditions';
import { changeStatus } from './effects';
import { socialReactions } from './social';
import { cause, msg, pushFeed, pushTimeline, teamRef, userOf, type GameState } from './state';
import { mergeTraits } from './traits';
import { earnPoints, gamePoints } from './upgrade';
import { checkTraitUnlocks } from './progress';

export function isUserGame(state: GameState, game: GameRecord): boolean {
  const user = userOf(state);
  for (const teamId of [game.home, game.away]) {
    const team = state.world.teams[teamId];
    if (team?.roster.includes(user.id)) return true;
  }
  return false;
}

function userSideOf(state: GameState, game: GameRecord): Side {
  return state.world.teams[game.home]?.roster.includes(state.career.playerId) ? 0 : 1;
}

export function contextOf(state: GameState, game: GameRecord, side: Side): GameContext {
  if (game.kind === 'showcase') return 'showcase';
  if (game.kind === 'exhibition') return 'exhibition';
  if (game.league === 'national') return 'international';
  const opponent = state.world.teams[side === 0 ? game.away : game.home];
  if (state.career.rivalId && opponent?.roster.includes(state.career.rivalId)) return 'rivalry';
  if (game.kind === 'tournament' || game.kind === 'playoff') return 'tournament';
  if (game.kind === 'conference') return 'conference';
  return 'regular';
}

/** Why the user cannot play this game, if he cannot. */
export function unavailableReason(
  state: GameState,
  game: GameRecord,
): 'injured' | 'suspended' | 'ineligible' | null {
  const user = userOf(state);
  if (user.injury && !user.injury.playedThrough) return 'injured';
  if (game.league === 'college' && state.career.suspendedGames > 0) return 'suspended';
  if (game.league === 'college' && state.career.ineligible && game.kind !== 'exhibition')
    return 'ineligible';
  return null;
}

/** What each pre-game approach does to his game: more shots, more passes, or more defence. */
export const APPROACH_EFFECTS: Readonly<
  Record<
    Approach,
    {
      readonly usageMul: number;
      readonly shotMod: number;
      readonly stamina: number;
      readonly ratingAdd: Readonly<Partial<GameRatings>>;
    }
  >
> = {
  team: { usageMul: 1, shotMod: 0, stamina: 0, ratingAdd: {} },
  score: { usageMul: 1.3, shotMod: -0.04, stamina: -3, ratingAdd: { pass: -4 } },
  facilitate: { usageMul: 0.78, shotMod: 0.03, stamina: 0, ratingAdd: { pass: 9, security: 3 } },
  defend: {
    usageMul: 0.9,
    shotMod: 0,
    stamina: -8,
    ratingAdd: { perD: 8, intD: 6, stl: 6, blk: 4 },
  },
};

function userModifiers(state: GameState, index: ContentIndex): Map<PersonId, PlayerModifiers> {
  const user = userOf(state);
  const t = mergeTraits(index, user);
  const form = state.career.form === 'hot' ? 0.08 : state.career.form === 'slump' ? -0.1 : 0;
  const hurt = user.injury?.playedThrough ? -0.15 : 0;
  const plan = APPROACH_EFFECTS[state.career.approach];
  return new Map([
    [
      user.id,
      {
        shotMod: t.shotMod + form + hurt + plan.shotMod,
        clutchMod: t.clutchMod,
        usageMul: t.usageMul * (state.career.form === 'hot' ? 1.1 : 1) * plan.usageMul,
        stamina: t.stamina + plan.stamina,
        ratingAdd: plan.ratingAdd,
      },
    ],
  ]);
}

/** The room's view of how he played it: the coach and teammates notice the approach he chose. */
function approachReaction(
  state: GameState,
  index: ContentIndex,
  line: PlayerLine,
  won: boolean,
  vsExpected: number,
): void {
  const reb = line.orb + line.drb;
  switch (state.career.approach) {
    case 'score':
      if (line.pts >= 20) changeStatus(state, index, 'reputation', 1.2);
      if (!won && vsExpected < 0) changeStatus(state, index, 'coachTrust', -1.2);
      if (line.ast <= 1) changeStatus(state, index, 'chemistry', -0.8);
      break;
    case 'facilitate':
      changeStatus(state, index, 'chemistry', line.ast >= 5 ? 2 : 0.8);
      if (line.ast >= 6) changeStatus(state, index, 'coachTrust', 1);
      state.career.relations.teammates = clamp(state.career.relations.teammates + 1.2, 0, 100);
      break;
    case 'defend':
      changeStatus(state, index, 'coachTrust', line.stl + line.blk >= 3 || reb >= 8 ? 1.8 : 0.6);
      break;
    case 'team':
      changeStatus(state, index, 'chemistry', 0.5);
      if (won) changeStatus(state, index, 'coachTrust', 0.4);
      break;
  }
}

/** Starts the user's game, or plays it straight through if he cannot take part. */
export function startUserGame(state: GameState, index: ContentIndex, game: GameRecord): void {
  const reason = unavailableReason(state, game);
  const side = userSideOf(state, game);
  const rules = rulesForGame(game);
  const userCtx = {
    ...(reason ? { exclude: new Set([state.career.playerId]) } : {}),
    ...(game.league === 'college' || game.league === 'pro'
      ? { userRole: state.career.role }
      : game.kind === 'showcase'
        ? { userRole: 'starter' as const }
        : {}),
    modifiers: userModifiers(state, index),
  };
  const ownTeam = prepareFor(state.world, side === 0 ? game.home : game.away, rules, userCtx);
  const otherTeam = prepareFor(state.world, side === 0 ? game.away : game.home, rules);
  const forced = state.career.godMode.forceNextGame;
  const live = startGame({
    gameId: game.id,
    rules,
    home: side === 0 ? ownTeam.team : otherTeam.team,
    away: side === 0 ? otherTeam.team : ownTeam.team,
    homeCourt: !game.neutral,
    seed: forced ? `${state.world.seed}#forced` : state.world.seed,
    recordPlays: true,
  });
  const tournament = game.tournamentId ? state.world.tournaments[game.tournamentId] : undefined;
  const [lo, hi] =
    tournament?.format.momentsPerGame ?? (game.kind === 'showcase' ? [1, 1] : [1, 2]);
  const budget = reason || forced ? 0 : createRng(state.world.seed, 'budget', game.id).int(lo, hi);
  state.career.cursor.finished = null;
  state.career.cursor.live = {
    gameId: game.id,
    live,
    userSide: side,
    momentBudget: budget,
    pendingMoment: null,
    context: contextOf(state, game, side),
    absent: reason,
  };
  if (reason === 'suspended') state.career.suspendedGames -= 1;
}

/**
 * Runs the live game until a key moment needs the user or the game ends.
 * Returns the key-moment interrupt, or null once the game is over.
 */
export function continueUserGame(state: GameState, index: ContentIndex): Interrupt | null {
  const current = state.career.cursor.live;
  if (!current) return null;
  const { live, userSide } = current;
  const game = state.world.games[current.gameId];
  if (!game) return null;
  const user = userOf(state);
  const forced = state.career.godMode.forceNextGame;
  const picked: { id: string | null } = { id: null };
  let knocked = false;
  const paused = runGame(live, (check) => {
    // One extra moment is allowed in the closing seconds of a close game, once the budget is spent.
    const extra =
      !current.absent &&
      !forced &&
      current.momentBudget === 0 &&
      finalMomentWindow(check.live, userSide)
        ? 1
        : 0;
    if (current.momentBudget + extra <= 0) return false;
    const knockRng = createRng(state.world.seed, 'knock', live.gameId, Math.round(live.elapsed));
    if (
      !knocked &&
      live.onCourt[userSide].includes(userIndexOn(live, userSide)) &&
      knockRng.chance(0.0012)
    )
      knocked = true;
    const moment = pickMoment(index.content.moments, {
      live: check.live,
      offense: check.offense,
      userSide,
      context: current.context as GameContext,
      role: state.career.role,
      style: user.style,
      traits: user.traits,
      hurt: knocked,
      budget: current.momentBudget + extra,
    });
    if (!moment) return false;
    const usable = availableOptions(moment, (o) => meets(state, index, o.requires));
    if (usable.length < 2) return false;
    picked.id = moment.id;
    current.pendingMoment = { momentId: moment.id, offense: check.offense };
    return true;
  });
  if (paused && picked.id) {
    const def = index.moment.get(picked.id);
    if (!def) return null;
    const interrupt: Interrupt = {
      id: asInterruptId(nextId(state.world.counters, 'interrupt', 'i')),
      kind: 'keyMoment',
      momentId: def.id,
      options: availableOptions(def, (o) => meets(state, index, o.requires)).map((o) => o.id),
      situation: {
        gameId: game.id,
        period: live.period,
        clock: live.clock,
        score: [live.score[0], live.score[1]],
        userSide,
        offense: current.pendingMoment?.offense ?? live.possession,
      },
    };
    state.career.pending.push(interrupt);
    return interrupt;
  }
  if (forced) {
    const won = live.score[userSide] > live.score[userSide === 0 ? 1 : 0];
    if ((forced === 'win') !== won) {
      // Replay with a different stream until God Mode gets its result.
      for (let attempt = 1; attempt <= 40; attempt++) {
        const again = startGame({
          gameId: game.id,
          rules: rulesFor(live.rulesId),
          home: live.teams[0],
          away: live.teams[1],
          homeCourt: live.homeCourt,
          seed: `${state.world.seed}#forced${attempt}`,
          recordPlays: true,
        });
        runGame(again, null);
        const ok =
          again.score[userSide] > again.score[userSide === 0 ? 1 : 0] === (forced === 'win');
        Object.assign(live, again);
        if (ok) break;
      }
    }
    state.career.godMode.forceNextGame = null;
  }
  finishUserGame(state, index, game, current);
  state.career.cursor.finished = current;
  state.career.cursor.live = null;
  return null;
}

export interface MomentResult {
  readonly success: boolean;
  readonly clip: ClipSpec;
}

/**
 * What his timing on the skill check is worth, in log-odds: a perfect release adds about as
 * much as a hot streak, a bad one costs the same. No timing (bots, simulate ahead) is neutral.
 */
export function timingEdge(timing: number | undefined): number {
  if (timing === undefined || !Number.isFinite(timing)) return 0;
  return (clamp(timing, 0, 1) - 0.5) * 1.2;
}

export function resolveKeyMoment(
  state: GameState,
  index: ContentIndex,
  interrupt: Extract<Interrupt, { kind: 'keyMoment' }>,
  optionId: string,
  timing?: number,
): MomentResult {
  const current = state.career.cursor.live;
  const def = index.moment.get(interrupt.momentId);
  const option = def?.options.find((o) => o.id === optionId);
  if (!current?.pendingMoment || !def || !option || !interrupt.options.includes(optionId))
    throw new Error('no such key moment option');
  const { live, userSide } = current;
  const user = userOf(state);
  const traits = mergeTraits(index, user);
  const late = isLastPeriod(live) && live.clock < 240;
  const edge =
    (traits.momentEdge[option.action.kind] ?? 0) +
    (late ? traits.clutchMod : 0) +
    (state.career.form === 'hot' ? 0.06 : state.career.form === 'slump' ? -0.08 : 0) +
    (option.action.kind === 'pain' ? 0 : timingEdge(timing));
  const forced = state.career.godMode.forceNextMoment;
  const offense = current.pendingMoment.offense;
  const scoreBefore = margin(live.score, userSide);
  const outcome = resolveMoment({
    live,
    def,
    option,
    offense,
    userSide,
    userJersey: user.jersey,
    edge,
    forced,
    seed: state.world.seed,
  });
  state.career.godMode.forceNextMoment = null;

  if (outcome.script) {
    live.possession = offense;
    playScripted(live, offense, outcome.script);
  } else if (outcome.playedThroughPain === false) {
    removeFromGame(live, userSide, userIndexOn(live, userSide));
    live.momentsUsed += 1;
  } else {
    live.momentsUsed += 1;
  }
  if (outcome.playedThroughPain !== null) {
    const rng = createRng(state.world.seed, 'pain', live.gameId);
    const why = cause(state, 'moment', def.id, optionId);
    if (outcome.playedThroughPain) {
      user.injury = {
        kind: 'ankleSprain',
        severity: 'minor',
        weeksLeft: 1,
        since: state.world.date,
        playedThrough: true,
      };
      state.career.flags['played_hurt'] = { setAt: weekIndex(state.world.date), cause: why };
      state.career.feats.playedHurt += 1;
      state.career.scheduled.push({
        consequence: 'chronic_injury',
        due: weekIndex(state.world.date) + rng.int(6, 20),
        chance: 0.35,
        cause: why,
      });
      pushTimeline(state, msg('timeline.playedHurt'), why, true);
    } else {
      user.injury = {
        kind: 'ankleSprain',
        severity: 'minor',
        weeksLeft: 1,
        since: state.world.date,
        playedThrough: false,
      };
      pushTimeline(state, msg('timeline.satOut'), why, false);
    }
  }

  // A shot that turns a tie or deficit into a lead in the final seconds is a game-winner (if it holds).
  const scoreAfter = margin(live.score, userSide);
  const finalSeconds = isLastPeriod(live) && live.clock <= 12;
  if (finalSeconds && outcome.success && scoreBefore <= 0 && scoreAfter > 0)
    state.career.flags['pending_game_winner'] = {
      setAt: weekIndex(state.world.date),
      cause: cause(state, 'moment', def.id, optionId),
    };
  if (
    finalSeconds &&
    !outcome.success &&
    option.action.kind === 'shot' &&
    scoreBefore <= 0 &&
    scoreBefore >= -2
  ) {
    state.career.feats.clutchMisses += 1;
    socialReactions(state, index, ['clutchMiss'], `clutch-${live.gameId}`, 1);
  }

  const kind = option.action.kind;
  state.career.tendencies[`${kind}:${optionId}`] =
    (state.career.tendencies[`${kind}:${optionId}`] ?? 0) + 1;
  if (outcome.success && kind !== 'pain') {
    state.career.moveUses[option.clip] = (state.career.moveUses[option.clip] ?? 0) + 1;
    changeStatus(state, index, 'coachTrust', 0.8);
    changeStatus(state, index, 'confidence', 1.5);
    if (!state.career.signature && (state.career.moveUses[option.clip] ?? 0) >= 6) {
      state.career.signature = option.clip;
      pushTimeline(
        state,
        msg('timeline.signatureMove', { clip: option.clip }),
        cause(state, 'moment', def.id, optionId),
        true,
      );
      pushFeed(state, 'milestone', msg('feed.signatureMove', { clip: option.clip }));
    }
  } else if (kind !== 'pain') {
    changeStatus(state, index, 'coachTrust', -0.4);
    changeStatus(state, index, 'confidence', -1);
  }
  pushFeed(
    state,
    'moment',
    msg(`moments.${def.id}.options.${optionId}.${outcome.success ? 'success' : 'failure'}`),
    {
      gameId: live.gameId,
      data: {
        template: outcome.clip.template,
        outcome: outcome.clip.outcome,
        success: outcome.success ? 1 : 0,
        period: outcome.clip.period,
        clock: Math.round(outcome.clip.clock),
      },
    },
  );
  // Big moments in big games are what scouts write about.
  if (
    kind !== 'pain' &&
    (current.context === 'tournament' ||
      current.context === 'international' ||
      current.context === 'rivalry' ||
      current.context === 'showcase')
  ) {
    state.career.stock += outcome.success ? 0.15 : -0.1;
  }
  current.momentBudget -= 1;
  current.pendingMoment = null;
  state.career.pending = state.career.pending.filter((p) => p.id !== interrupt.id);
  return { success: outcome.success, clip: outcome.clip };
}

function margin(score: readonly [number, number], side: Side): number {
  return score[side] - score[side === 0 ? 1 : 0];
}

/** Hollinger's game score: one number for a stat line. */
export function gameScore(l: PlayerLine): number {
  return (
    l.pts +
    0.4 * l.fgm -
    0.7 * l.fga -
    0.4 * (l.fta - l.ftm) +
    0.7 * l.orb +
    0.3 * l.drb +
    l.stl +
    0.7 * l.ast +
    0.7 * l.blk -
    0.4 * l.pf -
    l.tov
  );
}

function finishUserGame(
  state: GameState,
  index: ContentIndex,
  game: GameRecord,
  current: LiveUserGame,
): void {
  const { live, userSide } = current;
  finishGame(state.world, game, live, true);
  const user = userOf(state);
  const career = state.career;
  const own = live.stats[userSide];
  const line = own.find((l) => l.id === user.id);
  const won = live.score[userSide] > live.score[userSide === 0 ? 1 : 0];
  const opponentId: TeamId = userSide === 0 ? game.away : game.home;
  const teamId: TeamId = userSide === 0 ? game.home : game.away;
  const finalMargin = margin(live.score, userSide);

  const winnerFlag = career.flags['pending_game_winner'];
  delete career.flags['pending_game_winner'];
  const gameWinner = !!winnerFlag && won;
  if (gameWinner) {
    career.feats.gameWinners += 1;
    pushTimeline(
      state,
      msg('timeline.gameWinner', { opponent: teamRef(opponentId) }),
      winnerFlag.cause,
      true,
    );
  }
  if (won) career.feats.wins += 1;
  if (won && game.tournamentId) career.feats.tournamentWins += 1;
  if (game.league === 'national') career.feats.internationalCaps += line ? 1 : 0;

  const minutes = (line?.sec ?? 0) / 60;
  const played = !!line && minutes > 0;
  let vsExpected = 0;
  if (line && played) {
    const ovr = overallOf(user.skills, user.position, user.heightCm);
    const expected = (minutes / 40) * (8 + (ovr - 45) * 0.45);
    const score = gameScore(line);
    vsExpected = score - expected;
    career.recent.push({ gameId: game.id, date: game.date, won, score, vsExpected, pts: line.pts });
    if (career.recent.length > 12) career.recent.shift();
    const traits = mergeTraits(index, user);
    changeStatus(state, index, 'confidence', clamp(vsExpected * 0.9, -8, 8) + (won ? 1 : -1));
    changeStatus(state, index, 'coachTrust', clamp(vsExpected * 0.35, -3, 3));
    changeStatus(state, index, 'energy', -minutes / 5);
    const big = vsExpected >= 6 && line.pts >= 18;
    if (big)
      changeStatus(
        state,
        index,
        'reputation',
        game.kind === 'tournament' || game.league === 'national' ? 3 : 2,
      );
    if (game.league === 'national' || game.kind === 'tournament')
      career.stock += clamp(vsExpected * 0.04, -0.5, 0.5);
    // Chasing his own numbers in a loss hurts the room.
    const teamFga = own.reduce((s, l) => s + l.fga, 0);
    if (!won && line.fga >= 12 && line.fga / Math.max(1, teamFga) > 0.36 && line.ast <= 1) {
      changeStatus(state, index, 'chemistry', -2);
      career.flags['chased_stats'] = {
        setAt: weekIndex(state.world.date),
        cause: cause(state, 'game', game.id),
      };
    }
    recordFeats(state, line);
    approachReaction(state, index, line, won, vsExpected);
    earnPoints(
      state,
      gamePoints(minutes, vsExpected, won, ageAt(user.birthYear, state.world.date)),
    );
    updateForm(state, traits.slumpResist);
    // Injury: tired legs and old knocks raise the odds.
    const risk =
      traits.injuryRisk *
      (user.energy < 30 ? 1.6 : 1) *
      (1 + user.chronic.length * 0.3) *
      (user.injury?.playedThrough ? 2 : 1);
    if (!user.injury || user.injury.playedThrough) {
      const injury = rollInjury(
        createRng(state.world.seed, 'userInjury', game.id),
        game.date,
        minutes,
        risk,
        traits.recovery,
      );
      if (injury) {
        user.injury = injury;
        pushFeed(
          state,
          'injury',
          msg(`feed.injury.${injury.severity}`, { injury: injury.kind, weeks: injury.weeksLeft }),
        );
        pushTimeline(
          state,
          msg('timeline.injured', { injury: injury.kind, weeks: injury.weeksLeft }),
          cause(state, 'game', game.id),
          injury.severity !== 'minor',
        );
        socialReactions(state, index, ['injury'], `injury-${game.id}`, 1);
      }
    }
  }
  checkTraitUnlocks(state, index);

  const headline = current.absent
    ? `missed.${current.absent}`
    : !played
      ? 'dnp'
      : gameWinner
        ? 'gameWinner'
        : vsExpected >= 8
          ? 'bigGame'
          : vsExpected <= -6
            ? 'badGame'
            : won
              ? finalMargin >= 15
                ? 'blowoutWin'
                : finalMargin <= 4
                  ? 'closeWin'
                  : 'win'
              : finalMargin <= -15
                ? 'blowoutLoss'
                : finalMargin >= -4
                  ? 'closeLoss'
                  : 'loss';
  pushFeed(
    state,
    'game',
    msg(`feed.game.${headline}`, {
      team: teamRef(teamId),
      opponent: teamRef(opponentId),
      us: live.score[userSide],
      them: live.score[userSide === 0 ? 1 : 0],
      pts: line?.pts ?? 0,
    }),
    {
      gameId: game.id,
      data: {
        us: live.score[userSide],
        them: live.score[userSide === 0 ? 1 : 0],
        overtimes: Math.max(0, live.period - rulesFor(live.rulesId).periods),
        min: Math.round(minutes),
        pts: line?.pts ?? 0,
        reb: (line?.orb ?? 0) + (line?.drb ?? 0),
        ast: line?.ast ?? 0,
        stl: line?.stl ?? 0,
        blk: line?.blk ?? 0,
        fgm: line?.fgm ?? 0,
        fga: line?.fga ?? 0,
        tpm: line?.tpm ?? 0,
        tpa: line?.tpa ?? 0,
        pm: line?.pm ?? 0,
      },
    },
  );

  const triggers: SocialTrigger[] = [];
  if (gameWinner) triggers.push('gameWinner');
  if (played && vsExpected >= 7) triggers.push('bigGame');
  if (played && vsExpected <= -6) triggers.push('badGame');
  const opponent = state.world.teams[opponentId];
  const ours = state.world.teams[teamId];
  if (
    won &&
    opponent?.kind === 'college' &&
    ours?.kind === 'college' &&
    opponent.prestige - ours.prestige >= 20
  )
    triggers.push('upset');
  triggers.push(won ? 'win' : 'loss');
  socialReactions(state, index, triggers, `game-${game.id}`, gameWinner ? 3 : 2);
}

function recordFeats(state: GameState, l: PlayerLine): void {
  const f = state.career.feats;
  const reb = l.orb + l.drb;
  const tens = [l.pts, reb, l.ast, l.stl, l.blk].filter((v) => v >= 10).length;
  if (l.pts >= 30) f.thirtyPointGames += 1;
  if (tens >= 2) f.doubleDoubles += 1;
  if (tens >= 3) f.tripleDoubles += 1;
  if (reb >= 10) f.tenReboundGames += 1;
  if (l.ast >= 10) f.tenAssistGames += 1;
  if (l.blk >= 5) f.fiveBlockGames += 1;
  if (l.stl >= 4) f.fourStealGames += 1;
  if (l.tpm >= 6) f.sixThreeGames += 1;
}

/** Three strong games make him hot; three poor ones start a slump that lasts until broken. */
function updateForm(state: GameState, slumpResist: number): void {
  const career = state.career;
  const last3 = career.recent.slice(-3);
  const latest = last3[last3.length - 1];
  if (!latest) return;
  const why = cause(state, 'game', latest.gameId);
  if (career.form === 'slump') {
    if (
      latest.vsExpected >= 3 ||
      createRng(state.world.seed, 'slump', latest.gameId).chance(slumpResist * 0.25)
    ) {
      career.form = null;
      pushTimeline(state, msg('timeline.slumpOver'), why, false);
    }
    return;
  }
  if (last3.length === 3 && last3.every((g) => g.vsExpected <= -4)) {
    career.form = 'slump';
    pushTimeline(state, msg('timeline.slump'), why, true);
    pushFeed(state, 'news', msg('feed.slump'));
  } else if (last3.length === 3 && last3.every((g) => g.vsExpected >= 4)) {
    if (career.form !== 'hot') pushFeed(state, 'news', msg('feed.hot'));
    career.form = 'hot';
  } else if (career.form === 'hot' && latest.vsExpected < 0) {
    career.form = null;
  }
}

export function userOnRoster(state: GameState, teamId: TeamId): boolean {
  return !!state.world.teams[teamId]?.roster.some(
    (id) => id === state.career.playerId && isPlayer(state.world.people[id]),
  );
}

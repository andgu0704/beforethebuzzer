import { clamp, logistic, logit, shiftProbability } from '../core/math';
import { createRng, restoreRng, type Rng } from '../core/rng';
import type { GameId } from '../core/ids';
import {
  COLLEGE_RULES,
  INTERNATIONAL_RULES,
  PRO_RULES,
  totalRegulationSec,
  type LeagueRules,
} from './rules';
import { pickOnCourt, teamAverage, type RatingsKey } from './sim-helpers';
import {
  emptyLine,
  type LiveGame,
  type MomentHook,
  type PlayKind,
  type PossessionScript,
  type ShotType,
  type Side,
  type SimPlayer,
  type SimTeam,
} from './types';

const AVERAGE_KEYS: readonly RatingsKey[] = [
  'three',
  'mid',
  'rim',
  'post',
  'ft',
  'pass',
  'security',
  'perD',
  'intD',
  'reb',
  'blk',
  'stl',
  'discipline',
  'scoring',
];
const SUB_WINDOW: Record<LeagueRules['id'], number> = {
  college: 240,
  pro: 180,
  international: 180,
};
const CLUTCH_SEC = 240;
/** Rating points per unit of log-odds on a shot. Larger means skill gaps matter less. */
const SHOT_SCALE = 44;

export function rulesFor(id: LeagueRules['id']): LeagueRules {
  return id === 'college' ? COLLEGE_RULES : id === 'pro' ? PRO_RULES : INTERNATIONAL_RULES;
}

export interface StartOptions {
  readonly gameId: GameId;
  readonly rules: LeagueRules;
  readonly home: SimTeam;
  readonly away: SimTeam;
  readonly homeCourt: boolean;
  readonly seed: string;
  readonly recordPlays: boolean;
}

export function startGame(o: StartOptions): LiveGame {
  const rng = createRng(o.seed, 'game', o.gameId);
  const live: LiveGame = {
    gameId: o.gameId,
    rulesId: o.rules.id,
    teams: [o.home, o.away],
    homeCourt: o.homeCourt,
    rng: rng.snapshot(),
    period: 1,
    clock: o.rules.periodSec,
    elapsed: 0,
    score: [0, 0],
    possession: rng.chance(0.5) ? 0 : 1,
    onCourt: [[], []],
    stats: [
      o.home.players.map((p) => emptyLine(p.id, p.starter)),
      o.away.players.map((p) => emptyLine(p.id, p.starter)),
    ],
    stint: [o.home.players.map(() => 0), o.away.players.map(() => 0)],
    teamFouls: [0, 0],
    nextSubAt: 0,
    transition: false,
    finished: false,
    momentsUsed: 0,
    out: [[], []],
    recordPlays: o.recordPlays,
    plays: [],
  };
  live.rng = rng.snapshot();
  return live;
}

/**
 * Plays until the game ends or `hook` asks to pause before a possession. Returns true if
 * it paused for a key moment; the caller then resolves it with `playScripted`.
 */
export function runGame(live: LiveGame, hook: MomentHook | null): boolean {
  const rules = rulesFor(live.rulesId);
  const rng = restoreRng(live.rng);
  const sim = new Sim(live, rules, rng);
  const paused = sim.run(hook);
  live.rng = rng.snapshot();
  return paused;
}

/** Plays one possession with a predetermined outcome, then returns control. */
export function playScripted(live: LiveGame, offense: Side, script: PossessionScript): void {
  const rules = rulesFor(live.rulesId);
  const rng = restoreRng(live.rng);
  const sim = new Sim(live, rules, rng);
  sim.scripted(offense, script);
  live.rng = rng.snapshot();
}

/** Seconds left in the game's current regulation or overtime period count as "late". */
export function isLastPeriod(live: LiveGame): boolean {
  return live.period >= rulesFor(live.rulesId).periods;
}

export function margin(live: LiveGame, side: Side): number {
  return live.score[side] - live.score[side === 0 ? 1 : 0];
}

class Sim {
  private readonly regulation: number;
  /** Team averages for the current lineups; reset whenever a lineup changes. */
  private readonly averages = new Float64Array(2 * AVERAGE_KEYS.length * 2).fill(Number.NaN);
  /** Log-odds of the league's base rates, computed once. */
  private readonly baseLogit: Readonly<
    Record<'rim' | 'post' | 'mid' | 'three' | 'turnover' | 'offRebound', number>
  >;

  private avg(side: Side, key: RatingsKey, mode: 'mean' | 'max' = 'mean'): number {
    const slot =
      (side * AVERAGE_KEYS.length + AVERAGE_KEYS.indexOf(key)) * 2 + (mode === 'max' ? 1 : 0);
    let v = this.averages[slot] ?? Number.NaN;
    if (Number.isNaN(v)) {
      v = teamAverage(this.g, side, key, mode);
      this.averages[slot] = v;
    }
    return v;
  }

  constructor(
    private readonly g: LiveGame,
    private readonly rules: LeagueRules,
    private readonly rng: Rng,
  ) {
    this.regulation = totalRegulationSec(rules);
    this.baseLogit = {
      rim: logit(rules.make.rim),
      post: logit(rules.make.post),
      mid: logit(rules.make.mid),
      three: logit(rules.make.three),
      turnover: logit(rules.turnover),
      offRebound: logit(rules.offRebound),
    };
  }

  run(hook: MomentHook | null): boolean {
    const g = this.g;
    while (!g.finished) {
      if (g.clock <= 0) {
        this.endPeriod();
        continue;
      }
      if (g.elapsed >= g.nextSubAt || g.onCourt[0].length < 5 || g.onCourt[1].length < 5)
        this.substitute();
      if (hook?.({ live: g, offense: g.possession })) return true;
      this.possession(g.possession, null);
    }
    return false;
  }

  scripted(offense: Side, script: PossessionScript): void {
    const g = this.g;
    if (g.elapsed >= g.nextSubAt || g.onCourt[0].length < 5 || g.onCourt[1].length < 5)
      this.substitute();
    g.momentsUsed += 1;
    this.possession(offense, script);
  }

  // ---------------------------------------------------------------- periods and rotation

  private endPeriod(): void {
    const g = this.g;
    const rules = this.rules;
    if (g.period >= rules.periods && g.score[0] !== g.score[1]) {
      g.finished = true;
      return;
    }
    g.period += 1;
    g.clock = g.period > rules.periods ? rules.overtimeSec : rules.periodSec;
    if (g.period <= rules.periods) g.teamFouls = [0, 0];
    g.possession = g.period % 2 === 0 ? 1 : 0;
    g.nextSubAt = g.elapsed;
  }

  private substitute(): void {
    const g = this.g;
    for (const side of [0, 1] as const) g.onCourt[side] = this.chooseLineup(side);
    this.averages.fill(Number.NaN);
    g.nextSubAt = g.elapsed + SUB_WINDOW[this.rules.id] * (0.75 + this.rng.next() * 0.5);
  }

  private chooseLineup(side: Side): number[] {
    const g = this.g;
    const team = g.teams[side];
    const stats = g.stats[side];
    const rules = this.rules;
    const periodStart =
      g.clock >= (g.period > rules.periods ? rules.overtimeSec : rules.periodSec) - 1;
    const restartsWithStarters =
      periodStart &&
      (g.period === 1 ||
        (rules.periods === 4 && g.period === 3) ||
        (rules.periods === 2 && g.period === 2));
    const late = g.period >= rules.periods;
    const diff = Math.abs(g.score[0] - g.score[1]);
    const garbage = late && g.clock < 300 && diff >= 18;
    const clutch = (late && g.clock < CLUTCH_SEC && diff <= 10) || g.period > rules.periods;
    const progress = clamp((g.elapsed + SUB_WINDOW[rules.id]) / this.regulation, 0, 1);

    const scored = team.players.map((p, i) => {
      const line = stats[i];
      if (!line) return { i, score: -Infinity };
      if (line.pf >= rules.foulOut) return { i, score: -Infinity };
      if (g.out[side].includes(i)) return { i, score: -Infinity };
      let score: number;
      if (clutch) {
        score = p.targetSec * 2 + p.r.scoring;
      } else if (garbage) {
        score = -p.targetSec + this.rng.next() * 50;
      } else {
        score = p.targetSec * progress - line.sec;
        if (restartsWithStarters && p.starter) score += 10000;
        const stint = g.stint[side][i] ?? 0;
        const fatigueAt = 360 + p.stamina * 3;
        if (stint > fatigueAt) score -= (stint - fatigueAt) * 2;
        if (!late && line.pf >= rules.foulOut - 2 && rules.periods === 2 && g.period === 1)
          score -= 400;
        if (line.pf >= rules.foulOut - 1 && !late) score -= 600;
      }
      if (p.targetSec <= 0 && !garbage) score -= 5000;
      return { i, score };
    });

    scored.sort((a, b) => b.score - a.score || a.i - b.i);
    const eligible = scored.filter((s) => s.score > -Infinity);
    const lineup = eligible.slice(0, 5).map((s) => s.i);
    // Keep at least one ball handler on the floor when one is available.
    const isHandler = (i: number) => {
      const pos = team.players[i]?.position;
      return pos === 'PG' || pos === 'SG';
    };
    if (!lineup.some(isHandler)) {
      const handler = eligible.find((s) => isHandler(s.i));
      if (handler && lineup.length === 5) lineup[4] = handler.i;
    }
    for (let i = 0; i < team.players.length; i++) {
      if (!lineup.includes(i)) g.stint[side][i] = 0;
    }
    return lineup;
  }

  // ---------------------------------------------------------------- one possession

  private possession(offense: Side, script: PossessionScript | null): void {
    const g = this.g;
    const defense: Side = offense === 0 ? 1 : 0;
    const rules = this.rules;
    const lastPeriod = g.period >= rules.periods;
    const lead = margin(g, offense);
    const transition = g.transition;
    g.transition = false;

    // Late-game fouling by the trailing defence.
    if (
      !script &&
      lastPeriod &&
      g.clock < 50 &&
      lead >= 1 &&
      lead <= (rules.id === 'college' ? 8 : 6) &&
      this.rng.chance(0.85)
    ) {
      this.tick(Math.min(g.clock, 2 + this.rng.next() * 5));
      const target = this.worstShooter(offense);
      this.foul(defense);
      this.freeThrows(offense, target, 2);
      this.afterFreeThrowsMiss(offense, defense);
      return;
    }

    let duration = script ? script.duration : this.possessionLength(transition, lastPeriod, lead);
    if (duration >= g.clock) duration = Math.max(0.5, g.clock - 0.3);
    const hurried = g.clock - duration < 1.5 && g.clock < rules.shotClock;
    this.tick(duration);

    if (script?.kind === 'turnover') {
      this.turnover(offense, defense, script.by, script.stolenBy);
      return;
    }

    if (!script) {
      if (this.rng.chance(this.turnoverChance(offense, defense))) {
        const by = pickOnCourt(this.rng, g, offense, (p) => p.usage * (110 - p.r.security));
        const stealChance =
          0.42 * (this.avg(defense, 'stl') / 50) * (0.85 + g.teams[defense].tactics.pressure / 330);
        const stolenBy = this.rng.chance(stealChance)
          ? pickOnCourt(this.rng, g, defense, (p) => p.r.stl * p.r.stl)
          : null;
        this.turnover(offense, defense, by, stolenBy);
        return;
      }
      if (this.rng.chance(rules.looseFoul * (0.8 + g.teams[defense].tactics.pressure / 250))) {
        this.foul(defense);
        if (g.teamFouls[defense] >= rules.bonusAt) {
          const target = pickOnCourt(this.rng, g, offense, (p) => p.usage);
          const oneAndOne =
            rules.oneAndOneUntil !== null && g.teamFouls[defense] < rules.oneAndOneUntil;
          const made = this.freeThrows(offense, target, oneAndOne ? 1 : 2, oneAndOne);
          if (made === 0 || (!oneAndOne && !this.lastFtMade)) {
            this.afterFreeThrowsMiss(offense, defense);
          } else {
            g.possession = defense;
          }
          return;
        }
      }
    }

    // Shot attempts; offensive rebounds keep the possession alive.
    let first = true;
    for (let attempt = 0; attempt < 5; attempt++) {
      const forced = first && script ? script : null;
      first = false;
      const outcome = this.shot(
        offense,
        defense,
        forced,
        transition && attempt === 0,
        hurried && attempt === 0,
        lastPeriod,
        lead,
      );
      if (outcome !== 'miss') {
        g.possession = defense;
        g.transition = false;
        return;
      }
      if (this.offensiveRebound(offense, defense)) {
        const putback = Math.min(g.clock - 0.2, 3 + this.rng.next() * 6);
        if (putback <= 0.3) {
          g.possession = defense;
          return;
        }
        this.tick(putback);
        continue;
      }
      g.possession = defense;
      g.transition = this.rng.chance(0.12);
      return;
    }
    g.possession = defense;
  }

  private possessionLength(transition: boolean, lastPeriod: boolean, lead: number): number {
    const g = this.g;
    const rules = this.rules;
    if (transition) return 4 + this.rng.next() * 5;
    const pace = (g.teams[0].tactics.pace + g.teams[1].tactics.pace) / 2;
    const mean = rules.possessionSec * (1.18 - pace / 270);
    if (lastPeriod && g.clock < 150 && lead > 0) return Math.min(rules.shotClock - 1, mean + 9);
    if (lastPeriod && g.clock <= rules.shotClock + 2 && lead === 0)
      return Math.max(1, g.clock - 1.5);
    return clamp(mean + this.rng.normal(0, mean * 0.38), 3, rules.shotClock - 0.5);
  }

  private turnoverChance(offense: Side, defense: Side): number {
    const g = this.g;
    const sec = this.avg(offense, 'security');
    const stl = this.avg(defense, 'stl');
    const pressure = (g.teams[defense].tactics.pressure - 50) / 160;
    return logistic(this.baseLogit.turnover - (sec - stl) / 60 + pressure);
  }

  // ---------------------------------------------------------------- shooting

  private shot(
    offense: Side,
    defense: Side,
    forced: PossessionScript | null,
    transition: boolean,
    hurried: boolean,
    lastPeriod: boolean,
    lead: number,
  ): 'made' | 'miss' | 'fouled' {
    const g = this.g;
    const rules = this.rules;
    const offTeam = g.teams[offense];

    let shooter: number;
    let type: ShotType;
    let forcedMade: boolean | null = null;
    let forcedAssist: number | null | undefined;
    let forcedFoul: boolean | null = null;
    let forcedBlock: number | null = null;

    if (forced?.kind === 'shot') {
      shooter = forced.shooter;
      type = forced.shotType;
      forcedMade = forced.made;
      forcedAssist = forced.assistBy;
      forcedFoul = forced.fouled;
    } else {
      shooter = pickOnCourt(this.rng, g, offense, (p) => p.usage * p.r.scoring * p.r.scoring);
      const sp = offTeam.players[shooter];
      if (!sp) return 'miss';
      type = this.shotType(sp, offTeam, transition, lastPeriod, lead);
      if (forced?.kind === 'defence') {
        type = forced.shotType;
        forcedMade = forced.made;
        forcedBlock = forced.blockedBy;
        forcedFoul = false;
      }
    }
    const sp = offTeam.players[shooter];
    if (!sp) return 'miss';

    // Was it set up by a pass?
    const passerQuality = this.avg(offense, 'pass');
    const setUp =
      forcedAssist !== undefined
        ? forcedAssist !== null
        : this.rng.chance(rules.assist[type] * (0.62 + passerQuality / 140));

    const defender = this.matchup(defense, sp);
    const rimProtect = this.avg(defense, 'intD', 'max');
    const offRating = sp.r[type];
    const defRating =
      type === 'rim' || type === 'post' ? defender.intD * 0.55 + rimProtect * 0.45 : defender.perD;
    let delta = (offRating - defRating) / SHOT_SCALE + sp.shotMod;
    if (g.homeCourt) delta += offense === 0 ? rules.homeEdge : -rules.homeEdge;
    if (setUp) delta += 0.14;
    if (transition) delta += 0.35;
    if (hurried) delta -= 0.6;
    const clutch = lastPeriod && g.clock < CLUTCH_SEC && Math.abs(lead) <= 8;
    if (clutch) delta += sp.clutchMod;
    const stint = g.stint[offense][shooter] ?? 0;
    const tireAt = 420 + sp.stamina * 3;
    if (stint > tireAt) delta -= Math.min(0.35, (stint - tireAt) / 900);
    const makeP = logistic(this.baseLogit[type] + delta);

    const foulBase = { rim: 0.19, post: 0.18, mid: 0.065, three: 0.017 }[type];
    const fouled =
      forcedFoul ??
      this.rng.chance(
        foulBase *
          (0.8 + g.teams[defense].tactics.pressure / 250) *
          (1.25 - defender.discipline / 200),
      );
    const made = forcedMade ?? this.rng.chance(fouled ? makeP * 0.55 : makeP);
    const line = g.stats[offense][shooter];
    if (!line) return 'miss';
    const points = type === 'three' ? 3 : 2;

    if (fouled) {
      const defIndex = this.defenderIndex(defense, sp);
      this.foul(defense, defIndex);
      if (made) {
        this.scoreFieldGoal(offense, shooter, type, setUp, forcedAssist);
        this.freeThrows(offense, shooter, 1);
        if (!this.lastFtMade) this.afterFreeThrowsMiss(offense, defense);
        return 'fouled';
      }
      this.freeThrows(offense, shooter, points);
      if (!this.lastFtMade) {
        this.afterFreeThrowsMiss(offense, defense);
        return 'fouled';
      }
      return 'fouled';
    }

    if (made) {
      this.scoreFieldGoal(offense, shooter, type, setUp, forcedAssist);
      return 'made';
    }

    line.fga += 1;
    if (type === 'three') line.tpa += 1;
    this.record(offense, shooter, type === 'three' ? 'miss3' : 'miss2', { shot: type });
    const blockEdge = this.avg(defense, 'blk', 'max') / 62;
    const blockChance =
      { rim: 0.2, post: 0.16, mid: 0.035, three: 0.012 }[type] * blockEdge * Math.sqrt(blockEdge);
    const blocker =
      forcedBlock ??
      (this.rng.chance(blockChance)
        ? pickOnCourt(this.rng, g, defense, (p) => p.r.blk * p.r.blk * p.r.blk)
        : null);
    if (blocker !== null) {
      const bLine = g.stats[defense][blocker];
      if (bLine) bLine.blk += 1;
      this.record(defense, blocker, 'blk', { vs: shooter });
    }
    return 'miss';
  }

  private shotType(
    p: SimPlayer,
    team: SimTeam,
    transition: boolean,
    lastPeriod: boolean,
    lead: number,
  ): ShotType {
    const g = this.g;
    const threeBias = this.rules.threeAppetite * (0.72 + team.tactics.threeRate / 180);
    let three = p.tend.three * threeBias;
    let rim = p.tend.rim;
    let mid = p.tend.mid;
    const post = p.tend.post;
    if (transition) {
      rim *= 2.4;
      mid *= 0.5;
    }
    if (lastPeriod && g.clock < 40 && lead <= -3 && lead >= -6) three *= 8;
    if (lastPeriod && g.clock < 150 && lead > 0) mid *= 1.2;
    const total = three + rim + mid + post;
    let roll = this.rng.next() * total;
    if ((roll -= three) < 0) return 'three';
    if ((roll -= rim) < 0) return 'rim';
    if ((roll -= mid) < 0) return 'mid';
    return 'post';
  }

  private matchup(defense: Side, shooter: SimPlayer): SimPlayer['r'] {
    return this.g.teams[defense].players[this.defenderIndex(defense, shooter)]?.r ?? shooter.r;
  }

  private defenderIndex(defense: Side, shooter: SimPlayer): number {
    const order = ['PG', 'SG', 'SF', 'PF', 'C'];
    const target = order.indexOf(shooter.position);
    let best = this.g.onCourt[defense][0] ?? 0;
    let bestGap = Infinity;
    for (const i of this.g.onCourt[defense]) {
      const pos = this.g.teams[defense].players[i]?.position ?? 'SF';
      const gap = Math.abs(order.indexOf(pos) - target);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    return best;
  }

  private scoreFieldGoal(
    offense: Side,
    shooter: number,
    type: ShotType,
    setUp: boolean,
    forcedAssist: number | null | undefined,
  ): void {
    const g = this.g;
    const line = g.stats[offense][shooter];
    if (!line) return;
    const points = type === 'three' ? 3 : 2;
    line.fga += 1;
    line.fgm += 1;
    if (type === 'three') {
      line.tpa += 1;
      line.tpm += 1;
    }
    line.pts += points;
    this.addPoints(offense, points);
    this.record(offense, shooter, type === 'three' ? 'fg3' : 'fg2', { shot: type });
    if (setUp) {
      const assister =
        forcedAssist ??
        pickOnCourt(this.rng, g, offense, (p, i) =>
          i === shooter ? 0 : p.r.pass * p.r.pass * (p.position === 'PG' ? 1.6 : 1),
        );
      if (assister !== shooter) {
        const aLine = g.stats[offense][assister];
        if (aLine) aLine.ast += 1;
        this.record(offense, assister, 'ast');
      }
    }
  }

  // ---------------------------------------------------------------- other outcomes

  private lastFtMade = true;

  /** Shoots `count` free throws (or a one-and-one). Returns how many went in. */
  private freeThrows(offense: Side, shooter: number, count: number, oneAndOne = false): number {
    const g = this.g;
    const p = g.teams[offense].players[shooter];
    const line = g.stats[offense][shooter];
    if (!p || !line) return 0;
    const lastPeriod = g.period >= this.rules.periods;
    const pressure = lastPeriod && g.clock < 60 ? p.clutchMod * 0.5 : 0;
    const prob = shiftProbability(
      clamp(0.455 + p.r.ft * 0.0054, 0.3, 0.95),
      p.shotMod * 0.5 + pressure,
    );
    let made = 0;
    const attempts = oneAndOne ? 1 : count;
    for (let i = 0; i < attempts; i++) {
      line.fta += 1;
      const ok = this.rng.chance(prob);
      this.lastFtMade = ok;
      if (ok) {
        made += 1;
        line.ftm += 1;
        line.pts += 1;
        this.addPoints(offense, 1);
        this.record(offense, shooter, 'ft');
      } else {
        this.record(offense, shooter, 'ftMiss');
      }
    }
    if (oneAndOne && made === 1) {
      line.fta += 1;
      const ok = this.rng.chance(prob);
      this.lastFtMade = ok;
      if (ok) {
        made += 1;
        line.ftm += 1;
        line.pts += 1;
        this.addPoints(offense, 1);
        this.record(offense, shooter, 'ft');
      }
    }
    return made;
  }

  private afterFreeThrowsMiss(offense: Side, defense: Side): void {
    const g = this.g;
    if (this.lastFtMade) {
      g.possession = defense;
      return;
    }
    // Free-throw rebounds go to the defence most of the time.
    if (this.rng.chance(0.13)) {
      const r = pickOnCourt(this.rng, g, offense, (p) => p.r.reb * p.r.reb);
      const line = g.stats[offense][r];
      if (line) line.orb += 1;
      this.record(offense, r, 'reb');
      g.possession = offense;
    } else {
      const r = pickOnCourt(this.rng, g, defense, (p) => p.r.reb * p.r.reb);
      const line = g.stats[defense][r];
      if (line) line.drb += 1;
      this.record(defense, r, 'reb');
      g.possession = defense;
    }
  }

  private offensiveRebound(offense: Side, defense: Side): boolean {
    const g = this.g;
    const offReb = this.avg(offense, 'reb');
    const defReb = this.avg(defense, 'reb');
    const p = logistic(this.baseLogit.offRebound + (offReb - defReb) / 45);
    if (this.rng.chance(p)) {
      const r = pickOnCourt(
        this.rng,
        g,
        offense,
        (pl) => pl.r.reb * pl.r.reb * Math.sqrt(pl.r.reb),
      );
      const line = g.stats[offense][r];
      if (line) line.orb += 1;
      this.record(offense, r, 'reb');
      return true;
    }
    const r = pickOnCourt(this.rng, g, defense, (pl) => pl.r.reb * pl.r.reb * Math.sqrt(pl.r.reb));
    const line = g.stats[defense][r];
    if (line) line.drb += 1;
    this.record(defense, r, 'reb');
    return false;
  }

  private turnover(offense: Side, defense: Side, by: number, stolenBy: number | null): void {
    const g = this.g;
    const line = g.stats[offense][by];
    if (line) line.tov += 1;
    this.record(offense, by, 'tov');
    if (stolenBy !== null) {
      const sLine = g.stats[defense][stolenBy];
      if (sLine) sLine.stl += 1;
      this.record(defense, stolenBy, 'stl', { vs: by });
      g.transition = this.rng.chance(0.6);
    }
    g.possession = defense;
  }

  private foul(defense: Side, index?: number): void {
    const g = this.g;
    const who = index ?? pickOnCourt(this.rng, g, defense, (p) => 130 - p.r.discipline);
    const line = g.stats[defense][who];
    if (line) line.pf += 1;
    g.teamFouls[defense] += 1;
    this.record(defense, who, 'foul');
    if (line && line.pf >= this.rules.foulOut) this.replaceFouledOut(defense, who);
  }

  /** Subs in the next man immediately, so the free throws are shot five on five. */
  private replaceFouledOut(side: Side, who: number): void {
    const g = this.g;
    const lineup = g.onCourt[side].filter((i) => i !== who);
    let best = -1;
    let bestTarget = -Infinity;
    g.teams[side].players.forEach((p, i) => {
      const line = g.stats[side][i];
      if (
        lineup.includes(i) ||
        i === who ||
        !line ||
        line.pf >= this.rules.foulOut ||
        g.out[side].includes(i)
      )
        return;
      if (p.targetSec > bestTarget) {
        bestTarget = p.targetSec;
        best = i;
      }
    });
    if (best >= 0) {
      lineup.push(best);
      g.stint[side][best] = 0;
    }
    g.onCourt[side] = lineup;
    this.averages.fill(Number.NaN);
  }

  private worstShooter(side: Side): number {
    const g = this.g;
    let worst = g.onCourt[side][0] ?? 0;
    let low = Infinity;
    for (const i of g.onCourt[side]) {
      const ft = (g.teams[side].players[i]?.r.ft ?? 50) + this.rng.next() * 25;
      if (ft < low) {
        low = ft;
        worst = i;
      }
    }
    return worst;
  }

  // ---------------------------------------------------------------- bookkeeping

  private tick(sec: number): void {
    const g = this.g;
    const t = Math.min(sec, g.clock);
    g.clock -= t;
    g.elapsed += t;
    for (const side of [0, 1] as const) {
      for (const i of g.onCourt[side]) {
        const line = g.stats[side][i];
        if (line) line.sec += t;
        g.stint[side][i] = (g.stint[side][i] ?? 0) + t;
      }
    }
  }

  private addPoints(side: Side, points: number): void {
    const g = this.g;
    g.score[side] += points;
    const other: Side = side === 0 ? 1 : 0;
    for (const i of g.onCourt[side]) {
      const line = g.stats[side][i];
      if (line) line.pm += points;
    }
    for (const i of g.onCourt[other]) {
      const line = g.stats[other][i];
      if (line) line.pm -= points;
    }
  }

  private record(
    side: Side,
    player: number,
    kind: PlayKind,
    extra: { readonly shot?: ShotType; readonly vs?: number } = {},
  ): void {
    const g = this.g;
    if (!g.recordPlays) return;
    // The lineups ride along whenever they have changed, so a replay knows who was on the floor.
    const changed = lineupChanged(g);
    g.plays.push({
      t: Math.round(g.elapsed * 10) / 10,
      side,
      player,
      kind,
      score: [g.score[0], g.score[1]],
      ...extra,
      ...(changed ? { on: [[...g.onCourt[0]], [...g.onCourt[1]]] as const } : {}),
    });
  }
}

/** Whether the floor has changed since the last lineup written to the play log. */
function lineupChanged(g: LiveGame): boolean {
  for (let i = g.plays.length - 1; i >= 0; i--) {
    const on = g.plays[i]?.on;
    if (!on) continue;
    return on[0].join(',') !== g.onCourt[0].join(',') || on[1].join(',') !== g.onCourt[1].join(',');
  }
  return true;
}

/** Takes a player out for the rest of the game and refills the lineup. */
export function removeFromGame(live: LiveGame, side: Side, index: number): void {
  if (!live.out[side].includes(index)) live.out[side].push(index);
  live.nextSubAt = live.elapsed;
}

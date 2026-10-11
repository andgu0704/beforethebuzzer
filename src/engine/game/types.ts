import type { RngSnapshot } from '../core/rng';
import type { GameId, PersonId, TeamId } from '../core/ids';
import type { CoachTactics } from '../model/person';
import type { PlayerLine } from '../model/game';
import type { Position } from '../model/skills';
import type { GameRatings, Tendencies } from './ratings';

export type ShotType = 'rim' | 'post' | 'mid' | 'three';
export type Side = 0 | 1;

/** A player as the simulator sees him: ratings and context, no world references. */
export interface SimPlayer {
  readonly id: PersonId;
  readonly position: Position;
  readonly r: GameRatings;
  readonly tend: Tendencies;
  /** Target seconds in regulation, from the rotation. */
  readonly targetSec: number;
  readonly starter: boolean;
  /** Share of possessions he finishes, before ratings. */
  readonly usage: number;
  /** Log-odds added to his shots (confidence, form, traits). */
  readonly shotMod: number;
  /** Extra log-odds in clutch time (last four minutes, within eight). */
  readonly clutchMod: number;
  /** 0–100 at tip-off; lower means he tires sooner. */
  readonly stamina: number;
  readonly isUser: boolean;
}

export interface SimTeam {
  readonly teamId: TeamId;
  readonly players: readonly SimPlayer[];
  readonly tactics: CoachTactics;
  /** 1–100. */
  readonly acumen: number;
}

export type PlayKind =
  | 'fg2'
  | 'fg3'
  | 'ft'
  | 'miss2'
  | 'miss3'
  | 'ftMiss'
  | 'ast'
  | 'reb'
  | 'stl'
  | 'blk'
  | 'tov'
  | 'foul';

export interface PlayEvent {
  /** Seconds since tip-off. */
  readonly t: number;
  readonly side: Side;
  readonly player: number;
  readonly kind: PlayKind;
  readonly score: readonly [number, number];
}

/** Everything needed to pause a game mid-way and resume it after a save. */
export interface LiveGame {
  readonly gameId: GameId;
  readonly rulesId: 'college' | 'pro' | 'international';
  /** Index 0 is the home side. */
  readonly teams: readonly [SimTeam, SimTeam];
  /** False on neutral courts. */
  readonly homeCourt: boolean;
  rng: RngSnapshot;
  period: number;
  clock: number;
  elapsed: number;
  score: [number, number];
  possession: Side;
  /** Indices of players on court for each side. */
  onCourt: [number[], number[]];
  stats: [PlayerLine[], PlayerLine[]];
  /** Seconds in the current stint, per player. */
  stint: [number[], number[]];
  teamFouls: [number, number];
  nextSubAt: number;
  /** The next possession starts in transition (after a steal or a long rebound). */
  transition: boolean;
  finished: boolean;
  momentsUsed: number;
  recordPlays: boolean;
  plays: PlayEvent[];
}

export interface MomentCheck {
  readonly live: LiveGame;
  readonly offense: Side;
}

/** Decides whether the coming possession becomes a key moment. Returns true to pause. */
export type MomentHook = (check: MomentCheck) => boolean;

/** A possession whose decisive outcome has already been chosen (by a key moment). */
export type PossessionScript =
  | {
      readonly kind: 'shot';
      readonly shooter: number;
      readonly shotType: ShotType;
      readonly made: boolean;
      readonly assistBy: number | null;
      readonly fouled: boolean;
      readonly duration: number;
    }
  | {
      readonly kind: 'turnover';
      readonly by: number;
      readonly stolenBy: number | null;
      readonly duration: number;
    }
  | {
      readonly kind: 'defence';
      /** The user's side defends; the opponent's shot is forced to this result. */
      readonly made: boolean;
      readonly shotType: ShotType;
      readonly blockedBy: number | null;
      readonly stolenBy: number | null;
      readonly duration: number;
    };

export function emptyLine(id: PersonId, starter: boolean): PlayerLine {
  return {
    id,
    starter,
    sec: 0,
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    orb: 0,
    drb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
    pm: 0,
  };
}

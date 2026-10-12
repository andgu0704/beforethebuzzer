/** Data shapes for the 2D clips. A Play is plain arrays so a worklet can sample it. */

import type { ClipSpec } from '@/engine/game/moments';
import type { ShotType } from '@/engine/game/types';
import type { CourtKind } from './court';

export type ClipOutcome = ClipSpec['outcome'];
export type { ShotType };

/**
 * What the clip needs from a moment. A full ClipSpec fits, and so does a feed entry's data
 * (template, outcome, success, period, clock) with the rest filled from defaults.
 */
export interface PlaySpec {
  readonly template: string;
  readonly outcome: ClipOutcome;
  readonly success: boolean;
  readonly period: number;
  readonly clock: number;
  readonly shotType?: ShotType | null;
  readonly userSide?: 0 | 1;
  readonly userJersey?: number;
  readonly scoreBefore?: readonly [number, number];
  readonly variation?: number;
}

export interface PlayParams {
  /** Line markings, lane width, shot clock and periods follow the level. Default college. */
  readonly court?: CourtKind;
  /** Shot clock length; defaults to 30 (college) or 24 (pro). */
  readonly shotClock?: number;
  /** Regulation periods; defaults to 2 (college) or 4 (pro). */
  readonly periods?: number;
  /** Whether the user shoots or makes the final pass; inferred from the outcome when absent. */
  readonly userRole?: 'shooter' | 'passer';
}

/** The outcome as the clip shows it. */
export type PlayResult =
  | 'make'
  | 'miss'
  | 'block'
  | 'strip'
  | 'pickoff'
  | 'charge'
  | 'deflect'
  | 'foulMake'
  | 'playThrough'
  | 'sit'
  | 'ftBoth'
  | 'ftSplit';

export interface BallTrack {
  /** 0 = held by an actor, 1 = in flight between two points. */
  readonly kind: readonly number[];
  readonly t0: readonly number[];
  readonly t1: readonly number[];
  readonly actor: readonly number[];
  readonly dribble: readonly number[];
  readonly hand: readonly number[];
  readonly riseH: readonly number[];
  readonly riseDur: readonly number[];
  readonly hoopX: readonly number[];
  readonly x0: readonly number[];
  readonly y0: readonly number[];
  readonly h0: readonly number[];
  readonly x1: readonly number[];
  readonly y1: readonly number[];
  readonly h1: readonly number[];
  readonly arc: readonly number[];
}

export interface Play {
  readonly template: string;
  readonly outcome: ClipOutcome;
  readonly result: PlayResult;
  /** Whether the result is good for the user. */
  readonly good: boolean;
  readonly court: CourtKind;
  /** Seconds of play time. */
  readonly duration: number;
  readonly offenseSide: 0 | 1;
  /** Game side (0 home, 1 away) of each of the ten actors; 0–4 offense, 5–9 defense. */
  readonly actorSide: readonly number[];
  readonly actorNumber: readonly number[];
  readonly userActor: number;
  readonly kt: readonly (readonly number[])[];
  readonly kx: readonly (readonly number[])[];
  readonly ky: readonly (readonly number[])[];
  readonly kmx: readonly (readonly number[])[];
  readonly kmy: readonly (readonly number[])[];
  /** Jumps and falls, flattened in fives: actor, t0, t1, amplitude, plateau (0 or 1). */
  readonly lifts: readonly number[];
  readonly ball: BallTrack;
  /** Contest rings, flattened in fours: actor, t0, t1, strength. */
  readonly contests: readonly number[];
  readonly camT: readonly number[];
  readonly camX: readonly number[];
  readonly camM: readonly number[];
  readonly clockStart: number;
  readonly clockRate: number;
  readonly clockFrom: number;
  readonly clockTo: number;
  /** Shot clock at clockFrom; −1 when it is off. */
  readonly shotStart: number;
  readonly shotTo: number;
  /** Play time when the game clock hits zero; −1 when it does not. */
  readonly buzzerAt: number;
  readonly period: number;
  readonly periods: number;
  readonly scoreBefore: readonly [number, number];
  readonly showScore: boolean;
  readonly scoreT: readonly number[];
  readonly scoreSide: readonly number[];
  readonly scorePts: readonly number[];
  readonly phaseT: readonly number[];
  readonly phaseKey: readonly string[];
  /** Play time of the result (the ball reaches the rim, the steal, the whistle). */
  readonly resultT: number;
  /** Start and end of the final beat, replayed slowly for a signature move. */
  readonly beat: readonly [number, number];
  /** Times the ball drops through the net. */
  readonly netT: readonly number[];
  readonly hoopX: number;
}

export interface FrameState {
  /** Play time in seconds. */
  readonly time: number;
  readonly x: number[];
  readonly y: number[];
  /** Jump (positive) or fall (negative), about −1..1. */
  readonly lift: number[];
  readonly ballX: number;
  readonly ballY: number;
  readonly ballH: number;
  readonly ringX: number;
  readonly ringY: number;
  readonly ringR: number;
  /** Contest ring opacity, 0 when none. */
  readonly ringA: number;
  readonly ringActor: number;
  readonly trailX: number[];
  readonly trailY: number[];
  readonly trailH: number[];
  readonly gameClock: number;
  /** −1 when the shot clock is off. */
  readonly shotClock: number;
  readonly score: [number, number];
  readonly phase: number;
  readonly camX: number;
  /** Net ripple progress 0..1, −1 when none. */
  readonly net: number;
  readonly resolved: boolean;
}

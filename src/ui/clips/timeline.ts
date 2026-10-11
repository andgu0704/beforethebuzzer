/**
 * Maps the player's single progress value (0..1) to play time. A signature move adds a short
 * hold on the result and then the final beat again in slow motion, all on the same progress.
 */

import type { Play } from './types';

/** Slow-motion speed of the signature replay. */
export const REPLAY_SPEED = 0.4;
/** Seconds the result holds before the replay starts. */
export const REPLAY_GAP = 0.6;

/** Total seconds of playback. */
export function totalSeconds(play: Play, signature: boolean): number {
  if (!signature) return play.duration;
  return play.duration + REPLAY_GAP + (play.beat[1] - play.beat[0]) / REPLAY_SPEED;
}

/** Progress at which the live play ends (where "skip" lands). */
export function mainEnd(play: Play, signature: boolean): number {
  return play.duration / totalSeconds(play, signature);
}

/** Play time (0..1 of the play) for a progress value, written into out: [t, replay ? 1 : 0]. */
export function timelineAt(play: Play, progress: number, signature: boolean, out: number[]): void {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  if (!signature) {
    out[0] = p;
    out[1] = 0;
    return;
  }
  const replayLen = (play.beat[1] - play.beat[0]) / REPLAY_SPEED;
  const total = play.duration + REPLAY_GAP + replayLen;
  const s = p * total;
  if (s <= play.duration + REPLAY_GAP) {
    out[0] = Math.min(1, s / play.duration);
    out[1] = 0;
    return;
  }
  const r = s - play.duration - REPLAY_GAP;
  out[0] = Math.min(1, (play.beat[0] + r * REPLAY_SPEED) / play.duration);
  out[1] = 1;
}
